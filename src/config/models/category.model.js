import mongoose from "mongoose";

const categorySchema=new mongoose.Schema({


 name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
     image: {
      type: String, 
      default: "",
    },




},{

 timestamps: true


})
categorySchema.virtual("Product", {
  ref: "Product",          // الموديل اللي عايز تعمله populate
  localField: "_id",       // ده من الكاتيجوري
  foreignField: "category" // ده من البرودكت
});
export const CategoryModel = mongoose.model("Category", categorySchema);
