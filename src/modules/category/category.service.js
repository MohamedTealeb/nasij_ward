import { CategoryModel } from "../../config/models/category.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const allCategories = asyncHandler(async (req, res, next) => {
  const categories = await CategoryModel.find();

  if (!categories || categories.length === 0) {
    return next(new Error("No categories found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Categories fetched successfully",
    data: { categories },
  });
});

export const addCategory = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  const category = await CategoryModel.create({ name, description });

  return successResponse({
    res,
    message: "Category created successfully",
    data: { category },
  });
});

export const singleCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await CategoryModel.findById(id);
  if (!category) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Category fetched successfully",
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await CategoryModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!category) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Category updated successfully",
    data: { category },
  });
});

export const removeCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await CategoryModel.findByIdAndDelete(id);
  if (!category) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Category deleted successfully",
    data: { category },
  });
});
