import { CategoryModel } from "../../config/models/category.model.js";
import fs from "fs";
import path from "path";

import { asyncHandler, successResponse } from "../../utils/response.js";

export const allCategories = asyncHandler(async (req, res, next) => {
  const { id, name, product } = req.query; 

  let filter = {};

  if (id) {
    filter._id = id;
  }

  if (name) {
    filter.name = { $regex: name, $options: "i" }; 
  }

  if (product) {
    filter.products = product;
  }

  const categories = await CategoryModel.find(filter).populate("Product"); 

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
  
  console.log("Add category - Request body:", req.body);
  console.log("Add category - Request file:", req.file);
  
  const image = req.file ? `/uploads/categories/${req.file.filename}` : "";

  const category = await CategoryModel.create({ name, description, image });

  return successResponse({
    res,
    message: "Category created successfully",
    data: { category },
  });
});



export const updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // 🟢 تأكد من وجود الكاتيجوري
  const oldCategory = await CategoryModel.findById(id);
  if (!oldCategory) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  // 🟢 اطبع البيانات اللي جاية للتأكد
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  const updateData = { ...req.body };

  // 🟢 لو في صورة جديدة
  if (req.file) {
    // امسح الصورة القديمة لو موجودة
    if (oldCategory.image) {
      const oldImagePath = path.join(process.cwd(), oldCategory.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Error deleting old image:", err.message);
        }
      });
    }

    // استخدم نفس الطريقة اللي في الـ add
    updateData.image = `/uploads/categories/${req.file.filename}`;
  }

  console.log("Update data:", updateData);

  const category = await CategoryModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  console.log("Updated category:", category);

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
