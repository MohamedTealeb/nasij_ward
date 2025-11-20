# 🛒 Cart Features Documentation

## الميزات الجديدة المضافة

### 1. 🎭 Guest Cart (عربة الزوار)
السماح للزوار (بدون تسجيل دخول) بإضافة منتجات للعربة وحفظها لمدة 7 أيام.

#### الميزات:
- ✅ إضافة منتجات للعربة بدون تسجيل دخول
- ✅ حفظ العربة لمدة 7 أيام باستخدام Session ID
- ✅ تحديث كميات المنتجات
- ✅ حذف منتجات من العربة
- ✅ عرض محتويات العربة

#### API Endpoints:
```javascript
// جلب العربة (يعمل مع المستخدمين المسجلين والزوار)
GET /api/cart/
Headers: x-session-id: [sessionId] (اختياري للزوار)

// إضافة منتج للعربة
POST /api/cart/add
Body: { productId: "product_id", quantity: 1 }
Headers: x-session-id: [sessionId] (اختياري للزوار)

// تحديث كمية منتج
PUT /api/cart/:productId
Body: { quantity: 2 }
Headers: x-session-id: [sessionId] (اختياري للزوار)

// حذف منتج من العربة
DELETE /api/cart/:productId
Headers: x-session-id: [sessionId] (اختياري للزوار)
```

---

### 2. 💝 Wishlist to Cart (نقل من قائمة الأمنيات للعربة)

#### أ) نقل جميع منتجات الـ Wishlist للعربة:
```javascript
POST /api/cart/add-wishlist
Headers: Authorization: Bearer [token]
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "Wishlist items added to cart successfully",
  "data": {
    "cart": { /* cart object */ },
    "summary": {
      "totalItems": 5,
      "addedItems": 5,
      "failedItems": 0,
      "addedItems": [
        {
          "productId": "product_id",
          "productName": "Product Name",
          "action": "added_new"
        }
      ],
      "failedItems": []
    }
  }
}
```

#### ب) نقل منتج واحد من الـ Wishlist للعربة:
```javascript
POST /api/cart/add-wishlist-item/:productId
Headers: Authorization: Bearer [token]
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "Product moved from wishlist to cart successfully",
  "data": {
    "cart": { /* cart object */ },
    "product": {
      "productId": "product_id",
      "productName": "Product Name",
      "action": "added_new"
    }
  }
}
```

---

### 3. 🔄 Guest Cart Merge (دمج عربة الزوار مع عربة المستخدم)

عند تسجيل دخول المستخدم، يمكن دمج عربة الزوار مع عربة المستخدم المسجل.

```javascript
POST /api/cart/merge-guest
Headers: Authorization: Bearer [token]
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "Guest cart merged successfully",
  "data": {
    "cart": { /* merged cart object */ },
    "summary": {
      "mergedItems": 3,
      "skippedItems": 0,
      "mergedItems": [
        {
          "productId": "product_id",
          "action": "quantity_merged",
          "newQuantity": 3
        }
      ],
      "skippedItems": []
    }
  }
}
```

---

## 🔧 كيفية الاستخدام في Frontend

### 1. للزوار (Guest Users):
```javascript
// إنشاء session ID جديد
const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// إضافة منتج للعربة
const addToCart = async (productId, quantity = 1) => {
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({ productId, quantity })
  });
  return response.json();
};

// جلب العربة
const getCart = async () => {
  const response = await fetch('/api/cart/', {
    headers: {
      'x-session-id': sessionId
    }
  });
  return response.json();
};
```

### 2. للمستخدمين المسجلين:
```javascript
// إضافة جميع منتجات الـ wishlist للعربة
const addAllWishlistToCart = async () => {
  const response = await fetch('/api/cart/add-wishlist', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// دمج عربة الزوار مع عربة المستخدم
const mergeGuestCart = async () => {
  const response = await fetch('/api/cart/merge-guest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

---

## 🎯 سيناريوهات الاستخدام

### السيناريو 1: زائر يضيف منتجات ثم يسجل دخول
1. الزائر يضيف منتجات للعربة (Guest Cart)
2. الزائر يسجل دخول
3. استدعاء `/api/cart/merge-guest` لدمج العربات
4. المنتجات تظهر في عربة المستخدم المسجل

### السيناريو 2: مستخدم يريد نقل جميع منتجات الـ wishlist للعربة
1. المستخدم يضغط على "Add All to Cart" في صفحة الـ wishlist
2. استدعاء `/api/cart/add-wishlist`
3. جميع المنتجات تنتقل من الـ wishlist للعربة
4. الـ wishlist تصبح فارغة

### السيناريو 3: مستخدم يريد نقل منتج واحد من الـ wishlist للعربة
1. المستخدم يضغط على "Add to Cart" بجانب منتج في الـ wishlist
2. استدعاء `/api/cart/add-wishlist-item/:productId`
3. المنتج ينتقل من الـ wishlist للعربة
4. إذا كان المنتج موجود في العربة، تزيد الكمية

---

## 🔒 الأمان والتحقق

- ✅ Guest Cart يستخدم Session ID آمن
- ✅ التحقق من صحة المنتجات قبل الإضافة
- ✅ التحقق من وجود المستخدم قبل الوصول للـ wishlist
- ✅ منع الوصول للـ wishlist بدون تسجيل دخول
- ✅ تنظيف Guest Cart بعد الدمج

---

## 📝 ملاحظات مهمة

1. **Session ID**: يتم إنشاؤه تلقائياً عند أول إضافة للعربة
2. **انتهاء الصلاحية**: Guest Cart تنتهي بعد 7 أيام
3. **الدمج**: عند دمج العربات، يتم حذف Guest Cart نهائياً
4. **الكميات**: إذا كان المنتج موجود في العربة، تزيد الكمية بدلاً من إضافة نسخة جديدة
5. **الـ Wishlist**: يتم مسحها بعد نقل جميع المنتجات للعربة
