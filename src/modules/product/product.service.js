import { ProductModel } from "../../config/models/product.model.js";
import { CategoryModel } from "../../config/models/category.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

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
  const image = req.file ? `/uploads/products/${req.file.filename}` : "";

  // check category exists
  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return next(new Error("Category not found", { cause: 404 }));
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

export const singleProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await ProductModel.findById(id).populate("category");
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Product fetched successfully",
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (req.file) {
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
  }).populate("category");

  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

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
