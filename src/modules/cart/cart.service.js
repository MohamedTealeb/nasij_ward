import { CartModel } from "../../config/models/cart.model.js";
import { ProductModel } from "../../config/models/product.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
export const getCart = asyncHandler(async (req, res, next) => {
  if (req.user) {
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
  } else {
    return successResponse({
      res,
      message: "Guest cart fetched successfully",
      data: { cart: [], totalPrice: 0, message: "Please login to save your cart" },
    });
  }
});
export const addToCart = asyncHandler(async (req, res, next) => {
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

  if (req.user) {
    const userId = req.user._id;
    let cart = await CartModel.findOne({ user: userId, status: "active" });
    if (!cart) {
      cart = await CartModel.create({ user: userId, items: [] });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (qty > 0) {
            if (item) {
        item.quantity += qty;
      } else {
        cart.items.push({ product: productId, price: product.price, quantity: qty });
      }
    } else if (qty === -1) {
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
  } else {
    // للـ guest - نرجع رسالة تشجيعية للتسجيل
    return successResponse({
      res,
      message: "Product added to guest cart. Please login to save your cart permanently.",
      data: { 
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          quantity: qty
        },
        message: "Login to save your cart permanently"
      },
    });
  }
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  
  if (req.user) {
    const userId = req.user._id;
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
  } else {
    return successResponse({
      res,
      message: "Please login to manage your cart permanently",
      data: { message: "Login to save and manage your cart" },
    });
  }
});
export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = Number(quantity);
  
  if (isNaN(qty)) {
    return next(new Error("Quantity must be a number", { cause: 400 }));
  }
  if (qty === 0) {
    return next(new Error("Quantity cannot be 0", { cause: 400 }));
  }
  
  const cart = await CartModel.findOne({ user: req.user._id, status: "active" });
  if (!cart) return next(new Error("Cart not found", { cause: 404 }));
  
  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );
  if (!item) return next(new Error("Product not in cart", { cause: 404 }));
  
  item.quantity = qty;
  

  if (item.quantity < 1) {
    item.quantity = 1;
  }
  
  cart.totalPrice = cart.items.reduce(  
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  
  await cart.save();
  
  return successResponse({
    res,
    message: `Cart item quantity updated successfully. Set to ${qty}.`,
    data: { 
      cart,
      updatedItem: {
        productId: item.product,
        newQuantity: item.quantity
      }
    },
  });
});