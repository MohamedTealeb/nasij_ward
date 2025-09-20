import { Router } from "express";
import * as CartService from'./cart.service.js'
import { authMiddleware } from "../../middleware/authentication.middleware.js";
const router=Router()
router.get("/",authMiddleware,CartService.getCart)
router.post("/add",authMiddleware,CartService.addToCart)
router.delete("/:productId",authMiddleware,CartService.removeFromCart)
export default router