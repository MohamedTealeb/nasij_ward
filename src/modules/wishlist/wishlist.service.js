import { ProductModel } from "../../config/models/product.model.js";
import { UserModel } from "../../config/models/user.model.js"; // لازم يكون عندك موديل User
import { asyncHandler, successResponse } from "../../utils/response.js";


export const getWishlist = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await UserModel.findById(userId).populate("wishlist");
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Wishlist fetched successfully",
    data: { wishlist: user.wishlist },
  });
});


export const addToWishlist = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.body;

  const product = await ProductModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $addToSet: { wishlist: productId } }, 
    { new: true }
  ).populate("wishlist");

  return successResponse({
    res,
    message: "Product added to wishlist successfully",
    data: { wishlist: user.wishlist },
  });
});


export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $pull: { wishlist: productId } },
    { new: true }
  ).populate("wishlist");

  return successResponse({
    res,
    message: "Product removed from wishlist successfully",
    data: { wishlist: user.wishlist },
  });
});
