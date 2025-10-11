import express from "express";
import { createOrder, getUserOrders, getAllOrders } from './order.service.js';
import { authMiddleware } from './../../middleware/authentication.middleware.js';
const router = express.Router();
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getUserOrders);
router.get("/all-orders", authMiddleware, getAllOrders);

export default router;
