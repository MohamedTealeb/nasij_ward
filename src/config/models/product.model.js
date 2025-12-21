import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
  {
    id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
     
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hex: {
      type: String,
      required: true,
      match: /^#([0-9A-F]{3}){1,2}$/i,
    },
    image: {
      type: String,
      default: "",
    },
  },
 
);

const productSchema = new mongoose.Schema(
  {
    name_ar: { type: String, required: true, trim: true },
    name_en: { type: String, required: true, trim: true },
    description_ar: { type: String, default: "" },
    description_en: { type: String, default: "" },
    price: { type: Number, required: true },
    sku: { type: String, required: true, unique: true, trim: true },
    otoProductId: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    images: { type: [String], default: [] },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    colors: [colorSchema], 
    sizes: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model("Product", productSchema);
