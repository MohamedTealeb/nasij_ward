import axios from "axios";
import { ShipmentModel } from "../../config/models/shipment.js";
import { OrderModel } from "../../config/models/order.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const calculateShippingCost = async ({ city, address, orderValue }) => {
  if (!city) {
    return 0;
  }

  const otoApiKey = process.env.OTO_API_KEY;
  if (!otoApiKey) {
    console.warn("OTO_API_KEY is not configured, using default shipping cost");
    return 0;
  }

  const cleanApiKey = otoApiKey.trim().replace(/^Bearer\s+/i, '');


  const estimatePayload = {
    to_address: {
      city: city,
      address_line_1: address || "",
    },
    order_value: orderValue || 0,
  };

  try {

    const response = await axios.post(
      "https://staging-api.tryoto.com/rest/v2/quote",
      estimatePayload,
      {
        headers: {
          Authorization: `Bearer ${cleanApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const shippingCost = response.data?.shipping_cost ||
      response.data?.cost ||
      response.data?.shippingCost ||
      response.data?.price ||
      0;

    return Number(shippingCost) || 0;
  } catch (error) {
    console.warn("OTO quote API error:", error.response?.data || error.message);
    return 0;
  }
};

export const createShipmentService = async ({ orderId, userId, estimatedDelivery }) => {
  const order = await OrderModel.findById(orderId)
    .populate("items.product");
  if (!order) {
    throw new Error("Order not found");
  }

  if (userId && order.user.toString() !== userId.toString()) {
    throw new Error("Unauthorized access to this order");
  }

  const user = userId || order.user;
  const shippingAddress = order.shippingAddress;

  const otoPayload = {
    to_address: {
      name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      phone: shippingAddress.phone,
      city: shippingAddress.city,
      address_line_1: shippingAddress.address,
      ...(shippingAddress.postalCode && { postal_code: shippingAddress.postalCode }),
    },
    reference_id: order.orderNumber || order._id.toString(),
    cod_amount: order.paid ? 0 : order.finalPrice || order.totalPrice,
    order_value: order.finalPrice || order.totalPrice,
    order_items: order.items.map((item) => ({
      name: item.product?.name || "Product",
      quantity: item.quantity,
      price: item.price,
    })),
  };


  const otoApiKey = process.env.OTO_API_KEY;
  if (!otoApiKey) {
    throw new Error("OTO_API_KEY is not configured in environment variables");
  }

  const cleanApiKey = otoApiKey.trim().replace(/^Bearer\s+/i, '');

  let otoShipment;
  try {
    const response = await axios.post(
      "https://staging-api.tryoto.com/rest/v2/",
      otoPayload,
      {
        headers: {
          Authorization: `Bearer ${cleanApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    otoShipment = response.data;
  } catch (error) {
    console.error("OTO API error:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.message || "Failed to connect to OTO API";
    throw new Error(`OTO API Error: ${errorMessage}`);
  }

  const deliveryDate = estimatedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const trackingNumber = otoShipment.tracking_number
  const trackingUrl = otoShipment.tracking_url
  const shipment = await ShipmentModel.create({
    order: orderId,
    user,
    address: JSON.stringify(shippingAddress),
    carrier: "oto السعودية",
    trackingNumber,
    status: otoShipment.status || "pending",
    estimatedDelivery: deliveryDate,
  });

  const orderUpdate = { status: "shipped" };

  if (trackingNumber) {
    orderUpdate.trackingNumber = trackingNumber;
  }

  if (trackingUrl) {
    orderUpdate.trackingUrl = trackingUrl;
  }

  await OrderModel.findByIdAndUpdate(orderId, orderUpdate);

  return {
    shipment,
    order,
    otoShipment,
  };
};

export const getShippingCostEstimate = asyncHandler(async (req, res, next) => {
  const { city, address, orderValue } = req.body;

  if (!city) {
    return next(new Error("City is required", { cause: 400 }));
  }

  try {
    const shippingCost = await calculateShippingCost({
      city,
      address: address || "",
      orderValue: orderValue || 0,
    });

    return successResponse({
      res,
      message: "Shipping cost calculated successfully",
      data: {
        shippingCost,
        city,
        currency: "SAR",
      },
    });
  } catch (error) {
    return next(new Error(error.message || "Failed to calculate shipping cost", { cause: 500 }));
  }
});

export const createShipment = asyncHandler(async (req, res, next) => {
  const { orderId, estimatedDelivery } = req.body;
  const user = req.user?._id;

  try {
    const result = await createShipmentService({ orderId, userId: user, estimatedDelivery });

    return successResponse({
      res,
      message: "Shipment created successfully with OTO",
      data: {
        shipment: result.shipment,
        order: {
          orderNumber: result.order.orderNumber,
          finalPrice: result.order.finalPrice || result.order.totalPrice,
        },
        otoTrackingUrl: `https://oto.sa/track/${result.otoShipment.tracking_number || result.otoShipment.trackingNumber}`,
      },
      statusCode: 201,
    });
  } catch (error) {
    if (error.message === "Order not found") {
      return next(new Error("Order not found", { cause: 404 }));
    }
    if (error.message === "Unauthorized access to this order") {
      return next(new Error("Unauthorized access to this order", { cause: 403 }));
    }
    const err = new Error(error.message || "Failed to create shipment");
    err.statusCode = 502;
    return next(err);
  }
});
