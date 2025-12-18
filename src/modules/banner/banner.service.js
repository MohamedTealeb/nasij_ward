import { BannerModel } from "../../config/models/banner.js";
import { successResponse } from "../../utils/response.js";

export const createBanner = async (req, res, next) => {
  try {
    const media = req.file?.path;
    const mime = (req.file?.mimetype || "").toLowerCase();
    const mediaType = mime.startsWith("video/") ? "video" : "image";

    if (!media) {
      return next(new Error("Banner media (image/video) is required", { cause: 400 }));
    }

    const banner = await BannerModel.create({
      media,
      mediaType,
      // legacy
      image: mediaType === "image" ? media : "",
    });

    return successResponse({
      res,
      message: "Banner created successfully",
      data: { banner },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await BannerModel.find();
    return successResponse({
      res,
      data: { banners },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await BannerModel.findByIdAndDelete(req.params.id);

    if (!banner) {
      return next(new Error("Banner not found", { cause: 404 }));
    }

    return successResponse({
      res,
      message: "Banner deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
