# 📖 Get Blog by ID Documentation

## الميزة الجديدة: جلب مدونة واحدة بالـ ID

تم إضافة دالة `getBlogById` منفصلة لجلب مدونة واحدة باستخدام الـ ID.

---

## 🎯 كيفية الاستخدام

### جلب مدونة واحدة بالـ ID:
```javascript
GET /api/blog/:id
```

### مثال:
```javascript
GET /api/blog/507f1f77bcf86cd799439011
```

---

## 🔧 التغييرات المطبقة

### 1. إضافة دالة getBlogById في Blog Service
**الملف:** `src/modules/blog/blog.service.js`

```javascript
// ✅ دالة جلب مدونة واحدة بالـ ID
export const getBlogById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await BlogModel.findOne({
    _id: id,
    isDeleted: { $ne: true }
  });

  if (!blog) {
    return next(new Error("Blog not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Blog fetched successfully",
    data: { blog },
  });
});
```

### 2. إضافة Route في Blog Controller
**الملف:** `src/modules/blog/blog.controller.js`

```javascript
// Public routes (no authentication required)
router.get("/", validation(blogQueryValidation),  blogService.getAllBlogs);
router.get("/:id", validation(blogIdValidation), blogService.getBlogById);  // ← Route جديد
```

---

## 📝 أمثلة على الاستخدام

### مثال 1: جلب مدونة موجودة
```javascript
// Request
GET /api/blog/507f1f77bcf86cd799439011

// Response
{
  "success": true,
  "message": "Blog fetched successfully",
  "data": {
    "blog": {
      "_id": "507f1f77bcf86cd799439011",
      "description": "وصف المدونة",
      "image": "/uploads/blogs/image.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### مثال 2: جلب مدونة غير موجودة
```javascript
// Request
GET /api/blog/507f1f77bcf86cd799439999

// Response
{
  "success": false,
  "message": "Blog not found",
  "statusCode": 404
}
```

### مثال 3: ID غير صحيح
```javascript
// Request
GET /api/blog/invalid-id

// Response
{
  "message": "Validation Error",
  "errors": [
    {
      "key": "params",
      "details": [
        {
          "message": "Invalid blog ID format",
          "path": "id"
        }
      ]
    }
  ]
}
```

---

## 🔒 الأمان والتحقق

- ✅ **تحقق من صحة الـ ID**: يجب أن يكون الـ ID صحيح (24 حرف hex)
- ✅ **لا يتطلب تسجيل دخول**: Route عام متاح للجميع
- ✅ **آمن**: لا يسمح بالوصول للمدونات المحذوفة
- ✅ **رسائل خطأ واضحة**: رسائل خطأ مفصلة للحالات المختلفة

---

## 🎯 الفرق بين getBlogById و getAllBlogs

### getBlogById:
- **الغرض**: جلب مدونة واحدة محددة
- **الـ Route**: `GET /api/blog/:id`
- **الاستجابة**: مدونة واحدة أو خطأ 404
- **الأداء**: أسرع عند البحث عن مدونة واحدة

### getAllBlogs:
- **الغرض**: جلب جميع المدونات مع فلاتر
- **الـ Route**: `GET /api/blog/`
- **الاستجابة**: قائمة من المدونات مع pagination
- **الأداء**: مناسب لجلب عدة مدونات

---

## 🚀 سيناريوهات الاستخدام

### 1. عرض صفحة مدونة واحدة:
```javascript
GET /api/blog/507f1f77bcf86cd799439011
```

### 2. التحقق من وجود مدونة قبل التحديث:
```javascript
GET /api/blog/507f1f77bcf86cd799439011
// إذا كانت موجودة: يمكن المتابعة للتحديث
// إذا لم تكن موجودة: عرض رسالة خطأ
```

### 3. مشاركة رابط مدونة محددة:
```javascript
GET /api/blog/507f1f77bcf86cd799439011
// للحصول على تفاصيل المدونة للمشاركة
```

---

## 📊 الفوائد

1. **أداء أفضل**: جلب مدونة واحدة بدلاً من البحث في جميع المدونات
2. **وضوح في الكود**: دالة مخصصة لجلب مدونة واحدة
3. **سهولة الاستخدام**: route بسيط ومباشر
4. **رسائل خطأ واضحة**: رسائل خطأ محددة لكل حالة

---

## 🔄 مقارنة مع الفلتر

### باستخدام getBlogById:
```javascript
GET /api/blog/507f1f77bcf86cd799439011
// أسرع وأوضح
```

### باستخدام الفلتر في getAllBlogs:
```javascript
GET /api/blog/?id=507f1f77bcf86cd799439011
// يعمل لكن أقل وضوحاً
```

الآن يمكنك جلب مدونة واحدة بالـ ID بسهولة! 🎉
