import { ProductModel } from "../../config/models/product.model.js";
import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";


export const getCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await UserModel.findById(userId).populate("cart.product");
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Cart fetched successfully",
    data: { cart: user.cart },
  });
});


export const addToCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  const product = await ProductModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  const user = await UserModel.findById(userId);

  const existingItem = user.cart.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity || 1;
  } else {
    user.cart.push({ product: productId, quantity: quantity || 1 });
  }

  await user.save();
  await user.populate("cart.product");

  return successResponse({
    res,
    message: "Product added to cart successfully",
    data: { cart: user.cart },
  });
});


export const removeFromCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $pull: { cart: { product: productId } } },
    { new: true }
  ).populate("cart.product");

  return successResponse({
    res,
    message: "Product removed from cart successfully",
    data: { cart: user.cart },
  });
});
