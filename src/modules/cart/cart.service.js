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

  if (isNaN(qty)) {
    return next(new Error("Quantity must be a number", { cause: 400 }));
  }
  if (qty === 0) {
    return next(new Error("Quantity cannot be 0", { cause: 400 }));
  }

  const product = await ProductModel.findById(productId);
  if (!product) return next(new Error("Product not found", { cause: 404 }));

  let cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) {
    cart = await CartModel.create({ user: userId, items: [] });
  }

  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (qty > 0) {
    // ✅ إضافة أو زيادة
    if (item) {
      item.quantity += qty;
    } else {
      cart.items.push({ product: productId, price: product.price, quantity: qty });
    }
  } else if (qty === -1) {
    // ✅ إنقاص
    if (!item) return next(new Error("Product not in cart", { cause: 404 }));
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
    }
  }

  // تحديث السعر الكلي
  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  await cart.save();

  return successResponse({
    res,
    message: "Cart updated successfully",
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
