import { Router } from "express";
import { authMiddleware } from "../../middleware/authentication.middleware.js";
import * as shipmentService from "./shipment.service.js";


const router = Router();




 
// router.post("/", authMiddleware, shipmentService.createOtoOrderFromOrder);
// router.post("/cancel/:orderId", shipmentService.cancelOtoOrder);

export default router;

