import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const categoryName = req.body.category || req.params.category;
      if (!categoryName) {
        return cb(new Error("Category name is required"), null);
      }

      const productName = req.body.product || req.params.product;

      let uploadPath = path.join("uploads", "categories", categoryName);

      if (productName) {
        uploadPath = path.join(uploadPath, productName);
      }

      fs.mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

export const upload = multer({ storage, fileFilter });
