import { CartModel } from "../../config/models/cart.model.js";
import { ProductModel } from "../../config/models/product.model.js";
import { UserModel } from "../../config/models/user.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

// ✅ دالة مساعدة للحصول على Session ID بأمان
const getSessionId = (req) => {
  try {
    return (req.cookies && req.cookies.sessionId) || req.headers["x-session-id"];
  } catch (error) {
    console.warn("Error accessing cookies:", error.message);
    return req.headers["x-session-id"];
  }
};
export const getCart = asyncHandler(async (req, res, next) => {
  if (req.user) {
    const userId = req.user._id;
    const cart = await CartModel.findOne({ user: userId, status: "active" })
      .populate("items.product");
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
      data: { cart: cart.items, totalPrice: cart.totalPrice },
    });
  } else {
    // Guest cart support
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return successResponse({
        res,
        message: "Guest cart fetched successfully",
        data: { cart: [], totalPrice: 0, message: "No items in cart" },
      });
    }

    const cart = await CartModel.findOne({ sessionId, status: "active" })
      .populate("items.product");
    
    if (!cart) {
      return successResponse({
        res,
        message: "Guest cart fetched successfully",
        data: { cart: [], totalPrice: 0, message: "No items in cart" },
      });
    }

    return successResponse({
      res,
      message: "Guest cart fetched successfully",
      data: { cart: cart.items, totalPrice: cart.totalPrice, sessionId },
    });
  }
});
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity);

  if (isNaN(qty)) return next(new Error("Quantity must be a number", { cause: 400 }));
  if (qty === 0) return next(new Error("Quantity cannot be 0", { cause: 400 }));

  const product = await ProductModel.findById(productId);
  if (!product) return next(new Error("Product not found", { cause: 404 }));

  // ✅ الحالة 1: مستخدم مسجل دخول
  if (req.user) {
    const userId = req.user._id;
    let cart = await CartModel.findOne({ user: userId, status: "active" });
    if (!cart) cart = await CartModel.create({ user: userId, items: [] });

    await cart.addItem(productId, product.price, qty);

    return successResponse({
      res,
      message: "Cart updated successfully",
      data: { cart },
    });
  }

  // ✅ الحالة 2: Guest user
  let sessionId = getSessionId(req);
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    res.cookie("sessionId", sessionId, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  let guestCart = await CartModel.findOne({ sessionId, status: "active" });

  if (!guestCart) {
    guestCart = await CartModel.create({ sessionId, items: [] });
  }

  await guestCart.addItem(productId, product.price, qty);

  return successResponse({
    res,
    message: "Guest cart updated successfully",
    data: { cart: guestCart, sessionId },
  });
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  
  if (req.user) {
    const userId = req.user._id;
    const cart = await CartModel.findOne({ user: userId, status: "active" });
    if (!cart) return next(new Error("Cart not found", { cause: 404 }));
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    await cart.save();
    return successResponse({
      res,
      message: "Product removed from cart successfully",
      data: { cart },
    });
  } else {
    // Guest cart support
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return next(new Error("No session found", { cause: 404 }));
    }

    const cart = await CartModel.findOne({ sessionId, status: "active" });
    if (!cart) return next(new Error("Cart not found", { cause: 404 }));
    
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    await cart.save();
    
    return successResponse({
      res,
      message: "Product removed from guest cart successfully",
      data: { cart },
    });
  }
});
export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = Number(quantity);
  
  if (isNaN(qty)) {
    return next(new Error("Quantity must be a number", { cause: 400 }));
  }
  if (qty === 0) {
    return next(new Error("Quantity cannot be 0", { cause: 400 }));
  }
  
  if (req.user) {
    const cart = await CartModel.findOne({ user: req.user._id, status: "active" });
    if (!cart) return next(new Error("Cart not found", { cause: 404 }));
    
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) return next(new Error("Product not in cart", { cause: 404 }));
    
    item.quantity = qty;
    
    if (item.quantity < 1) {
      item.quantity = 1;
    }
    
    cart.totalPrice = cart.items.reduce(  
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    
    await cart.save();
    
    return successResponse({
      res,
      message: `Cart item quantity updated successfully. Set to ${qty}.`,
      data: { 
        cart,
        updatedItem: {
          productId: item.product,
          newQuantity: item.quantity
        }
      },
    });
  } else {
    // Guest cart support
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return next(new Error("No session found", { cause: 404 }));
    }

    const cart = await CartModel.findOne({ sessionId, status: "active" });
    if (!cart) return next(new Error("Cart not found", { cause: 404 }));
    
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) return next(new Error("Product not in cart", { cause: 404 }));
    
    item.quantity = qty;
    
    if (item.quantity < 1) {
      item.quantity = 1;
    }
    
    cart.totalPrice = cart.items.reduce(  
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    
    await cart.save();
    
    return successResponse({
      res,
      message: `Guest cart item quantity updated successfully. Set to ${qty}.`,
      data: { 
        cart,
        updatedItem: {
          productId: item.product,
          newQuantity: item.quantity
        }
      },
    });
  }
});

