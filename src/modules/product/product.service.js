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
  const { name, description, price, category, colors, sizes, stock } = req.body;

  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  let coverImage = "";
  let images = [];

  // ✅ 1. رفع صور المنتج العامة
  if (req.files?.coverImage?.[0]) {
    coverImage = `/uploads/products/${req.files.coverImage[0].filename}`;
  }
  if (req.files?.images?.length) {
    images = req.files.images.map(f => `/uploads/products/${f.filename}`);
  }

  // ✅ 2. رفع صور الألوان
  const colorImages = req.files?.colorImages?.map(f => `/uploads/products/${f.filename}`) || [];

  // ✅ 3. Parse الألوان وربط كل لون بالصورة الخاصة بيه
  let parsedColors = [];
  if (colors) {
    try {
      const colorsArr = typeof colors === "string" ? JSON.parse(colors) : colors;
      if (!Array.isArray(colorsArr)) throw new Error("Colors must be an array");

      parsedColors = colorsArr.map((color, index) => ({
        name: color.name,
        hex: color.hex,
        image: colorImages[index] || "", // هنا بيربط الصورة بنفس ترتيبها
      }));
    } catch (error) {
      return next(new Error("Invalid colors format", { cause: 400 }));
    }
  }

  // ✅ 4. Parse الأحجام
  let parsedSizes = [];
  if (sizes) {
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
  }

  // ✅ 5. إنشاء المنتج
  const product = await ProductModel.create({
    name,
    description,
    price,
    coverImage,
    images,
    category,
    colors: parsedColors,
    sizes: parsedSizes,
    stock,
  });

  return successResponse({
    res,
    message: "Product created successfully",
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const oldProduct = await ProductModel.findById(id);
  if (!oldProduct) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  const { name, description, price, category, colors, sizes, stock } = req.body;
  const updateData = {};

  // ✅ 1. التأكد من صلاحية الـ Category لو اتغيرت
  if (category) {
    const categoryExists = await CategoryModel.findById(category);
    if (!categoryExists) {
      return next(new Error("Category not found", { cause: 404 }));
    }
    updateData.category = category;
  }

  // ✅ 2. تحديث صور المنتج العامة
  if (req.files?.coverImage?.[0]) {
    // حذف الصورة القديمة لو فيه واحدة
    if (oldProduct.coverImage) {
      const oldPath = path.join(process.cwd(), oldProduct.coverImage);
      fs.unlink(oldPath, (err) => {
        if (err) console.error("Error deleting old cover image:", err.message);
      });
    }
    updateData.coverImage = `/uploads/products/${req.files.coverImage[0].filename}`;
  }

  if (req.files?.images?.length) {
    updateData.images = req.files.images.map((f) => `/uploads/products/${f.filename}`);
  }

  // ✅ 3. تجهيز صور الألوان الجديدة (حسب الترتيب)
  const colorImages =
    req.files?.colorImages?.map((f) => `/uploads/products/${f.filename}`) || [];

  // ✅ 4. Parse وتحديث الألوان بالترتيب
  if (colors) {
    try {
      const colorsArr = typeof colors === "string" ? JSON.parse(colors) : colors;
      if (!Array.isArray(colorsArr)) throw new Error("Colors must be an array");

      const parsedColors = colorsArr.map((color, index) => {
        const existingColor = oldProduct.colors?.[index];
        return {
          name: color.name,
          hex: color.hex,
          // استخدم الصورة الجديدة إن وجدت، وإلا الصورة المرسلة من العميل، وإلا الصورة القديمة، وإلا ""
          image: colorImages[index] || color.image || existingColor?.image || "",
        };
      });

      updateData.colors = parsedColors;
    } catch (error) {
      return next(new Error("Invalid colors format", { cause: 400 }));
    }
  }

  // ✅ 5. Parse وتحديث الأحجام
  if (sizes) {
    try {
      updateData.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
  }

  // ✅ 6. باقي الحقول الأساسية
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (price) updateData.price = price;
  if (stock !== undefined) updateData.stock = stock;

  // ✅ 7. تحديث المنتج في قاعدة البيانات
  const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("category");

  return successResponse({
    res,
    message: "Product updated successfully",
    data: { product: updatedProduct },
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
