import mongoose from "mongoose";



 const reviewSchema=new mongoose.Schema({

 

    name:{
        type:String,
    },
    review:{
        type:String,
        required:true,
        minlength:3,
        maxlength:1000,
    },
    rating:{
        type:Number,
        min:1,
        max:5,
        default:5,
    }


 },{

    timestamps:true
 })

 export const ReviewModel=mongoose.models.Review||mongoose.model("Review",reviewSchema)
