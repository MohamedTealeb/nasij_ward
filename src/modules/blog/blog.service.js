import { BlogModel } from "../../config/models/blog.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";


export const createBlog = asyncHandler(async (req, res, next) => {
  const body = req.body || {};
  const { description } = body;

  // ✅ معالجة آمنة لـ req.file
  const image = req.file ? `/uploads/blogs/${req.file.filename}` : "";
  
  const blogData = {
    image,
    description
  };

  const blog = await BlogModel.create(blogData);

  return successResponse({
    res,
    message: "Blog created successfully",
    data: { blog },
    statusCode: 201
  });
});


export const getAllBlogs = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    image,
    search,
    id,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;

  let filter = { isDeleted: { $ne: true } };

  // ✅ فلتر بالـ ID
  if (id) {
    filter._id = id;
  }

  // Add search filter
  if (search) {
    filter.description = { $regex: search, $options: "i" };
  }

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (pageNumber - 1) * pageSize;

  // Sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

  const totalBlogs = await BlogModel.countDocuments(filter);
  const blogs = await BlogModel.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(pageSize);

  return successResponse({
    res,
    message: "Blogs fetched successfully",
    data: {
      image,blogs,
      pagination: {
        total: totalBlogs,
        page: pageNumber,
        pages: Math.ceil(totalBlogs / pageSize),
        limit: pageSize
      }
    }
  });
});





export const updateBlog = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // ✅ معالجة آمنة لـ req.body
  const body = req.body || {};
  const { description } = body;
  
  // ✅ معالجة آمنة لـ req.file
  const image = req.file ? `/uploads/blogs/${req.file.filename}` : "";
  
  // ✅ إنشاء updateData مع التحقق من وجود البيانات
  const updateData = {};
  if (description !== undefined) {
    updateData.description = description;
  }
  if (image) {
    updateData.image = image;
  }
  
  // ✅ التحقق من وجود بيانات للتحديث
  if (Object.keys(updateData).length === 0) {
    return next(new Error("No data provided for update", { cause: 400 }));
  }

  const blog = await BlogModel.findOne({
    _id: id,
    isDeleted: { $ne: true }
  });

  if (!blog) {
    return next(new Error("Blog not found", { cause: 404 }));
  }

  const updatedBlog = await BlogModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return successResponse({
    res,
    message: "Blog updated successfully",
    data: { blog: updatedBlog }
  });
});


export const deleteBlog = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await BlogModel.findOne({
    _id: id,
    isDeleted: { $ne: true }
  });

  if (!blog) {
    return next(new Error("Blog not found", { cause: 404 }));
  }

  const deletedBlog = await BlogModel.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  return successResponse({
    res,
    message: "Blog deleted successfully",
    data: { blogId: deletedBlog._id, deletedAt: deletedBlog.deletedAt }
  });
});

export const getBlogById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await BlogModel.findOne({
    _id: id,
    isDeleted: { $ne: true }
  });

  if (!blog) {
    return next(new Error("Blog not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Blog fetched successfully",
    data: { blog },
  });
});

// Get user's own blogs

