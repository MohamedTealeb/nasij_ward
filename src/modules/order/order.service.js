import { CartModel } from "../../config/models/cart.model.js";
import { OrderModel } from "../../config/models/order.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const createOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod } = req.body;
 
let cart = await CartModel.findOne({ user: userId, status: "active" }).populate("items.product");

if (!cart) {
  cart = await CartModel.create({ user: userId, items: [] });
}

if (cart.items.length === 0) {
  return next(new Error("Cart is empty", { cause: 400 }));
}

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    quantity: item.quantity,
    price: item.price,
  }));

  const totalPrice = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

  const order = await OrderModel.create({
    user: userId,
    items: orderItems,
    totalPrice,
    shippingAddress,
    paymentMethod: paymentMethod || "cash",
  });

  cart.status = "ordered";
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  return successResponse({
    res,
    message: "Order created successfully",
    data: { order },
  });
});

export const getUserOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const orders = await OrderModel.find({ user: userId }).populate("items.product");

  return successResponse({
    res,
    message: "Orders fetched successfully",
    data: { orders },
  });
});
