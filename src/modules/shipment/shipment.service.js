import axios from "axios";
import { ShipmentModel } from "../../config/models/shipment.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const createShipment = asyncHandler(async (req, res, next) => {
  const { order, address, estimatedDelivery } = req.body;
  const user = req.user?._id;

  // 1️⃣ إعداد بيانات الشحنة لـ OTO
  const otoPayload = {
    to_address: {
      name: address.name,
      phone: address.phone,
      city: address.city,
      address_line_1: address.street,
    },
    reference_id: order,
    cod_amount: 0,
    order_value: 150, // مثال فقط
    order_items: [
      {
        name: "تيشيرت أبيض",
        quantity: 1,
        price: 150,
      },
    ],
  };

  // 2️⃣ إرسال الطلب إلى OTO API
try {
  const response = await axios.post("https://merchant.oto.sa/api/v1/shipments", otoPayload, {
    headers: {
      Authorization: `Bearer ${process.env.OTO_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // معالجة الرد
} catch (error) {
  console.error("OTO error:", error.message);
  const err = new Error("Failed to connect to OTO API");
  err.statusCode = 502;
  return next(err);
}
  const otoShipment = response.data;

  // 3️⃣ حفظ الشحنة في قاعدة البيانات
  const shipment = await ShipmentModel.create({
    order,
    user,
    address,
    carrier: "oto السعودية",
    trackingNumber: otoShipment.tracking_number,
    status: otoShipment.status,
    estimatedDelivery,
  });

  // 4️⃣ الرد على العميل
  return successResponse({
    res,
    message: "Shipment created successfully with OTO",
    data: {
      shipment,
      otoTrackingUrl: `https://oto.sa/track/${otoShipment.tracking_number}`,
    },
    statusCode: 201,
  });
});
