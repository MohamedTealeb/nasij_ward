// payment.service.js
import axios from 'axios';
import { OrderModel } from '../../config/models/order.model.js';
import { createOtoOrder } from '../shipment/shipment.service.js';
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

const formatOtoOrderDate = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const buildOtoOrderPayload = (order) => {
  const pickupLocationCode = process.env.OTO_PICKUP_LOCATION_CODE;
  const deliveryOptionId = Number(process.env.OTO_DELIVERY_OPTION_ID) || undefined;

  const amount = typeof order?.finalPrice === 'number' ? order.finalPrice : order?.totalPrice;
  const shippingAddress = order?.shippingAddress || {};
  const customerName = [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ').trim();

  const items = (order?.items || []).map((item) => {
    const product = item?.product || {};
    const name = product?.name_en || product?.name_ar || 'Item';
    const price = typeof item?.price === 'number' ? item.price : product?.price;
    const quantity = item?.quantity || 1;
    return {
      productId: product?.otoProductId || product?._id || undefined,
      name,
      price,
      rowTotal: typeof price === 'number' ? price * quantity : undefined,
      taxAmount: 0,
      quantity,
      sku: product?.sku || undefined,
      image: product?.coverImage || product?.images?.[0] || undefined,
    };
  });

  return {
    orderId: order?.orderNumber || String(order?._id),
    pickupLocationCode,
    createShipment: true,
    deliveryOptionId,
    payment_method: 'paid',
    amount,
    amount_due: 0,
    currency: 'SAR',
    customsValue: process.env.OTO_CUSTOMS_VALUE || undefined,
    customsCurrency: process.env.OTO_CUSTOMS_CURRENCY || 'USD',
    packageCount: Number(process.env.OTO_PACKAGE_COUNT) || 1,
    packageWeight: Number(process.env.OTO_PACKAGE_WEIGHT) || 1,
    boxWidth: Number(process.env.OTO_BOX_WIDTH) || 10,
    boxLength: Number(process.env.OTO_BOX_LENGTH) || 10,
    boxHeight: Number(process.env.OTO_BOX_HEIGHT) || 10,
    orderDate: formatOtoOrderDate(order?.createdAt ? new Date(order.createdAt) : new Date()),
    senderName: process.env.OTO_SENDER_NAME || undefined,
    customer: {
      name: customerName || undefined,
      email: shippingAddress.email || undefined,
      mobile: shippingAddress.phone || undefined,
      address: shippingAddress.address || undefined,
      district: shippingAddress.district || undefined,
      city: shippingAddress.city || undefined,
      country: shippingAddress.country || undefined,
      postcode: shippingAddress.postalCode || undefined,
      refID: String(order?._id),
    },
    items,
  };
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

    const amountInHalalas = Math.round(Number(order.totalPrice) * 100);
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

    if (['paid', 'authorized', 'captured'].includes(status)) {
      const alreadyShipped = ['shipped', 'delivered'].includes(updatedOrder?.status);
      if (!alreadyShipped && !updatedOrder?.trackingNumber) {
        const hydratedOrder = await OrderModel.findById(orderId)
          .populate({ path: 'items.product', select: 'name_ar name_en sku price otoProductId coverImage images' })
          .populate('user', 'firstName lastName email phone')
          .lean();

        const otoPayload = buildOtoOrderPayload(hydratedOrder);
        const otoResponse = await createOtoOrder(otoPayload);

        const trackingNumber =
          otoResponse?.data?.trackingNumber ||
          otoResponse?.trackingNumber ||
          otoResponse?.data?.tracking_number ||
          otoResponse?.tracking_number ||
          undefined;
        const trackingUrl =
          otoResponse?.data?.trackingUrl ||
          otoResponse?.trackingUrl ||
          otoResponse?.data?.tracking_url ||
          otoResponse?.tracking_url ||
          undefined;

        await OrderModel.findByIdAndUpdate(orderId, {
          status: 'shipped',
          ...(trackingNumber ? { trackingNumber } : {}),
          ...(trackingUrl ? { trackingUrl } : {}),
        });
      }
    }

    console.log(`✅ Order ${orderId} updated via Moyasar callback (${status})`);

    if (req.method === 'GET') {
      const frontendBaseUrl =
        process.env.FRONTEND_BASE_URL ||
        process.env.CLIENT_URL ||
        `${req.protocol}://${req.get('host')}`;
      const success = ['paid', 'authorized', 'captured'].includes(status);
      const message = success ? 'Payment succeeded' : 'Payment failed';
      const redirectUrl = new URL(frontendBaseUrl);
      redirectUrl.searchParams.set('paymentStatus', success ? 'success' : 'failed');
      redirectUrl.searchParams.set('message', message);
      redirectUrl.searchParams.set('orderId', orderId);
      return res.redirect(302, redirectUrl.toString());
    }

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
