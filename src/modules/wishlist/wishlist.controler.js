import express from "express";
import *as wishlistService from "./wishlist.service.js";
import { authMiddleware } from "../../middleware/authentication.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware,wishlistService.addToWishlist);
router.delete("/remove/:productId",authMiddleware, wishlistService.removeFromWishlist);
router.get("/",authMiddleware, wishlistService.getWishlist);

export default router;