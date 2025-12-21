import mongoose from "mongoose";
const categorySchema=new mongoose.Schema({
 name_ar: {
      type: String,
      required: true,
      trim: true,
    },
    name_en: {
      type: String,
      required: true,
      trim: true,
    },
    description_ar: {
      type: String,
      default: "",
    },
    description_en: {
      type: String,
      default: "",
    },
     image: {
      type: String, 
      default: "",
    },
},{
 timestamps: true,
 toJSON: { virtuals: true },
 toObject: { virtuals: true }
})
categorySchema.virtual("products", {
  ref: "Product",          
  localField: "_id",      
  foreignField: "category" 
});
export const CategoryModel = mongoose.model("Category", categorySchema);
