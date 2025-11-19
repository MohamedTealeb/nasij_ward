// payment.service.js
import axios from 'axios';
import { OrderModel } from '../../config/models/order.model.js';
import { v4 as uuidv4 } from 'uuid';
const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY || 'sk_test_cxC3oG9nj6UFx4BgkcXCUyZU42i9Lwe2wsU6FXk6';
const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

export const createPayment = async (req, res) => {
  try {
    const { orderId, source, callback_url } = req.body;

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

    const amountInHalalas = Math.round(Number(order.totalPrice) * 100);
    const description = `Order ${order.orderNumber || order._id}`;
    const metadata = {
      order_id: String(order._id),
      order_number: order.orderNumber || '',
      user_id: String(order.user),
    };

    const data = {
      given_id: uuidv4(),
      amount: amountInHalalas,
      currency: 'SAR',
      description,
      callback_url: callback_url || `${req.protocol}://${req.get('host')}/payment-callback`,
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
    if (payment?.status === 'paid' || payment?.status === 'authorized') {
      await OrderModel.findByIdAndUpdate(order._id, {
        status: 'paid',
        paid: true,
        paidAt: new Date(),
        paymentMethod: 'credit_card',
      });
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
    const event = req.body;

    if (!event || !event.id || !event.status) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    const { id: paymentId, status, amount, metadata, source } = event;

    const orderId = metadata?.order_id;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing order_id in metadata' });
    }

    const updateData = {
      paymentInfo: {
        id: paymentId,
        status,
        source: {
          type: source?.type,
          company: source?.company,
          transactionUrl: source?.transaction_url,
        },
      },
      paidAt: new Date(),
    };

    switch (status) {
      case 'paid':
      case 'authorized':
        updateData.status = 'paid';
        updateData.paid = true;
        break;
      case 'failed':
      case 'declined':
        updateData.status = 'cancelled';
        updateData.paid = false;
        break;
      case 'refunded':
        updateData.status = 'refunded';
        updateData.paid = false;
        break;
      default:
        updateData.status = 'pending';
    }

    // تحديث الطلب
    await OrderModel.findByIdAndUpdate(orderId, updateData);

    console.log(`✅ Order ${orderId} updated via Moyasar webhook (${status})`);

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
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
