import { ProductModel } from "../../config/models/product.model.js";
import { CategoryModel } from "../../config/models/category.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import fs from "fs";
import path from "path";
import { createOtoProduct } from "../shipment/shipment.service.js";
import { v4 as uuidv4 } from "uuid";

export const allProducts = asyncHandler(async (req, res, next) => {
  const { id, name, category, color, size, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

  let filter = {};
  const andConditions = [];

  if (id) {
    filter._id = id;
  }
  
  // Search by name and description (Arabic or English)
  if (name) {
    const searchTerm = name.trim();
    // Escape special regex characters and create flexible search
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    filter.$or = [
      { name_ar: { $regex: escapedTerm, $options: "i" } },
      { name_en: { $regex: escapedTerm, $options: "i" } },
      { description_ar: { $regex: escapedTerm, $options: "i" } },
      { description_en: { $regex: escapedTerm, $options: "i" } }
    ];
  }
  
  if (category) {
    andConditions.push({ category: category });
  }
  if (color) {
    andConditions.push({ "colors.name": { $regex: color, $options: "i" } });
  }
  if (size) {
    andConditions.push({ sizes: { $in: [size] } });
  }

  if (minPrice || maxPrice) {
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    andConditions.push({ price: priceFilter });
  }

  // If we have additional conditions, combine with $and
  if (andConditions.length > 0) {
    if (filter.$or) {
      // If we have both $or (from name search) and other conditions, use $and
      filter = {
        $and: [
          { $or: filter.$or },
          ...andConditions
        ]
      };
    } else {
      // If we only have other conditions (no name search), add them directly
      andConditions.forEach(condition => {
        Object.assign(filter, condition);
      });
    }
  }

  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;

  // Debug: log the filter to see what we're searching for
  console.log("Search filter:", JSON.stringify(filter, null, 2));
  console.log("Search term:", name);

  const totalProducts = await ProductModel.countDocuments(filter);

  const products = await ProductModel.find(filter)
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  return successResponse({
    res,
    message: "Products fetched successfully",
    data: {
      products: products || [],
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
  console.log("OTO_API_BASE:", process.env.OTO_API_BASE);
  console.log("OTO_ACCESS_TOKEN:", process.env.OTO_ACCESS_TOKEN);
  const { name_ar, name_en, description_ar, description_en, price, category, colors, sizes, stock } = req.body;

  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  let coverImage = "";
  let images = [];

  if (req.files?.coverImage?.[0]) {
    coverImage = `/uploads/products/${req.files.coverImage[0].filename}`;
  }
  if (req.files?.images?.length) {
    images = req.files.images.map(f => `/uploads/products/${f.filename}`);
  }

  const colorImages = req.files?.colorImages?.map(f => `/uploads/products/${f.filename}`) || [];

  let parsedColors = [];
  if (colors) {
    try {
      const colorsArr = typeof colors === "string" ? JSON.parse(colors) : colors;
      if (!Array.isArray(colorsArr)) throw new Error("Colors must be an array");

      parsedColors = colorsArr.map((color, index) => ({
        name: color.name,
        hex: color.hex,
        image: colorImages[index] || "", 
      }));
    } catch (error) {
      return next(new Error("Invalid colors format", { cause: 400 }));
    }
  }

  let parsedSizes = [];
  if (sizes) {
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch {
      return next(new Error("Invalid sizes format", { cause: 400 }));
    }
  }

  const sku = uuidv4();

  let otoProductId = "";
  try {
    const otoProduct = await createOtoProduct({
      name: name_en || name_ar,
      sku,
      price: Number(price),
      description: description_en || description_ar,
      categoryName: categoryExists?.name_en || categoryExists?.name_ar || "",
      image: coverImage || images[0] || "",
      taxAmount: 0,
    });
    otoProductId =
      otoProduct?.data?.id ||
      otoProduct?.id ||
      otoProduct?.productId ||
      "";
  } catch (err) {
    return next(new Error("Failed to create product in OTO service", { cause: 502 }));
  }

  const product = await ProductModel.create({
    name_ar,
    name_en,
    description_ar,
    description_en,
    price,
    sku,
    otoProductId,
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

  const { name_ar, name_en, description_ar, description_en, price, category, colors, sizes, stock } = req.body;
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
  if (name_ar) updateData.name_ar = name_ar;
  if (name_en) updateData.name_en = name_en;
  if (description_ar) updateData.description_ar = description_ar;
  if (description_en) updateData.description_en = description_en;
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
