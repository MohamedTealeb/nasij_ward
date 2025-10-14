import axios from "axios";

export const createTestPayment = async (req, res) => {
  try {
    const { amount, description, source } = req.body;

    if (!amount || !description || !source) {
      return res.status(400).json({
        success: false,
        message: "Amount, description, and source are required.",
      });
    }

    const response = await axios.post(
      "https://api.moyasar.com/v1/payments",
      {
        amount: amount * 100, // ميسر يستخدم هللات
        currency: "SAR",
        description,
        source, // { type: "creditcard", name, number, month, year, cvc }
        callback_url:
          process.env.FRONTEND_URL + "/payment/success" ||
          "http://localhost:3000/payment/success",
      },
      {
        auth: {
          username: process.env.MOYSAR_SECRET_KEY, // المفتاح السري
          password: "",
        },
      }
    );

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Payment creation error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Payment creation failed",
      error: error.response?.data || error.message,
    });
  }
};

export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const response = await axios.get(
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      {
        auth: {
          username: process.env.MOYSAR_SECRET_KEY,
          password: "",
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Get payment error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.response?.data || error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const response = await axios.get(
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      {
        auth: {
          username: process.env.MOYSAR_SECRET_KEY,
          password: "",
        },
      }
    );

    const payment = response.data;
    const status = payment.status;

    return res.status(200).json({
      success: true,
      paymentId,
      status,
      message: `Payment status: ${status}`,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.response?.data || error.message,
    });
  }
};
