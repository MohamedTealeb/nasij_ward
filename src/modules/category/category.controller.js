import * as categoryService from "./category.service.js";
import { checkRole } from "../../middleware/authentication.middleware.js"
import { authMiddleware} from './../../middleware/authentication.middleware.js';
import { Router } from "express";

const router = Router();

router.get("/all", categoryService.allCategories);
router.post(
  "/add",
  authMiddleware,
  checkRole("admin"),
  categoryService.addCategory
);
router.get("/:id", categoryService.singleCategory);


router.put(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  categoryService.updateCategory
);

router.delete(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  categoryService.removeCategory
);

export default router;
