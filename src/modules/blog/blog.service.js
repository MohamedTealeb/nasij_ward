import { BlogModel } from "../../config/models/blog.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";


export const createBlog = asyncHandler(async (req, res, next) => {
  const { author, description } = req.body;

  const blogData = {
    author,
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
    author,
    search,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;

  let filter = { isDeleted: { $ne: true } };

  // Add author filter
  if (author) {
    filter.author = author;
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
      blogs,
      pagination: {
        total: totalBlogs,
        page: pageNumber,
        pages: Math.ceil(totalBlogs / pageSize),
        limit: pageSize
      }
    }
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
    data: { blog }
  });
});


export const updateBlog = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

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

// Get user's own blogs
export const getMyBlogs = asyncHandler(async (req, res, next) => {
  const { author } = req.query;
  const { page = 1, limit = 10 } = req.query;

  let filter = {
    isDeleted: { $ne: true }
  };

  // Add author filter if provided
  if (author) {
    filter.author = author;
  }

  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const skip = (pageNumber - 1) * pageSize;

  const totalBlogs = await BlogModel.countDocuments(filter);
  const blogs = await BlogModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  return successResponse({
    res,
    message: "Blogs fetched successfully",
    data: {
      blogs,
      pagination: {
        total: totalBlogs,
        page: pageNumber,
        pages: Math.ceil(totalBlogs / pageSize),
        limit: pageSize
      }
    }
  });
});

