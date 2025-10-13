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
 toJSON: { virtuals: true },
 toObject: { virtuals: true }
})
categorySchema.virtual("products", {
  ref: "Product",          
  localField: "_id",      
  foreignField: "category" 
});
export const CategoryModel = mongoose.model("Category", categorySchema);
