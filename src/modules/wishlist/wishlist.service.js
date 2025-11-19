import { ProductModel } from "../../config/models/product.model.js";
import { UserModel } from "../../config/models/user.model.js"; // لازم يكون عندك موديل User
import { WishlistModel } from "../../config/models/wishlist.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const getWishlist = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // ✅ هنا بنجيب كل العناصر من جدول الـ Wishlist مباشرة
  const wishlist = await WishlistModel.find({ user: userId })
    .populate({
      path: "product",
      select: "name description price coverImage colors sizes stock createdAt updatedAt",
    });

  return successResponse({
    res,
    message: "Wishlist fetched successfully",
    data: { wishlist },
  });
});

export const addToWishlist = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, color, size } = req.body;

  if (!color || !size) {
    return next(new Error("Color and size are required", { cause: 400 }));
  }

  const product = await ProductModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  // ✅ التأكد إن المنتج مش مضاف مسبقًا بنفس اللون والمقاس
  const existing = await WishlistModel.findOne({
    user: userId,
    product: productId,
    color,
    size,
  });

  if (existing) {
    return successResponse({
      res,
      message: "Product already in wishlist",
      data: { wishlistItem: existing },
    });
  }

  const newItem = await WishlistModel.create({
    user: userId,
    product: productId,
    color,
    size,
  });

  return successResponse({
    res,
    message: "Product added to wishlist successfully",
    data: { wishlistItem: newItem },
  });
});


export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { color, size } = req.body;

  const deleted = await WishlistModel.findOneAndDelete({
    user: userId,
    product: productId,
    color,
    size,
  });

  if (!deleted) {
    return next(new Error("Product not found in wishlist", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Product removed from wishlist successfully",
  });
});