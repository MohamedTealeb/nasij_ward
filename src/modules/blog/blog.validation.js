import Joi from "joi";

// Validation for creating a new blog post
export const createBlogValidation = {
  body: Joi.object({
    image: Joi.string().optional(),
    description_ar: Joi.string()
      .min(5)
      .max(60000)
      .required()
      .messages({
        "string.min": "Blog description in Arabic must be at least 5 characters",
        "string.max": "Blog description in Arabic cannot exceed 60000 characters",
        "any.required": "Blog description in Arabic is required"
      }),
    description_en: Joi.string()
      .min(5)
      .max(60000)
      .required()
      .messages({
        "string.min": "Blog description in English must be at least 5 characters",
        "string.max": "Blog description in English cannot exceed 60000 characters",
        "any.required": "Blog description in English is required"
      })
  })
};

// Validation for updating a blog post
export const updateBlogValidation = {
  body: Joi.object({
    image: Joi.string().optional(),
    description_ar: Joi.string()
      .min(5)
      .max(60000)
      .optional()
      .allow("")
      .messages({
        "string.min": "Blog description in Arabic must be at least 5 characters",
        "string.max": "Blog description in Arabic cannot exceed 60000 characters"
      }),
    description_en: Joi.string()
      .min(5)
      .max(60000)
      .optional()
      .allow("")
      .messages({
        "string.min": "Blog description in English must be at least 5 characters",
        "string.max": "Blog description in English cannot exceed 60000 characters"
      })
  }).optional()
};

// Validation for blog ID parameter
export const blogIdValidation = {
  params: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid blog ID format",
        "any.required": "Blog ID is required"
      })
  })
};

// Validation for blog query parameters
export const blogQueryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    author: Joi.string().trim().optional(),
    search: Joi.string().trim().optional(),
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
      "string.pattern.base": "Invalid blog ID format"
    }),
    sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc")
  })
};
