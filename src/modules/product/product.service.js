import { ProductModel } from "../../config/models/product.model.js";
import { CategoryModel } from "../../config/models/category.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import fs from "fs";
import path from "path";

export const allProducts = asyncHandler(async (req, res, next) => {
  const { id, name, category, page = 1, limit = 10 } = req.query;
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
  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  const totalProducts = await ProductModel.countDocuments(filter);
  const products = await ProductModel.find(filter)
    .populate("category")
    .skip(skip)
    .limit(pageSize);
  if (!products || products.length === 0) {
    return next(new Error("No products found", { cause: 200 }));
  }
  return successResponse({
    res,
    message: "Products fetched successfully",
    data: {
      products,
      pagination: {
        total: totalProducts,
        page: pageNumber,
        pages: Math.ceil(totalProducts / pageSize),
        limit: pageSize,
      },
    },
  });
});

export const addProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, category } = req.body;
  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return next(new Error("Category not found", { cause: 404 }));
  }
  let image = "";
  if (req.file) {
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
  const oldProduct = await ProductModel.findById(id).populate("category");
  if (!oldProduct) {
    return next(new Error("Product not found", { cause: 404 }));
  }
  const updateData = { ...req.body };
  if (req.file) {
    if (oldProduct.image) {
      const oldImagePath = path.join(process.cwd(), oldProduct.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Error deleting old product image:", err.message);
        }
      });
    }
    updateData.image = `/uploads/products/${req.file.filename}`;
  }
  if (updateData.category) {
    const categoryExists = await CategoryModel.findById(updateData.category);
    if (!categoryExists) {
      return next(new Error("Category not found", { cause: 404 }));
    }
  }
  const product = await ProductModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("category");
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
