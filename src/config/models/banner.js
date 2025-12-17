import mongoose from "mongoose";


const bannerSchema = new mongoose.Schema({

  // legacy field (keep for backward compatibility)
  image: {
    type: String,
    default: "",
  },

  media: {
    type: String,
    required: [true, "Banner media (image/video) is required"],
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },



}, {
  timestamps: true,
});
export const BannerModel = mongoose.model("Banner", bannerSchema);
