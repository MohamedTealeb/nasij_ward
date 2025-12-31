import * as hotelService from "./hotel.service.js";
import { checkRole } from "../../middleware/authentication.middleware.js"
import { authMiddleware} from './../../middleware/authentication.middleware.js';
import { Router } from "express";
import { upload } from "../../utils/multer/cloud.multer.js";
const router = Router();
router.get("/all", hotelService.allHotels);
router.get("/:id", hotelService.getHotelById);
router.post(
  "/add",
  authMiddleware,
  checkRole("admin"),
  upload.single("image"),
  hotelService.addHotel
);
router.put(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  upload.single("image"),
  hotelService.updateHotel
);
router.delete(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  hotelService.removeHotel
);
export default router;

