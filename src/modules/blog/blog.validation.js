import Joi from "joi";

// Validation for creating a new blog post
export const createBlogValidation = {
  body: Joi.object({
    author: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        "string.min": "Author name must be at least 2 characters",
        "string.max": "Author name cannot exceed 50 characters",
        "any.required": "Author name is required"
      }),
    description: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        "string.min": "Blog description must be at least 10 characters",
        "string.max": "Blog description cannot exceed 1000 characters",
        "any.required": "Blog description is required"
      })
  })
};

// Validation for updating a blog post
export const updateBlogValidation = {
  body: Joi.object({
    author: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        "string.min": "Author name must be at least 2 characters",
        "string.max": "Author name cannot exceed 50 characters"
      }),
    description: Joi.string()
      .min(10)
      .max(1000)
      .optional()
      .messages({
        "string.min": "Blog description must be at least 10 characters",
        "string.max": "Blog description cannot exceed 1000 characters"
      })
  })
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
    sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc")
  })
};
