import * as categoryService from "./category.service.js";
import { checkRole } from "../../middleware/authentication.middleware.js"
import { authMiddleware} from './../../middleware/authentication.middleware.js';
import { Router } from "express";
import { upload } from "../../utils/multer/cloud.multer.js";
const router = Router();
router.get("/all", categoryService.allCategories);
router.get("/:id", categoryService.getCategoryById);
router.post(
  "/add",
  authMiddleware,
  checkRole("admin"),
  upload.single("image"),
  categoryService.addCategory
);
router.put(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  upload.single("image"),
  categoryService.updateCategory
);
router.delete(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  categoryService.removeCategory
);
export default router;
