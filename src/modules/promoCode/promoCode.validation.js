import Joi from "joi";

// Validation for creating a new promo code
export const createPromoCodeValidation = {
  body: Joi.object({
    code: Joi.string()
      .required()
      .trim()
      .min(3)
      .max(20)
      .messages({
        "string.min": "Promo code must be at least 3 characters",
        "string.max": "Promo code cannot exceed 20 characters",
        "any.required": "Promo code is required",
      }),
    description_ar: Joi.string().optional().allow(""),
    description_en: Joi.string().optional().allow(""),
    discountType: Joi.string()
      .valid("percentage", "fixed")
      .required()
      .messages({
        "any.only": "Discount type must be either 'percentage' or 'fixed'",
        "any.required": "Discount type is required",
      }),
    discountValue: Joi.number()
      .positive()
      .required()
      .messages({
        "number.positive": "Discount value must be a positive number",
        "any.required": "Discount value is required",
      }),
    startDate: Joi.date().required().messages({
      "date.base": "Start date must be a valid date",
      "any.required": "Start date is required",
    }),
    endDate: Joi.date()
      .required()
      .greater(Joi.ref("startDate"))
      .messages({
        "date.base": "End date must be a valid date",
        "date.greater": "End date must be after start date",
        "any.required": "End date is required",
      }),
    maxUses: Joi.number().integer().positive().allow(null).optional(),
    minPurchaseAmount: Joi.number().min(0).default(0).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

// Validation for updating a promo code
export const updatePromoCodeValidation = {
  body: Joi.object({
    code: Joi.string().trim().min(3).max(20).optional().messages({
      "string.min": "Promo code must be at least 3 characters",
      "string.max": "Promo code cannot exceed 20 characters",
    }),
    description_ar: Joi.string().optional().allow(""),
    description_en: Joi.string().optional().allow(""),
    discountType: Joi.string()
      .valid("percentage", "fixed")
      .optional()
      .messages({
        "any.only": "Discount type must be either 'percentage' or 'fixed'",
      }),
    discountValue: Joi.number().positive().optional().messages({
      "number.positive": "Discount value must be a positive number",
    }),
    startDate: Joi.date().optional().messages({
      "date.base": "Start date must be a valid date",
    }),
    endDate: Joi.date().optional().messages({
      "date.base": "End date must be a valid date",
    }),
    maxUses: Joi.number().integer().positive().allow(null).optional(),
    minPurchaseAmount: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
  }).optional(),
};

// Validation for promo code ID parameter
export const promoCodeIdValidation = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid promo code ID format",
        "any.required": "Promo code ID is required",
      }),
  }),
};

// Validation for validating a promo code
export const validatePromoCodeValidation = {
  body: Joi.object({
    code: Joi.string().required().trim().messages({
      "any.required": "Promo code is required",
    }),
    totalAmount: Joi.number().min(0).optional(),
  }),
};

// Validation for promo code query parameters
export const promoCodeQueryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    code: Joi.string().trim().optional(),
    isActive: Joi.string().valid("true", "false").optional(),
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "Invalid promo code ID format",
      }),
  }),
};


