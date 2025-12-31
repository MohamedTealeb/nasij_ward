import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      let uploadPath;

      if (req.baseUrl.includes('/category')) {
        uploadPath = path.join("uploads", "categories");
      }
      else if (req.baseUrl.includes('/product')) {
        uploadPath = path.join("uploads", "products");
      }
      else if (req.baseUrl.includes('/blog')) {
        uploadPath = path.join("uploads", "blogs");
      }
      else if (req.baseUrl.includes('/products/colors')) {
        uploadPath = path.join("uploads", "products/colors");
      }
      else if (req.baseUrl.includes('/banners')) {
        uploadPath = path.join("uploads", "banners");
      }
      else if (req.baseUrl.includes('/hotel')) {
        uploadPath = path.join("uploads", "hotels");
      }
      else {
        uploadPath = path.join("uploads", "general");
      }

      fs.mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: (req, file, cb) => {
    let prefix = "file";
    if (req.baseUrl.includes('/category')) prefix = "category";
    else if (req.baseUrl.includes('/product')) prefix = "product";
    else if (req.baseUrl.includes('/blog')) prefix = "blog";
    else if (req.baseUrl.includes('/hotel')) prefix = "hotel";

    const uniqueName = `${prefix}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();

  // Banners: allow image OR video
  if (req.baseUrl.includes("/banners")) {
    const allowedImageExt = [".jpg", ".jpeg", ".png", ".webp"];
    const allowedVideoExt = [".mp4", ".mov", ".webm", ".mkv"];

    const isImage =
      allowedImageExt.includes(ext) && mime.startsWith("image/");
    const isVideo =
      allowedVideoExt.includes(ext) && mime.startsWith("video/");

    if (isImage || isVideo) return cb(null, true);
    return cb(new Error("Only image/video files are allowed for banners"), false);
  }

  // Default: images only
  const allowedImageTypes = /jpeg|jpg|png|webp/;
  if (allowedImageTypes.test(ext) && allowedImageTypes.test(mime)) return cb(null, true);
  return cb(new Error("Only images are allowed"), false);
};

export const upload = multer({ storage, fileFilter });
