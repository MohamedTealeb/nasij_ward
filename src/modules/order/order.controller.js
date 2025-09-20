import express from "express";
import { createOrder, getUserOrders } from './order.service.js';
import { authMiddleware } from './../../middleware/authentication.middleware.js';
const router = express.Router();
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getUserOrders);

export default router;
