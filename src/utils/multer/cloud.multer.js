import multer from "multer";
import path from "path";
import fs from "fs";

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // لازم يوصلك اسم الكاتيجوري من body أو params
      const categoryName = req.body.name || req.params.name;

      if (!categoryName) {
        return cb(new Error("Category name is required"), null);
      }

      let uploadPath;

      if (req.baseUrl.includes('/category')) {
        // رفع صورة الكاتيجوري نفسها
        uploadPath = path.join("uploads", "categories", categoryName);
      }
      else if (req.baseUrl.includes('/product')) {
        // رفع منتجات تابعة للكاتيجوري
        uploadPath = path.join("uploads", "categories", categoryName, "products");
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
    // ممكن تخصص التسمية حسب نوع الرفع
    let prefix = "file";
    if (req.baseUrl.includes('/category')) prefix = "category";
    else if (req.baseUrl.includes('/product')) prefix = "product";

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
