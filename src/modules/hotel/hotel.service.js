import { HotelModel } from "../../config/models/hotel.model.js";
import fs from "fs";
import path from "path";

import { asyncHandler, successResponse } from "../../utils/response.js";

export const allHotels = asyncHandler(async (req, res, next) => {
  const { id, name, page = 1, limit = 10 } = req.query;
  let filter = {};
  if (id) {
    filter._id = id;
  }
  if (name) {
    filter.$or = [
      { name_ar: { $regex: name, $options: "i" } },
      { name_en: { $regex: name, $options: "i" } }
    ];
  }
  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  const totalHotels = await HotelModel.countDocuments(filter);
  const hotels = await HotelModel.find(filter)
    .skip(skip)
    .limit(pageSize);
  return successResponse({
    res,
    message: "Hotels fetched successfully",
    data: {
      hotels,
      pagination: {
        total: totalHotels,
        page: pageNumber,
        pages: Math.ceil(totalHotels / pageSize),
        limit: pageSize,
      },
    },
  });
});

export const addHotel = asyncHandler(async (req, res, next) => {
  const { name_ar, name_en, description_ar, description_en } = req.body;  
  
  const image = req.file ? `/uploads/hotels/${req.file.filename}` : "";
  const hotel = await HotelModel.create({ name_ar, name_en, description_ar, description_en, image });
  return successResponse({
    res,
    message: "Hotel created successfully",
    data: { hotel },
  });
});
export const updateHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const oldHotel = await HotelModel.findById(id);
  if (!oldHotel) {
    return next(new Error("Hotel not found", { cause: 404 }));
  }
  const updateData = { ...req.body };
  if (req.file) {
    if (oldHotel.image) {
      const oldImagePath = path.join(process.cwd(), oldHotel.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Error deleting old image:", err.message);
        }
      });
    }
    updateData.image = `/uploads/hotels/${req.file.filename}`;
  }
  const hotel = await HotelModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  return successResponse({
    res,
    message: "Hotel updated successfully",
    data: { hotel },
  });
});
export const removeHotel = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await HotelModel.findByIdAndDelete(id);
  if (!hotel) {
    return next(new Error("Hotel not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Hotel deleted successfully",
    data: { hotel },
  });
});
export const getHotelById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const hotel = await HotelModel.findById(id);
  
  if (!hotel) {
    return next(new Error("Hotel not found", { cause: 404 }));
  }
  
  return successResponse({
    res,
    message: "Hotel fetched successfully",
    data: { hotel },
  });
});

