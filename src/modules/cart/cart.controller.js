import { Router } from "express";
import * as CartService from'./cart.service.js'
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/authentication.middleware.js";

const router=Router()

router.get("/",optionalAuthMiddleware,CartService.getCart)
router.post("/add",optionalAuthMiddleware,CartService.addToCart)
router.delete("/:productId",optionalAuthMiddleware,CartService.removeFromCart)
router.put("/:productId",optionalAuthMiddleware,CartService.updateCartItemQuantity)

router.post("/add-wishlist", authMiddleware, CartService.addWishlistToCart)

router.post("/merge-guest", authMiddleware, CartService.mergeGuestCart)

router.post("/add-wishlist-item/:productId", authMiddleware, CartService.addSingleWishlistItemToCart)

export default router