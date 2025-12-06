
import { Router } from "express";
import { authMiddleware, checkShipmentAccess } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as shipmentService from "./shipment.service.js";
// import {
//   createShipmentValidation,
//   updateShipmentStatusValidation,
//   trackingNumberValidation,
//   shipmentQueryValidation,
// } from "./shipment.validation.js";

const router = Router();

// router.get("/", validation(shipmentQueryValidation), shipmentService.getAllShipments);
// router.get("/track/:trackingNumber", validation(trackingNumberValidation), shipmentService.getShipmentByTrackingNumber);

router.post("/estimate", shipmentService.getShippingCostEstimate);
router.post("/", authMiddleware, shipmentService.createShipment);
// router.put("/:id/status", authMiddleware, checkShipmentAccess, validation(updateShipmentStatusValidation), shipmentService.updateShipmentStatus);
// router.delete("/:id", authMiddleware, checkShipmentAccess, shipmentService.deleteShipment);

export default router;
