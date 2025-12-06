import { CartModel } from "../../config/models/cart.model.js";
import { OrderModel } from "../../config/models/order.model.js";
import { ProductModel } from "../../config/models/product.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { createShipmentService, calculateShippingCost } from "../shipment/shipment.service.js";

const orderProductPopulate = {
  path: "items.product",
  select: "name slug sku price salePrice coverImage images stock",
};
export const createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod, notes, shippingCost } = req.body;
  
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
  
  // Calculate shipping cost if not provided and address is available
  let calculatedShippingCost = shippingCost || 0;
  if (!shippingCost && shippingAddress && shippingAddress.city) {
    try {
      calculatedShippingCost = await calculateShippingCost({
        city: shippingAddress.city,
        address: shippingAddress.address,
        orderValue: subtotal,
      });
    } catch (error) {
      console.error("Error calculating shipping cost:", error.message);
      // Continue with default shipping cost (0) if calculation fails
    }
  }
  
  const totalPrice = subtotal + calculatedShippingCost;
  
  const order = await OrderModel.create({
    user: userId,
    items: orderItems,
    totalPrice,
    shippingAddress,
    paymentMethod: paymentMethod || "cash",
    notes: notes || "",
    shippingCost: calculatedShippingCost,
  });

  for (const item of cart.items) {
    await ProductModel.findByIdAndUpdate(
      item.product._id,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
  }
  await CartModel.findByIdAndDelete(cart._id);

  try {
    await createShipmentService({ orderId: order._id, userId });
  } catch (error) {
    console.error("Failed to create shipment:", error.message);
  }

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

