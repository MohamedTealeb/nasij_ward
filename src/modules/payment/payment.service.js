// payment.service.js
import axios from 'axios';
import { OrderModel } from '../../config/models/order.model.js';
import { v4 as uuidv4 } from 'uuid';
const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY || 'sk_test_cxC3oG9nj6UFx4BgkcXCUyZU42i9Lwe2wsU6FXk6';
const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

const parseMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      console.warn('Failed to parse Moyasar metadata string:', error.message);
      return {};
    }
  }
  return metadata;
};

const fetchPaymentDetails = async (paymentId) => {
  const url = `${MOYASAR_API_URL}/payments/${encodeURIComponent(paymentId)}`;
  const response = await axios.get(url, {
    auth: {
      username: MOYASAR_SECRET_KEY,
      password: '',
    },
    headers: {
      Accept: 'application/json',
    },
  });
  return response.data;
};

export const createPayment = async (req, res) => {
  try {
    const { orderId, source, callback_url, webhook_url } = req.body;

    if (!orderId || !source || !source.type) {
      return res.status(400).json({
        success: false,
        message: 'orderId and valid source are required',
      });
    }

    const order = await OrderModel.findOne({ _id: orderId, user: req.user._id }).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Use finalPrice which includes tax, shipping, and discount
    const amountInHalalas = Math.round(Number(order.finalPrice || order.totalPrice) * 100);
    const description = `Order ${order.orderNumber || order._id}`;
    const metadata = {
      order_id: String(order._id),
      order_number: order.orderNumber || '',
      user_id: String(order.user),
    };

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const callbackUrl = callback_url || `${baseUrl}/payment/callback/moyasar`;
    const webhookUrl = webhook_url || `${baseUrl}/payment/webhook/moyasar`;

    const data = {
      given_id: uuidv4(),
      amount: amountInHalalas,
      currency: 'SAR',
      description,
      callback_url: callbackUrl,
      webhook_url: webhookUrl,
      source,
      metadata,
    };

    const response = await axios.post(`${MOYASAR_API_URL}/payments`, data, {
      auth: {
        username: MOYASAR_SECRET_KEY,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const payment = response.data;
    const orderUpdate = {};

    if (payment?.id) {
      orderUpdate.paymentId = payment.id;
    }

    if (payment?.status === 'paid' || payment?.status === 'authorized') {
      Object.assign(orderUpdate, {
        status: 'paid',
        paid: true,
        paidAt: new Date(),
        paymentMethod: payment.source?.type || 'moyasar',
      });
    }

    if (Object.keys(orderUpdate).length) {
      await OrderModel.findByIdAndUpdate(order._id, orderUpdate);
    }

    res.status(201).json({ success: true, payment });

  } catch (error) {
    console.error('Payment Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Payment failed',
      error: error.response?.data || error.message
    });
  }
};
export const refundPayment = async (req, res) => {
  try {
    const paymentId = req.params.id || req.body.paymentId;


    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentId (or :id param) is required',
      });
    }

    const url = `${MOYASAR_API_URL}/payments/${encodeURIComponent(paymentId)}/refund`;
    const data = typeof amount === 'number' ? { amount } : {};

    const response = await axios.post(url, data, {
      auth: {
        username: MOYASAR_SECRET_KEY,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const refund = response.data;
    const refundedOrderId = refund?.metadata?.order_id;
    if (refundedOrderId) {
      await OrderModel.findByIdAndUpdate(refundedOrderId, {
        status: 'refunded',
        paid: false,
      });
    }

    return res.status(200).json({
      success: true,
      refund,
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Refund failed',
      error: error.response?.data || error.message,
    });
  }
}

export const handleMoyasarWebhook = async (req, res) => {
  try {
    const payload = (req.method === 'GET' ? req.query : req.body) || {};

    const paymentId = payload.id || payload.paymentId;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Missing payment identifier' });
    }

    let paymentDetails;
    try {
      paymentDetails = await fetchPaymentDetails(paymentId);
    } catch (fetchError) {
      console.error('Failed to fetch payment from Moyasar:', fetchError.response?.data || fetchError.message);
    }

    const status = (paymentDetails?.status || payload.status || '').toLowerCase();
    if (!status) {
      return res.status(400).json({ success: false, message: 'Missing payment status' });
    }

    const metadata = parseMetadata(paymentDetails?.metadata || payload.metadata);
    const orderId = payload.order_id || metadata?.order_id;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing order_id in payload or metadata' });
    }

    const source = paymentDetails?.source || payload.source || {};
    const amount = paymentDetails?.amount ?? payload.amount ?? null;
    const callbackUrl = payload.callback_url || paymentDetails?.callback_url || null;

    const updateData = {
      paymentInfo: {
        id: paymentId,
        status,
        amount,
        callbackUrl,
        source: {
          type: source?.type,
          company: source?.company,
          number: source?.number,
          transactionUrl: source?.transaction_url,
        },
      },
      paymentMethod: source?.type || 'moyasar',
      paymentStatus: status,
      updatedVia: 'moyasar_webhook',
    };

    if (['paid', 'authorized', 'captured'].includes(status)) {
      updateData.status = 'confirmed';
      updateData.paid = true;
      updateData.paidAt = new Date();
    } else if (['failed', 'declined', 'cancelled'].includes(status)) {
      updateData.status = 'cancelled';
      updateData.paid = false;
    } else if (status === 'refunded') {
      updateData.status = 'refunded';
      updateData.paid = false;
    } else {
      updateData.status = 'pending';
      updateData.paid = false;
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updateData, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`✅ Order ${orderId} updated via Moyasar callback (${status})`);

    return res.status(200).json({
      success: true,
      orderId,
      paymentStatus: status,
      paid: !!updateData.paid,
      statusUpdatedTo: updateData.status,
    });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
export const cancelPayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.status = 'cancelled';
    order.paid = false;
    await order.save();
    return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel Payment Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}
