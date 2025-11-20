import { ProductModel } from "../../config/models/product.model.js";
import { CategoryModel } from "../../config/models/category.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import fs from "fs";
import path from "path";

export const allProducts = asyncHandler(async (req, res, next) => {
  const { id, name, category } = req.query;

  let filter = {};

  if (id) {
    filter._id = id;
  }

  if (name) {
    filter.name = { $regex: name, $options: "i" }; 
  }

  if (category) {
    filter.category = category; 
  }

  const products = await ProductModel.find(filter).populate("category");

  if (!products || products.length === 0) {
    return next(new Error("No products found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Products fetched successfully",
    data: { products },
  });
});
export const addProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, category } = req.body;
  
  console.log("Add product - Request body:", req.body);
  console.log("Add product - Request file:", req.file);

  // check category exists
  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  // إنشاء الـ image path بناءً على الـ multer configuration
  let image = "";
  if (req.file) {
    // المسار الصحيح حسب الـ multer config الجديد
    image = `/uploads/products/${req.file.filename}`;
  }

  const product = await ProductModel.create({
    name,
    description,
    price,
    image,
    category,
  });

  return successResponse({
    res,
    message: "Product created successfully",
    data: { product },
  });
});



export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  console.log("Update product - Request body:", req.body);
  console.log("Update product - Request file:", req.file);

  // 🟢 تأكد من وجود المنتج
  const oldProduct = await ProductModel.findById(id).populate("category");
  if (!oldProduct) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  const updateData = { ...req.body };

  // 🟢 لو في صورة جديدة
  if (req.file) {
    // امسح الصورة القديمة لو موجودة
    if (oldProduct.image) {
      const oldImagePath = path.join(process.cwd(), oldProduct.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Error deleting old product image:", err.message);
        }
      });
    }

    // إنشاء المسار الصحيح للصورة الجديدة
    updateData.image = `/uploads/products/${req.file.filename}`;
  }

  // 🟢 لو في كاتيجوري جديد، تأكد من وجوده
  if (updateData.category) {
    const categoryExists = await CategoryModel.findById(updateData.category);
    if (!categoryExists) {
      return next(new Error("Category not found", { cause: 404 }));
    }
  }

  console.log("Update data:", updateData);

  const product = await ProductModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("category");

  console.log("Updated product:", product);

  return successResponse({
    res,
    message: "Product updated successfully",
    data: { product },
  });
});

export const removeProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await ProductModel.findByIdAndDelete(id);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Product deleted successfully",
    data: { product },
  });
});
