import { Router } from "express";
import { authMiddleware } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";

import * as blogService from "./blog.service.js";
import {
  createBlogValidation,
  updateBlogValidation,
  blogIdValidation,
  blogQueryValidation
} from "./blog.validation.js";
import { upload } from "../../utils/multer/cloud.multer.js";

const router = Router();

// Public routes (no authentication required)
router.get("/", validation(blogQueryValidation),  blogService.getAllBlogs);
router.get("/:id", validation(blogIdValidation), blogService.getBlogById);

// Protected routes (authentication required)
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  validation(createBlogValidation),
  blogService.createBlog
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  validation({ ...blogIdValidation, ...updateBlogValidation }),
  blogService.updateBlog
);

router.delete(
  "/:id",
  authMiddleware,
  validation(blogIdValidation),
  blogService.deleteBlog
);



export default router;
