import * as productService from "./product.service.js";
import { checkRole, authMiddleware } from "../../middleware/authentication.middleware.js";
import { Router } from "express";
import { upload } from "../../utils/multer/cloud.multer.js";

const router = Router();

router.post(
  "/add",
  authMiddleware,
  checkRole("admin"),
  upload.single("image"),
  productService.addProduct
);
router.get("/all", productService.allProducts);


router.put(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  upload.single("image"),
  productService.updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  productService.removeProduct
);

export default router;
