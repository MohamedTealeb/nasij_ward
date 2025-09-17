import mongoose from "mongoose";
const wishlistSchema=new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        requored:true
    },
     addedAt: {
      type: Date,
      default: Date.now,
    },



},{



    timestamps:true
})

export const WishlistModel=mongoose.model("wishlist",wishlistSchema)