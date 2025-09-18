import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
export const AllUsers = asyncHandler(async (req, res, next) => {
  const { id, email, page = 1, limit = 10 } = req.query;
  let filter = {};
  if (id) {
    filter._id = id;
  }
  if (email) {
    filter.email = email;
  }
  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  const totalUsers = await UserModel.countDocuments(filter);
  const users = await UserModel.find(filter)
    .select("-password -phone -__v")
    .skip(skip)
    .limit(pageSize);
  if (!users || users.length === 0) {
    return next(new Error("No users found", { cause: 404 }));
  }
  return successResponse({
    res,
    message: "Users fetched successfully",
    data: {
      users,
      pagination: {
        total: totalUsers,
        page: pageNumber,
        pages: Math.ceil(totalUsers / pageSize),
        limit: pageSize,
      },
    },
  });
});
export const profile=asyncHandler(async(req,res,next)=>{
 const user = req.user;
  return successResponse({
    res,
    message: "Profile fetched successfully",
    data: { user },
  });

})
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await UserModel.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }
  return successResponse({
    res,
    message: "User soft deleted successfully",
    data: { userId: user._id, deletedAt: user.deletedAt },
  });
});
