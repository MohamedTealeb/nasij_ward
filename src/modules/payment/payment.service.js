import axios from 'axios';
import { OrderModel } from '../../config/models/order.model.js';
import { createOtoOrder } from '../shipment/shipment.service.js';
import { v4 as uuidv4 } from 'uuid';

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

/* -------------------------------- utils -------------------------------- */
const parseMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata;
};

const fetchPaymentDetails = async (paymentId) => {
  const url = `${MOYASAR_API_URL}/payments/${encodeURIComponent(paymentId)}`;
  const { data } = await axios.get(url, {
    auth: { username: process.env.MOYASAR_SECRET_KEY, password: '' },
    headers: { Accept: 'application/json' },
  });
  return data;
};

const buildOtoOrderPayload = (order) => {
  console.log('Building OTO payload for order:', order?._id);
  const shippingAddress = order.shippingAddress || {};
  const user = order.user || {};

  const customerName = [
    shippingAddress.firstName || user.firstName,
    shippingAddress.lastName || user.lastName,
  ].filter(Boolean).join(' ').trim();

  const customerEmail = shippingAddress.email || user.email;
  const customerPhone = shippingAddress.phone || user.phone;
  const customerCity = shippingAddress.city || 'Riyadh';
  const customerAddress = shippingAddress.address || 'KSA';
  const customerCountry = shippingAddress.country || 'SA';

  const items = (order.items || []).map((item) => {
    const product = item.product || {};
    const price = item.price ?? product.price ?? 0;
    const quantity = item.quantity || 1;

    if (!product.otoProductId && !product._id) {
       console.warn(`Product ${product.name_en} (SKU: ${product.sku}) is missing otoProductId and _id!`);
    }

    return {
      productId: product.otoProductId || product._id,
      name: product.name_en || product.name_ar || 'Item',
      price,
      rowTotal: price * quantity,
      quantity,
      sku: product.sku,
      image: product.coverImage || product.images?.[0],
    };
  });

  return {
    orderId: order.orderNumber || String(order._id),
    pickupLocationCode: process.env.OTO_PICKUP_LOCATION_CODE,
    deliveryOptionId: Number(process.env.OTO_DELIVERY_OPTION_ID),
    createShipment: true,
    payment_method: 'paid',
    amount: order.finalPrice ?? order.totalPrice,
    amount_due: 0,
    currency: 'SAR',
    packageCount: 1,
    packageWeight: 1,
    boxWidth: 10,
    boxLength: 10,
    boxHeight: 10,
    customer: {
      name: customerName,
      email: customerEmail,
      mobile: customerPhone,
      address: customerAddress,
      city: customerCity,
      country: customerCountry,
    },
    items,
  };
};

