import { ReviewModel } from "../../config/models/review.js";
import { asyncHandler, successResponse } from "../../utils/response.js";




export const createReview=asyncHandler(async(req,res,next)=>{

    const {name,rating,review}=req.body;
    const newReview=await ReviewModel.create({name,rating,review});
    return successResponse({
        res,
        message:"Review created successfully",
        data:{newReview},
    })
})

export const getReviews=asyncHandler(async(req,res,next)=>{
    const reviews=await ReviewModel.find();
    return successResponse({
        res,
        message:"Reviews fetched successfully",
        data:{reviews},
    })
})