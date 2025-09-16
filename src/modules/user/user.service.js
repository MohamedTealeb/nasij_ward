import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";





export const AllUsers=asyncHandler(async(req,res,next)=>{

  const users=await UserModel.find()
  
  if (!users || users.length === 0) {
    return next(new Error("No users found", { cause: 404 }));
  }
  return successResponse({  res,
    message: "Users fetched successfully",
    data: { users },})

})
export const profile=asyncHandler(async(req,res,next)=>{


 const user = req.user;

  return successResponse({
    res,
    message: "Profile fetched successfully",
    data: { user },
  });

})

