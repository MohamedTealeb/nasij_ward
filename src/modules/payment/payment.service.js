// payment.controller.js
import axios from 'axios';

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY || 'sk_test_your_secret_key_here';
const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

export const createPayment = async (req, res) => {
  try {
    const { token, amount, currency, description, callback_url } = req.body;

    // تحقق من المدخلات
    if (!token || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Token and amount are required',
      });
    }

    // تجهيز البيانات
    const paymentData = {
      amount, // بالهللة (مثلاً 1000 = 10 ريال)
      currency: currency || 'SAR',
      description: description || 'Payment',
      callback_url:
        callback_url || `${req.protocol}://${req.get('host')}/payment-callback`,
      source: {
        type: 'token',
        token,
      },
    };

    // إرسال الطلب لـ Moyasar API
    const response = await axios.post(`${MOYASAR_API_URL}/payments`, paymentData, {
      auth: {
        username: MOYASAR_SECRET_KEY,
        password: '',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // إرسال النتيجة للعميل
    return res.status(201).json({
      success: true,
      payment: response.data,
    });
  } catch (error) {
    console.error('Payment Error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.response?.data || error.message,
    });
  }
};
