// import Joi from "joi";

// export const createShipmentValidation = {
//   body: Joi.object({
//     order: Joi.string().hex().length(24).required().messages({
//       "string.hex": "Order ID must be a valid MongoDB ObjectId",
//       "string.length": "Order ID must be exactly 24 characters",
//       "any.required": "Order ID is required"
//     }),
//     address: Joi.string().min(10).max(500).required().messages({
//       "string.min": "Address must be at least 10 characters",
//       "string.max": "Address cannot exceed 500 characters",
//       "any.required": "Address is required"
//     }),
//     carrier: Joi.string().valid("oto السعودية", "DHL", "FedEx", "Aramex", "SMSA", "Zajil", "Other").optional().messages({
//       "any.only": "Carrier must be one of: oto السعودية, DHL, FedEx, Aramex, SMSA, Zajil, Other"
//     }),
//     estimatedDelivery: Joi.date().greater('now').optional().messages({
//       "date.greater": "Estimated delivery date must be in the future"
//     })
//   })
// };

// export const updateShipmentStatusValidation = {
//   body: Joi.object({
//     status: Joi.string().valid("pending", "shipped", "delivered", "cancelled").required().messages({
//       "any.only": "Status must be one of: pending, shipped, delivered, cancelled",
//       "any.required": "Status is required"
//     })
//   })
// };

// export const trackingNumberValidation = {
//   params: Joi.object({
//     trackingNumber: Joi.string().alphanum().min(8).max(20).required().messages({
//       "string.alphanum": "Tracking number must contain only letters and numbers",
//       "string.min": "Tracking number must be at least 8 characters",
//       "string.max": "Tracking number cannot exceed 20 characters",
//       "any.required": "Tracking number is required"
//     })
//   })
// };

// export const shipmentQueryValidation = {
//   query: Joi.object({
//     page: Joi.number().integer().min(1).optional().messages({
//       "number.base": "Page must be a number",
//       "number.integer": "Page must be an integer",
//       "number.min": "Page must be at least 1"
//     }),
//     limit: Joi.number().integer().min(1).max(100).optional().messages({
//       "number.base": "Limit must be a number",
//       "number.integer": "Limit must be an integer",
//       "number.min": "Limit must be at least 1",
//       "number.max": "Limit cannot exceed 100"
//     }),
//     status: Joi.string().valid("pending", "shipped", "delivered", "cancelled").optional().messages({
//       "any.only": "Status must be one of: pending, shipped, delivered, cancelled"
//     }),
//     carrier: Joi.string().valid("oto السعودية", "DHL", "FedEx", "Aramex", "SMSA", "Zajil", "Other").optional().messages({
//       "any.only": "Carrier must be one of: oto السعودية, DHL, FedEx, Aramex, SMSA, Zajil, Other"
//     }),
//     user: Joi.string().hex().length(24).optional().messages({
//       "string.hex": "User ID must be a valid MongoDB ObjectId",
//       "string.length": "User ID must be exactly 24 characters"
//     }),
//     sortBy: Joi.string().valid("createdAt", "updatedAt", "status", "estimatedDelivery").optional().messages({
//       "any.only": "Sort by must be one of: createdAt, updatedAt, status, estimatedDelivery"
//     }),
//     sortOrder: Joi.string().valid("asc", "desc").optional().messages({
//       "any.only": "Sort order must be either 'asc' or 'desc'"
//     })
//   })
// };
