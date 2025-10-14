import { ProductModel } from "../../config/models/product.model.js";
import { CategoryModel } from "../../config/models/category.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import fs from "fs";
import path from "path";

export const allProducts = asyncHandler(async (req, res, next) => {
  const { id, name, category, color, size, page = 1, limit = 10 } = req.query;
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
  if (color) {
    filter["colors.name"] = { $regex: color, $options: "i" };
  }
  if (size) {
    filter["sizes"] = { $in: [size] };
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
  const { name, description, price, category, colors, sizes ,stock } = req.body;
  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  let coverImage = "";
  let images = [];

  if (req.files && req.files.coverImage && req.files.coverImage[0]) {
    coverImage = `/uploads/products/${req.files.coverImage[0].filename}`;
  }

  if (req.files && req.files.images && Array.isArray(req.files.images)) {
    images = req.files.images.map((f) => `/uploads/products/${f.filename}`);
  }

  // Parse colors if provided
  let parsedColors = [];
  if (colors) {
    try {
      parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      // Validate colors structure
      if (!Array.isArray(parsedColors)) {
        return next(new Error("Colors must be an array", { cause: 400 }));
      }
      // Validate each color object
      for (const color of parsedColors) {
        if (!color.name || !color.hex) {
          return next(new Error("Each color must have name and hex", { cause: 400 }));
        }
        // Validate hex format
        if (!/^#([0-9A-F]{3}){1,2}$/i.test(color.hex)) {
          return next(new Error("Invalid hex color format", { cause: 400 }));
        }
      }
    } catch (error) {
      return next(new Error("Invalid colors format", { cause: 400 }));
    }
  }

  // Parse sizes if provided
  let parsedSizes = [];
  if (sizes) {
    try {
      parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      // Validate sizes structure
      if (!Array.isArray(parsedSizes)) {
        return next(new Error("Sizes must be an array", { cause: 400 }));
      }
      // Validate each size is a string
      for (const size of parsedSizes) {
        if (typeof size !== 'string') {
          return next(new Error("Each size must be a string", { cause: 400 }));
        }
      }
    } catch (error) {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
  }
  if (stock <= 0) {
    if (typeof stock !== 'number') {
      return next(new Error("Stock must be a number", { cause: 400 }));
    }
  }

  const product = await ProductModel.create({
    name,
    description,
    price,
    coverImage,
    images,
    category,
    colors: parsedColors,
    sizes: parsedSizes,
    stock
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

  // Handle coverImage replacement
  if (req.files && req.files.coverImage && req.files.coverImage[0]) {
    if (oldProduct.coverImage) {
      const oldCoverPath = path.join(process.cwd(), oldProduct.coverImage);
      fs.unlink(oldCoverPath, (err) => {
        if (err) {
          console.error("Error deleting old product cover image:", err.message);
        }
      });
    }
    updateData.coverImage = `/uploads/products/${req.files.coverImage[0].filename}`;
  }

  // If new images uploaded, replace the images array
  if (req.files && req.files.images && Array.isArray(req.files.images) && req.files.images.length > 0) {
    updateData.images = req.files.images.map((f) => `/uploads/products/${f.filename}`);
  }

  // Handle colors update
  if (updateData.colors) {
    try {
      const parsedColors = typeof updateData.colors === 'string' ? JSON.parse(updateData.colors) : updateData.colors;
      // Validate colors structure
      if (!Array.isArray(parsedColors)) {
        return next(new Error("Colors must be an array", { cause: 400 }));
      }
      // Validate each color object
      for (const color of parsedColors) {
        if (!color.name || !color.hex) {
          return next(new Error("Each color must have name and hex", { cause: 400 }));
        }
        // Validate hex format
        if (!/^#([0-9A-F]{3}){1,2}$/i.test(color.hex)) {
          return next(new Error("Invalid hex color format", { cause: 400 }));
        }
      }
      updateData.colors = parsedColors;
    } catch (error) {
      return next(new Error("Invalid colors format", { cause: 400 }));
    }
  }

  // Handle sizes update
  if (updateData.sizes) {
    try {
      const parsedSizes = typeof updateData.sizes === 'string' ? JSON.parse(updateData.sizes) : updateData.sizes;
      // Validate sizes structure
      if (!Array.isArray(parsedSizes)) {
        return next(new Error("Sizes must be an array", { cause: 400 }));
      }
      // Validate each size is a string
      for (const size of parsedSizes) {
        if (typeof size !== 'string') {
          return next(new Error("Each size must be a string", { cause: 400 }));
        }
      }
      updateData.sizes = parsedSizes;
    } catch (error) {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
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