/* ----------------------------- create payment ---------------------------- */
export const createPayment = async (req, res) => {
  try {
    const { orderId, source } = req.body;

    if (!orderId || !source?.type) {
      return res.status(400).json({ success: false, message: 'orderId and valid source are required' });
    }

    const order = await OrderModel.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const orderAmount = order.finalPrice ?? order.totalPrice;
    const amount = Math.round(Number(orderAmount) * 100);

    const backendBaseUrl = (process.env.BACKEND_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const callbackUrl = `${backendBaseUrl}/payment/callback/moyasar`;
    const webhookUrl = `${backendBaseUrl}/payment/webhook/moyasar`;

    const paymentPayload = {
      given_id: uuidv4(),
      amount,
      currency: 'SAR',
      description: `Order ${order.orderNumber || order._id}`,
      callback_url: callbackUrl,
      webhook_url: webhookUrl,
      source,
      metadata: { order_id: String(order._id), user_id: String(order.user) },
    };

    console.log('=== Creating Moyasar Payment ===');
    console.log('Amount (in halalas):', amount);
    console.log('Order ID:', order._id);
    console.log('API Key configured:', !!process.env.MOYASAR_SECRET_KEY);
    console.log('================================');

    const { data: payment } = await axios.post(
      `${MOYASAR_API_URL}/payments`,
      paymentPayload,
      { 
        auth: { username: process.env.MOYASAR_SECRET_KEY, password: '' }, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

    console.log('Payment Creation - Callback URL:', callbackUrl);
    console.log('Payment Creation - Webhook URL:', webhookUrl);

    console.log('Moyasar payment created:', {
      id: payment?.id,
      status: payment?.status,
      hasTransactionUrl: Boolean(payment?.source?.transaction_url),
      transactionUrl: payment?.source?.transaction_url,
    });

    await OrderModel.findByIdAndUpdate(order._id, {
      paymentId: payment.id,
      status: 'pending',
      paymentStatus: payment.status.toLowerCase(),
    });

    if (payment.status.toLowerCase() === 'initiated') {
      console.log('Payment initiated, awaiting 3DS:', {
        paymentId: payment?.id,
        transactionUrl: payment?.source?.transaction_url,
      });
      return res.status(201).json({
        success: true,
        transaction_url: payment.source.transaction_url,
        message: 'Payment initiated, redirect to 3DS',
      });
    }

    return res.status(201).json({ success: true, payment });

  } catch (error) {
    console.error('=== Payment Creation Error ===');
    console.error('Error type:', error.response?.data?.type);
    console.error('Error message:', error.response?.data?.message);
    console.error('Status code:', error.response?.status);
    console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
    console.error('============================');
    return res.status(500).json({ success: false, message: 'Payment creation failed', error: error.response?.data || error.message });
  }
};

/* ------------------------------- refund ---------------------------------- */
export const refundPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId required' });

    const { data: refund } = await axios.post(`${MOYASAR_API_URL}/payments/${paymentId}/refund`, {}, { auth: { username: process.env.MOYASAR_SECRET_KEY, password: '' } });

    const orderId = refund?.metadata?.order_id;
    if (orderId) await OrderModel.findByIdAndUpdate(orderId, { status: 'refunded', paid: false });

    return res.json({ success: true, refund });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Refund failed', error: error.response?.data || error.message });
  }
};

/* ------------------------------- webhook --------------------------------- */
export const handleMoyasarWebhook = async (req, res) => {
  const isBrowserCallback = req.method === 'GET';
  const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
  const frontendSuccessUrl = process.env.FRONTEND_PAYMENT_SUCCESS_URL || `${frontendBaseUrl}/payment/success`;
  const frontendFailedUrl = process.env.FRONTEND_PAYMENT_FAILED_URL || `${frontendBaseUrl}/payment/failed`;

  try {
    const payload = isBrowserCallback ? req.query : req.body;
    const paymentId = payload?.id || payload?.paymentId || payload?.data?.id;

    if (!paymentId) {
      if (isBrowserCallback) return res.redirect(`${frontendFailedUrl}?status=failed&message=Missing_Payment_ID`);
      return res.status(400).json({ success: false, message: 'Missing payment ID' });
    }

    let paymentDetails;
    try { paymentDetails = await fetchPaymentDetails(paymentId); } 
    catch (err) {
      console.error('Failed to fetch payment:', err?.response?.data || err.message);
      if (isBrowserCallback) return res.redirect(`${frontendFailedUrl}?status=failed&paymentId=${paymentId}&message=Payment_Fetch_Failed`);
      return res.status(500).json({ success: false, message: 'Payment fetch failed' });
    }

    const status = paymentDetails.status?.toLowerCase();
    const metadata = parseMetadata(paymentDetails.metadata);
    const orderId = metadata?.order_id;

    console.log('Moyasar payment status fetched:', { paymentId, status, orderId });

    if (!orderId) {
      if (isBrowserCallback) return res.redirect(`${frontendFailedUrl}?status=${status}&paymentId=${paymentId}&message=Missing_Order_ID`);
      return res.status(400).json({ success: false, message: 'Missing order_id in metadata' });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      if (isBrowserCallback) return res.redirect(`${frontendFailedUrl}?status=${status}&paymentId=${paymentId}&orderId=${orderId}&message=Order_Not_Found`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let newOrderStatus = 'pending';
    let paid = false;

    if (['paid', 'captured'].includes(status)) { newOrderStatus = 'confirmed'; paid = true; }
    else if (status === 'initiated') {
      newOrderStatus = 'pending';
      paid = false;
      console.log('Payment still initiated, waiting for 3DS completion:', {
        paymentId,
        transactionUrl: paymentDetails?.source?.transaction_url,
      });
    }
    else if (['failed', 'declined', 'cancelled'].includes(status)) newOrderStatus = 'cancelled';

    await OrderModel.findByIdAndUpdate(orderId, {
      paymentStatus: status,
      status: newOrderStatus,
      paid,
      paymentInfo: paymentDetails,
      updatedVia: 'moyasar_webhook',
      ...(paid ? { paidAt: new Date() } : {}),
    });

    if (paid) {
      const lockedOrder = await OrderModel.findOneAndUpdate(
        { _id: orderId, trackingNumber: { $exists: false }, shipmentCreating: { $ne: true } },
        { $set: { shipmentCreating: true } },
        { new: true }
      );

      if (lockedOrder) {
        try {
          const hydratedOrder = await OrderModel.findById(orderId)
            .populate({ path: 'items.product', select: 'name_en name_ar sku price otoProductId coverImage images' })
            .populate('user', 'firstName lastName email phone')
            .lean();

          const otoPayload = buildOtoOrderPayload(hydratedOrder);
          const otoResponse = await createOtoOrder(otoPayload);

          const trackingNumber = otoResponse?.data?.trackingNumber || otoResponse?.trackingNumber || otoResponse?.data?.tracking_number || otoResponse?.tracking_number;
          const trackingUrl = otoResponse?.data?.trackingUrl || otoResponse?.trackingUrl || otoResponse?.data?.tracking_url || otoResponse?.tracking_url;

          if (trackingNumber) {
            await OrderModel.findByIdAndUpdate(orderId, { status: 'shipped', trackingNumber, ...(trackingUrl ? { trackingUrl } : {}), $unset: { shipmentCreating: '' } });
          } else { await OrderModel.findByIdAndUpdate(orderId, { $unset: { shipmentCreating: '' } }); }
        } catch (err) { await OrderModel.findByIdAndUpdate(orderId, { $unset: { shipmentCreating: '' } }); }
      }
    }

    if (isBrowserCallback) {
      if (status === 'initiated') return res.redirect(paymentDetails.source.transaction_url);
      const redirectUrl = new URL(['paid','captured'].includes(status) ? frontendSuccessUrl : frontendFailedUrl);
      redirectUrl.searchParams.set('status', status);
      redirectUrl.searchParams.set('paymentId', paymentId);
      redirectUrl.searchParams.set('orderId', orderId);
      return res.redirect(302, redirectUrl.toString());
    }

    return res.status(200).json({ success: true, orderId, paymentStatus: status, paid, orderStatus: newOrderStatus });

  } catch (error) {
    console.error('Webhook Fatal Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ------------------------------- cancel ---------------------------------- */
export const cancelPayment = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'cancelled';
    order.paid = false;
    await order.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Cancel failed', error: error.message });
  }
};
