import cron from "node-cron";
import fs from "fs";
import path from "path";
import { ProductModel } from './../../config/models/product.model.js';
import { CategoryModel } from './../../config/models/category.model.js';
export const startImageChecker = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("🔍 Checking images...");

    try {
      const products = await ProductModel.find();
      for (const product of products) {
        if (product.image) {
          const imagePath = path.join(process.cwd(), product.image);

          if (!fs.existsSync(imagePath)) {
            console.log(`🗑️ Image not found, removing from DB: ${product._id}`);
            product.image = undefined;
            await product.save();
          }
        }
      }

      const categories = await CategoryModel.find();
      for (const category of categories) {
        if (category.image) {
          const imagePath = path.join(process.cwd(), category.image);

          if (!fs.existsSync(imagePath)) {
            console.log(`🗑️ Category image not found, removing from DB: ${category._id}`);
            category.image = undefined;
            await category.save();
          }
        }
      }

      console.log("✅ Image check completed.");
    } catch (error) {
      console.error("❌ Error while checking images:", error.message);
    }
  });
};
