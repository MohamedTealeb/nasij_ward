import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";





export const AllUsers = asyncHandler(async (req, res, next) => {
  const { id, email } = req.query;

  let filter = {};

  if (id) {
    filter._id = id;
  }

  if (email) {
    filter.email = email;
  }

  const users = await UserModel.find(filter);

  if (!users || users.length === 0) {
    return next(new Error("No users found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Users fetched successfully",
    data: { users },
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

