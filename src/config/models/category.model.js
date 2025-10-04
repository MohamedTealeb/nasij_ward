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

 timestamps: true,
})
categorySchema.virtual("Product", {
  ref: "Product",          
  localField: "_id",      
  foreignField: "category" 
});
export const CategoryModel = mongoose.model("Category", categorySchema);
