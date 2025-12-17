import { Router } from "express";
import * as bannerController from "./banner.service.js";
import { upload } from "../../utils/multer/cloud.multer.js";
import { authMiddleware, checkRole } from "../../middleware/authentication.middleware.js";


const router=Router();
router.post("/create",authMiddleware,checkRole('admin'),upload.single("image"),bannerController.createBanner);
router.get("/all",bannerController.getAllBanners);
router.delete("/:id",authMiddleware,checkRole('admin'),bannerController.deleteBanner);


export default router;