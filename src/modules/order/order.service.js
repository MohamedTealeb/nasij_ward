import { CartModel } from "../../config/models/cart.model.js";
import { OrderModel } from "../../config/models/order.model.js";
import { ProductModel } from "../../config/models/product.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { getOtoAccessToken } from "../shipment/shipment.service.js";

const normalizeCity = (value) => String(value || "").trim().toLowerCase();

const SHIPPING_ZONES = {
  zone1: new Set(["riyadh", "al kharj", "diriyah", "al muzahmiyah"].map(normalizeCity)),
  zone2: new Set(["jeddah", "makkah", "madinah", "dammam", "khobar", "dhahran", "taif"].map(normalizeCity)),
  zone3: new Set(["abha", "jazan", "tabuk", "hail", "najran", "arar", "sakaka", "al baha"].map(normalizeCity)),
};

const SHIPPING_RATES = {
  standard: {
    zone1: { under200: 25, under600: 15, over600: 0 },
    zone2: { under200: 28, under600: 18, over600: 0 },
    zone3: { under200: 32, under600: 22, over600: 15 },
  },
  bulky: {
    zone1: { under200: 30, under600: 20, over600: 0 },
    zone2: { under200: 35, under600: 25, over600: 0 },
    zone3: { under200: 42, under600: 30, over600: 20 },
  },
};

const resolveShippingZone = (city) => {
  const normalized = normalizeCity(city);
  if (SHIPPING_ZONES.zone1.has(normalized)) return "zone1";
  if (SHIPPING_ZONES.zone2.has(normalized)) return "zone2";
  if (SHIPPING_ZONES.zone3.has(normalized)) return "zone3";
  return null;
};

const calculateShippingCost = ({ zone, total, shippingType }) => {
  const rates = SHIPPING_RATES[shippingType]?.[zone];
  if (!rates) return null;
  if (total < 200) return rates.under200;
  if (total < 600) return rates.under600;
  return rates.over600;
};

const orderProductPopulate = {
  path: "items.product",
  select: "name slug sku price salePrice coverImage images stock shippingType",
};
export const createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod, notes } = req.body;
  
  let cart = await CartModel.findOne({ user: userId, status: "active" }).populate("items.product");
  
  if (!cart) {
    cart = await CartModel.create({ user: userId, items: [] });
  }
  
  if (cart.items.length === 0) {
    return next(new Error("Cart is empty", { cause: 400 }));
  }

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return next(new Error(`المنتج ${item.product.name} غير متوفر بالكمية المطلوبة. المتوفر: ${item.product.stock}`, { cause: 400 }));
    }
  }
  
  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    quantity: item.quantity,
    price: item.price,
    color: Array.isArray(item.color) ? item.color : [item.color],
    size: Array.isArray(item.size) ? item.size : [item.size],
  }));
  
  const subtotal = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

  const shippingType = cart.items.some(
    (item) => String(item.product?.shippingType || "standard").toLowerCase() === "bulky"
  )
    ? "bulky"
    : "standard";

  const zone = resolveShippingZone(shippingAddress?.city);
  if (!zone) {
    return next(new Error("Unsupported shipping city. Please update the address city.", { cause: 400 }));
  }

  const shippingCost = calculateShippingCost({
    zone,
    total: subtotal,
    shippingType,
  });

  if (shippingCost === null || Number.isNaN(shippingCost)) {
    return next(new Error("Failed to calculate shipping cost.", { cause: 500 }));
  }

  const totalPrice = subtotal + shippingCost;
  
  const order = await OrderModel.create({
    user: userId,
    items: orderItems,
    totalPrice,
    shippingAddress,
    paymentMethod: paymentMethod ,
    notes: notes || "",
    shippingCost,
  });

  for (const item of cart.items) {
    await ProductModel.findByIdAndUpdate(
      item.product._id,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
  }
  await CartModel.findByIdAndDelete(cart._id);
  const token = await getOtoAccessToken();
  console.log(token);
 

  return successResponse({
    res,
    message: "Order created successfully",
    data: { order },
  });
});
export const getUserOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const orders = await OrderModel.find({ user: userId })
    .populate(orderProductPopulate)
    .populate("user", "firstName lastName email phone ");
  return successResponse({
    res,
    message: "Orders fetched successfully",
    data: { orders },
  });
});
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await OrderModel.find()
    .populate(orderProductPopulate)
    .populate("user", "firstName lastName email phone");
  return successResponse({
    res,
    message: "All orders fetched successfully",
    data: { orders },
  });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  
  const order = await OrderModel.findOne({ 
    _id: orderId, 
    user: userId 
  })
    .populate(orderProductPopulate)
    .populate("user", "firstName lastName email phone");
    
  if (!order) {
    return next(new Error("Order not found", { cause: 404 }));
  }
  
  return successResponse({
    res,
    message: "Order fetched successfully",
    data: { order },
  });
});



export const getOrderByIdAdmin = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  
  const order = await OrderModel.findById(orderId)
    .populate(orderProductPopulate)
    .populate("user", "firstName lastName email phone    ");
    
  if (!order) {
    return next(new Error("Order not found", { cause: 404 }));
  }
  
  return successResponse({
    res,
    message: "Order fetched successfully",
    data: { order },
  });
});

