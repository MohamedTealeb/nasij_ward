import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    colors: [
      {
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
      },
    ],
    sizes: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

 

   
  },
  {
    timestamps: true,
  }
);
export const ProductModel = mongoose.model("Product", productSchema);
