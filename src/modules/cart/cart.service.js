import { CartModel } from "../../config/models/cart.model.js";
import { ProductModel } from "../../config/models/product.model.js";
import { WishlistModel } from "../../config/models/wishlist.model.js";
import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

const getSessionId = (req) => {
  try {
    return (req.cookies && req.cookies.sessionId) || req.headers["x-session-id"];
  } catch (error) {
    console.warn("Error accessing cookies:", error.message);
    return req.headers["x-session-id"];
  }
};


export const getCart = asyncHandler(async (req, res, next) => {
  let cart;

  if (req.user) {
    cart = await CartModel.findOne({ user: req.user._id, status: "active" })
      .populate("items.product");
  } else {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return successResponse({
        res,
        message: "Guest cart fetched successfully",
        data: { cart: [], totalPrice: 0, message: "No session found" },
      });
    }
    cart = await CartModel.findOne({ sessionId, status: "active" })
      .populate("items.product");
  }

  if (!cart) {
    return successResponse({
      res,
      message: "Cart fetched successfully",
      data: { cart: [], totalPrice: 0 },
    });
  }

  return successResponse({
    res,
    message: "Cart fetched successfully",
    data: { cart },
  });
});


export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity, color, size } = req.body;
  const qty = Number(quantity);

  if (isNaN(qty) || qty <= 0) {
    return next(new Error("Quantity must be greater than 0", { cause: 400 }));
  }
  if (!color || !size) {
    throw new Error("Color and size are required for this product");
  }
  const product = await ProductModel.findById(productId);
  if (!product) return next(new Error("Product not found", { cause: 404 }));

  if (product.hasVariants && (!color || !size)) {
    return next(new Error("Color and size are required for this product", { cause: 400 }));
  }

  let cart;
  if (req.user) {
    cart = await CartModel.findOne({ user: req.user._id, status: "active" });
    if (!cart) cart = await CartModel.create({ user: req.user._id, items: [] });
  } else {
    let sessionId = getSessionId(req);
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }
    cart = await CartModel.findOne({ sessionId, status: "active" });
    if (!cart) cart = await CartModel.create({ sessionId, items: [] });
  }

  await cart.addItem(productId, product.price, qty, color || "default", size || "default");

  return successResponse({
    res,
    message: "Cart updated successfully",
    data: { cart },
  });
});


export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { color, size } = req.body;

  const filterItems = async (cart) => {
    cart.items = cart.items.filter((item) => {
      return !(
        item.product.toString() === productId &&
        JSON.stringify(item.color) === JSON.stringify(color) &&
        JSON.stringify(item.size) === JSON.stringify(size)
      );
    });

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );

    await cart.save();
  };

  // ✅ حالة المستخدم المسجل
  if (req.user) {
    const cart = await CartModel.findOne({ user: req.user._id, status: "active" });
    if (!cart) return next(new Error("Cart not found", { cause: 404 }));

    await filterItems(cart);

    return successResponse({
      res,
      message: "Item removed from cart",
      data: { cart },
    });
  }

  // ✅ حالة الضيف (guest)
  const sessionId = getSessionId(req);
  const cart = await CartModel.findOne({ sessionId, status: "active" });
  if (!cart) return next(new Error("Guest cart not found", { cause: 404 }));

  await filterItems(cart);

  return successResponse({
    res,
    message: "Item removed from guest cart",
    data: { cart },
  });
});


export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity, color, size } = req.body; // ✅ لازم نستقبل color و size
  const qty = Number(quantity);

  if (isNaN(qty)) {
    return next(new Error("Quantity must be a number", { cause: 400 }));
  }

  if (qty < 1) {
    return next(new Error("Quantity must be at least 1", { cause: 400 }));
  }

  // ✅ نجيب العربة حسب إذا المستخدم مسجل أو ضيف
  const cart = req.user
    ? await CartModel.findOne({ user: req.user._id, status: "active" })
    : await CartModel.findOne({ sessionId: getSessionId(req), status: "active" });

  if (!cart) {
    return next(new Error("Cart not found", { cause: 404 }));
  }

  // ✅ نبحث عن العنصر المطابق (بنفس المنتج واللون والمقاس)
  const item = cart.items.find(
    (i) =>
      i.product.toString() === productId &&
      JSON.stringify(i.color) === JSON.stringify(color) &&
      JSON.stringify(i.size) === JSON.stringify(size)
  );

  if (!item) {
    return next(new Error("Product not found in cart with specified color and size", { cause: 404 }));
  }

  // ✅ نحدث الكمية فقط
  item.quantity = qty;

  // ✅ نحدث السعر الإجمالي
  cart.totalPrice = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);

  await cart.save();

  return successResponse({
    res,
    message: "Cart item quantity updated successfully",
    data: { cart },
  });
});