// ✅ ميزة نقل جميع منتجات الـ wishlist إلى العربة
export const addWishlistToCart = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new Error("Authentication required to access wishlist", { cause: 401 }));
  }

  const userId = req.user._id;
  
  // جلب المستخدم مع الـ wishlist
  const user = await UserModel.findById(userId).populate("wishlist");
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  if (!user.wishlist || user.wishlist.length === 0) {
    return successResponse({
      res,
      message: "Wishlist is empty",
      data: { message: "No items in wishlist to add to cart" },
    });
  }

  // جلب أو إنشاء العربة
  let cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) {
    cart = await CartModel.create({ user: userId, items: [] });
  }

  // إضافة جميع منتجات الـ wishlist إلى العربة
  const addedItems = [];
  const failedItems = [];

  for (const product of user.wishlist) {
    try {
      // التحقق من وجود المنتج في العربة مسبقاً
      const existingItem = cart.items.find(
        (item) => item.product.toString() === product._id.toString()
      );

      if (existingItem) {
        // إذا كان المنتج موجود، زيادة الكمية
        existingItem.quantity += 1;
        addedItems.push({
          productId: product._id,
          productName: product.name,
          action: "quantity_increased",
          newQuantity: existingItem.quantity
        });
      } else {
        // إضافة منتج جديد
        cart.items.push({
          product: product._id,
          price: product.price,
          quantity: 1
        });
        addedItems.push({
          productId: product._id,
          productName: product.name,
          action: "added_new"
        });
      }
    } catch (error) {
      failedItems.push({
        productId: product._id,
        productName: product.name,
        error: error.message
      });
    }
  }

  // حساب السعر الإجمالي
  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  await cart.save();

  // مسح الـ wishlist بعد النقل
  user.wishlist = [];
  await user.save();

  return successResponse({
    res,
    message: "Wishlist items added to cart successfully",
    data: {
      cart,
      summary: {
        totalItems: user.wishlist.length,
        addedItems: addedItems.length,
        failedItems: failedItems.length,
        addedItems,
        failedItems
      }
    },
  });
});

// ✅ ميزة دمج Guest Cart مع User Cart عند تسجيل الدخول
export const mergeGuestCart = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new Error("Authentication required", { cause: 401 }));
  }

  const sessionId = getSessionId(req);
  if (!sessionId) {
    return successResponse({
      res,
      message: "No guest cart to merge",
      data: { message: "No guest cart found" },
    });
  }

  const userId = req.user._id;
  
  // جلب Guest Cart
  const guestCart = await CartModel.findOne({ sessionId, status: "active" });
  if (!guestCart || guestCart.items.length === 0) {
    return successResponse({
      res,
      message: "No guest cart items to merge",
      data: { message: "Guest cart is empty" },
    });
  }

  // جلب أو إنشاء User Cart
  let userCart = await CartModel.findOne({ user: userId, status: "active" });
  if (!userCart) {
    userCart = await CartModel.create({ user: userId, items: [] });
  }

  // دمج العناصر
  const mergedItems = [];
  const skippedItems = [];

  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(
      (item) => item.product.toString() === guestItem.product.toString()
    );

    if (existingItem) {
      // إذا كان المنتج موجود، دمج الكميات
      existingItem.quantity += guestItem.quantity;
      mergedItems.push({
        productId: guestItem.product,
        action: "quantity_merged",
        newQuantity: existingItem.quantity
      });
    } else {
      // إضافة منتج جديد
      userCart.items.push({
        product: guestItem.product,
        price: guestItem.price,
        quantity: guestItem.quantity
      });
      mergedItems.push({
        productId: guestItem.product,
        action: "added_new"
      });
    }
  }

  // حساب السعر الإجمالي
  userCart.totalPrice = userCart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  await userCart.save();

  // حذف Guest Cart
  await CartModel.findByIdAndDelete(guestCart._id);

  // مسح الـ session cookie
  res.clearCookie("sessionId");

  return successResponse({
    res,
    message: "Guest cart merged successfully",
    data: {
      cart: userCart,
      summary: {
        mergedItems: mergedItems.length,
        skippedItems: skippedItems.length,
        mergedItems,
        skippedItems
      }
    },
  });
});

// ✅ ميزة إضافة منتج واحد من الـ wishlist إلى العربة
export const addSingleWishlistItemToCart = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new Error("Authentication required to access wishlist", { cause: 401 }));
  }

  const { productId } = req.params;
  const userId = req.user._id;
  
  // التحقق من وجود المنتج في الـ wishlist
  const user = await UserModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const isInWishlist = user.wishlist.includes(productId);
  if (!isInWishlist) {
    return next(new Error("Product not found in wishlist", { cause: 404 }));
  }

  // جلب تفاصيل المنتج
  const product = await ProductModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  // جلب أو إنشاء العربة
  let cart = await CartModel.findOne({ user: userId, status: "active" });
  if (!cart) {
    cart = await CartModel.create({ user: userId, items: [] });
  }

  // التحقق من وجود المنتج في العربة مسبقاً
  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  let action = "";
  if (existingItem) {
    // إذا كان المنتج موجود، زيادة الكمية
    existingItem.quantity += 1;
    action = "quantity_increased";
  } else {
    // إضافة منتج جديد
    cart.items.push({
      product: productId,
      price: product.price,
      quantity: 1
    });
    action = "added_new";
  }

  // حساب السعر الإجمالي
  cart.totalPrice = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  await cart.save();

  // إزالة المنتج من الـ wishlist
  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  return successResponse({
    res,
    message: "Product moved from wishlist to cart successfully",
    data: {
      cart,
      product: {
        productId: product._id,
        productName: product.name,
        action
      }
    },
  });
});