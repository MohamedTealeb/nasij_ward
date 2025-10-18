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
      else {
        uploadPath = path.join("uploads", "general");
      }

      // إنشاء المجلدات لو مش موجودة
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

    const uniqueName = `${prefix}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

export const upload = multer({ storage, fileFilter });