export const addWishlistToCart = asyncHandler(async (req, res, next) => {
  if (!req.user)
    return next(new Error("Authentication required", { cause: 401 }));

  const userId = req.user._id;

  // ✅ هات كل عناصر الـ wishlist الخاصة بالمستخدم
  const wishlistItems = await WishlistModel.find({ user: userId }).populate("product");

  if (!wishlistItems.length) {
    return successResponse({
      res,
      message: "Wishlist is empty",
      data: [],
    });
  }

  // ✅ هات الكارت أو أنشئ واحد جديد
  let cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) cart = await CartModel.create({ user: userId, items: [] });

  // ✅ أضف كل منتج من الـ wishlist إلى الكارت
  for (const item of wishlistItems) {
    const { product, color, size } = item;

    const existing = cart.items.find(
      (i) =>
        i.product.toString() === product._id.toString() &&
        i.color === color &&
        i.size === size
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({
        product: product._id,
        price: product.price,
        quantity: 1,
        color,
        size,
      });
    }
  }

  // ✅ تحديث السعر الإجمالي
  cart.totalPrice = cart.items.reduce(
    (acc, i) => acc + i.quantity * i.price,
    0
  );

  await cart.save();

  // ✅ احذف كل المنتجات من الـ wishlist بعد النقل
  await WishlistModel.deleteMany({ user: userId });

  return successResponse({
    res,
    message: "All wishlist items moved to cart successfully",
    data: { cart },
  });
});


export const mergeGuestCart = asyncHandler(async (req, res, next) => {
  if (!req.user) return next(new Error("Authentication required", { cause: 401 }));

  const sessionId = getSessionId(req);
  const guestCart = await CartModel.findOne({ sessionId, status: "active" });
  if (!guestCart || !guestCart.items.length) {
    return successResponse({ res, message: "No guest cart found", data: [] });
  }

  let userCart = await CartModel.findOne({ user: req.user._id, status: "active" });
  if (!userCart) userCart = await CartModel.create({ user: req.user._id, items: [] });

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (i) =>
        i.product.toString() === guestItem.product.toString() &&
        i.color === guestItem.color &&
        i.size === guestItem.size
    );
    if (existing) existing.quantity += guestItem.quantity;
    else userCart.items.push(guestItem);
  }

  userCart.totalPrice = userCart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
  await userCart.save();

  await CartModel.findByIdAndDelete(guestCart._id);
  res.clearCookie("sessionId");

  return successResponse({
    res,
    message: "Guest cart merged successfully",
    data: { cart: userCart },
  });
});

export const addSingleWishlistItemToCart = asyncHandler(async (req, res, next) => {
  if (!req.user)
    return next(new Error("Authentication required", { cause: 401 }));

  const userId = req.user._id;
  const { productId } = req.params; // ده هو الـ ID بتاع عنصر الـ wishlist نفسه مش المنتج

  // ✅ جلب عنصر الـ wishlist بناءً على المستخدم والـ _id بتاع العنصر نفسه
  const wishlistItem = await WishlistModel.findOne({
    user: userId,
    _id: productId,
  }).populate("product");

  if (!wishlistItem)
    return next(new Error("Product not found in wishlist", { cause: 404 }));

  const color = wishlistItem.color[0];
  const size = wishlistItem.size[0];
  const product = wishlistItem.product;

  // ✅ جلب الكارت أو إنشاء واحد جديد
  let cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) cart = await CartModel.create({ user: userId, items: [] });

  // ✅ تحقق إذا كان العنصر موجود بالفعل بنفس اللون والمقاس
  const existing = cart.items.find(
    (i) =>
      i.product.toString() === product._id.toString() &&
      i.color === color &&
      i.size === size
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({
      product: product._id,
      price: product.price,
      quantity: 1,
      color,
      size,
    });
  }

  // ✅ تحديث السعر الإجمالي
  cart.totalPrice = cart.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
  await cart.save();

  // ✅ حذف العنصر من الـ wishlist بعد الإضافة
  await WishlistModel.findByIdAndDelete(productId);

  return successResponse({
    res,
    message: "Product moved from wishlist to cart successfully and removed from wishlist",
    data: { cart },
  });
});
