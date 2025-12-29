import { PromoCodeModel } from "../../config/models/promoCode.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const allPromoCodes = asyncHandler(async (req, res, next) => {
  const { id, code, isActive, page = 1, limit = 10 } = req.query;
  let filter = {};

  if (id) {
    filter._id = id;
  }
  if (code) {
    filter.code = { $regex: code, $options: "i" };
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;

  const totalPromoCodes = await PromoCodeModel.countDocuments(filter);
  const promoCodes = await PromoCodeModel.find(filter)
    .skip(skip)
    .limit(pageSize)
    .sort({ createdAt: -1 });

  return successResponse({
    res,
    message: "Promo codes fetched successfully",
    data: {
      promoCodes,
      pagination: {
        total: totalPromoCodes,
        page: pageNumber,
        pages: Math.ceil(totalPromoCodes / pageSize),
        limit: pageSize,
      },
    },
  });
});

export const addPromoCode = asyncHandler(async (req, res, next) => {
  const {
    code,
    description_ar,
    description_en,
    discountType,
    discountValue,
    startDate,
    endDate,
    maxUses,
    minPurchaseAmount,
    isActive,
  } = req.body;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (end <= start) {
    return next(new Error("End date must be after start date", { cause: 400 }));
  }

  // Validate discount value based on type
  if (discountType === "percentage" && discountValue > 100) {
    return next(
      new Error("Percentage discount cannot exceed 100%", { cause: 400 })
    );
  }

  // Check if code already exists
  const existingCode = await PromoCodeModel.findOne({
    code: code.toUpperCase(),
  });
  if (existingCode) {
    return next(new Error("Promo code already exists", { cause: 400 }));
  }

  const promoCode = await PromoCodeModel.create({
    code: code.toUpperCase(),
    description_ar,
    description_en,
    discountType,
    discountValue,
    startDate: start,
    endDate: end,
    maxUses: maxUses || null,
    minPurchaseAmount: minPurchaseAmount || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  return successResponse({
    res,
    message: "Promo code created successfully",
    data: { promoCode },
  });
});

export const updatePromoCode = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const promoCode = await PromoCodeModel.findById(id);
  if (!promoCode) {
    return next(new Error("Promo code not found", { cause: 404 }));
  }

  // If code is being updated, check for duplicates
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
    const existingCode = await PromoCodeModel.findOne({
      code: updateData.code,
      _id: { $ne: id },
    });
    if (existingCode) {
      return next(new Error("Promo code already exists", { cause: 400 }));
    }
  }

  // Validate dates if being updated
  if (updateData.startDate || updateData.endDate) {
    const start = updateData.startDate
      ? new Date(updateData.startDate)
      : promoCode.startDate;
    const end = updateData.endDate
      ? new Date(updateData.endDate)
      : promoCode.endDate;

    if (end <= start) {
      return next(
        new Error("End date must be after start date", { cause: 400 })
      );
    }
  }

  // Validate discount value if being updated
  if (updateData.discountType || updateData.discountValue) {
    const discountType =
      updateData.discountType || promoCode.discountType;
    const discountValue =
      updateData.discountValue !== undefined
        ? updateData.discountValue
        : promoCode.discountValue;

    if (discountType === "percentage" && discountValue > 100) {
      return next(
        new Error("Percentage discount cannot exceed 100%", { cause: 400 })
      );
    }
  }

  const updatedPromoCode = await PromoCodeModel.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  return successResponse({
    res,
    message: "Promo code updated successfully",
    data: { promoCode: updatedPromoCode },
  });
});

export const removePromoCode = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const promoCode = await PromoCodeModel.findByIdAndDelete(id);
  if (!promoCode) {
    return next(new Error("Promo code not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Promo code deleted successfully",
    data: { promoCode },
  });
});

export const getPromoCodeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const promoCode = await PromoCodeModel.findById(id);
  if (!promoCode) {
    return next(new Error("Promo code not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Promo code fetched successfully",
    data: { promoCode },
  });
});



