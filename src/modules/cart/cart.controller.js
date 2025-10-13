import { Router } from "express";
import * as CartService from'./cart.service.js'
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/authentication.middleware.js";
const router=Router()
router.get("/",optionalAuthMiddleware,CartService.getCart)
router.post("/add",optionalAuthMiddleware,CartService.addToCart)
router.delete("/:productId",optionalAuthMiddleware,CartService.removeFromCart)
export default router