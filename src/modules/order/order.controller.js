import express from "express";
import { createOrder, getUserOrders, getAllOrders, getOrderById, getOrderByIdAdmin } from './order.service.js';
import { authMiddleware, checkRole } from './../../middleware/authentication.middleware.js';
const router = express.Router();
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getUserOrders);
router.get("/all-orders", authMiddleware, getAllOrders);
router.get("/:orderId",authMiddleware, getOrderById);
router.get("/admin/:orderId",authMiddleware,checkRole("admin"), getOrderByIdAdmin);


export default router;
