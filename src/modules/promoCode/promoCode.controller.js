import * as promoCodeService from "./promoCode.service.js";
import { checkRole } from "../../middleware/authentication.middleware.js";
import { authMiddleware } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { Router } from "express";
import {
  createPromoCodeValidation,
  updatePromoCodeValidation,
  promoCodeIdValidation,
  validatePromoCodeValidation,
  promoCodeQueryValidation,
} from "./promoCode.validation.js";

const router = Router();

// Public route - validate promo code (accepts any body)
router.post("/validate", promoCodeService.validatePromoCode);

// Public route - get all promo codes (for admin viewing)
router.get(
  "/all",
  validation(promoCodeQueryValidation),
  promoCodeService.allPromoCodes
);

// Public route - get promo code by ID
router.get(
  "/:id",
  validation(promoCodeIdValidation),
  promoCodeService.getPromoCodeById
);

// Admin routes
router.post(
  "/add",
  authMiddleware,
  checkRole("admin"),
  validation(createPromoCodeValidation),
  promoCodeService.addPromoCode
);

router.put(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  validation({ ...promoCodeIdValidation, ...updatePromoCodeValidation }),
  promoCodeService.updatePromoCode
);

router.delete(
  "/:id",
  authMiddleware,
  checkRole("admin"),
  validation(promoCodeIdValidation),
  promoCodeService.removePromoCode
);

export default router;

