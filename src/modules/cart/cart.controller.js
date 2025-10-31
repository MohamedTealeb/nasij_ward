import { Router } from "express";
import * as CartService from'./cart.service.js'
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/authentication.middleware.js";

const router=Router()

// ✅ Routes للعربة
router.get("/",optionalAuthMiddleware,CartService.getCart)
router.post("/add",optionalAuthMiddleware,CartService.addToCart)
router.delete("/:productId",optionalAuthMiddleware,CartService.removeFromCart)
router.put("/:productId",optionalAuthMiddleware,CartService.updateCartItemQuantity)

// ✅ Route جديد: نقل جميع منتجات الـ wishlist إلى العربة
router.post("/add-wishlist", authMiddleware, CartService.addWishlistToCart)

// ✅ Route جديد: دمج Guest Cart مع User Cart
router.post("/merge-guest", authMiddleware, CartService.mergeGuestCart)

// ✅ Route جديد: إضافة منتج واحد من الـ wishlist إلى العربة
router.post("/add-wishlist-item/:productId", authMiddleware, CartService.addSingleWishlistItemToCart)

export default router