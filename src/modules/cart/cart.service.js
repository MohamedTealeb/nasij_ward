import { CartModel } from "../../config/models/cart.model.js";
import { ProductModel } from "../../config/models/product.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const getCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const cart = await CartModel.findOne({ user: userId, status: "active" })
    .populate("items.product");

  if (!cart) {
    return successResponse({
      res,
      message: "Cart fetched successfully",
      data: { cart: [], totalPrice: 0 },
    });
  }

  return successResponse({
    res,
    message: "Cart fetched successfully",
    data: { cart: cart.items, totalPrice: cart.totalPrice },
  });
});

export const addToCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  const qty = Number(quantity);

  if (!qty || qty < 1) {
    return next(new Error("Quantity must be at least 1", { cause: 400 }));
  }

  const product = await ProductModel.findById(productId);
  if (!product) return next(new Error("Product not found", { cause: 404 }));

  let cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) {
    cart = await CartModel.create({ user: userId, items: [] });
  }

  await cart.addItem(productId, product.price, qty);

  return successResponse({
    res,
    message: "Product added to cart successfully",
    data: { cart },
  });
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) return next(new Error("Cart not found", { cause: 404 }));

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  await cart.save();

  return successResponse({
    res,
    message: "Product removed from cart successfully",
    data: { cart },
  });
});
export const decreaseQuantity = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.body;

  const cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) return next(new Error("Cart not found", { cause: 404 }));

  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (!item) return next(new Error("Product not in cart", { cause: 404 }));

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
  }

  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  await cart.save();

  return successResponse({
    res,
    message: "Product quantity updated successfully",
    data: { cart },
  });
});