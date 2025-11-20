# 🔍 Blog Filter by ID Documentation

## الميزة الجديدة: فلتر المدونات بالـ ID

تم إضافة إمكانية فلتر المدونات باستخدام الـ ID في دالة `getAllBlogs`.

---

## 🎯 كيفية الاستخدام

### 1. جلب جميع المدونات (كما هو معتاد):
```javascript
GET /api/blog/
```

### 2. جلب مدونة محددة بالـ ID:
```javascript
GET /api/blog/?id=507f1f77bcf86cd799439011
```

### 3. دمج الفلتر مع معاملات أخرى:
```javascript
// جلب مدونة محددة مع ترتيب
GET /api/blog/?id=507f1f77bcf86cd799439011&sortBy=createdAt&sortOrder=desc

// جلب مدونة محددة مع pagination
GET /api/blog/?id=507f1f77bcf86cd799439011&page=1&limit=5
```

---

## 🔧 التغييرات المطبقة

### 1. تحديث Blog Validation
**الملف:** `src/modules/blog/blog.validation.js`

```javascript
// ✅ إضافة معامل id في validation
export const blogQueryValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    author: Joi.string().trim().optional(),
    search: Joi.string().trim().optional(),
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
      "string.pattern.base": "Invalid blog ID format"
    }),
    sortBy: Joi.string().valid("createdAt", "updatedAt").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc")
  })
};
```

### 2. تحديث Blog Service
**الملف:** `src/modules/blog/blog.service.js`

```javascript
export const getAllBlogs = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    image,
    search,
    id,  // ← إضافة معامل id
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;

  let filter = { isDeleted: { $ne: true } };

  // ✅ فلتر بالـ ID
  if (id) {
    filter._id = id;
  }

  // Add search filter
  if (search) {
    filter.description = { $regex: search, $options: "i" };
  }
  
  // باقي الكود...
});
```

---

## 📝 أمثلة على الاستخدام

### مثال 1: جلب مدونة محددة
```javascript
// Request
GET /api/blog/?id=507f1f77bcf86cd799439011

// Response
{
  "success": true,
  "message": "Blogs fetched successfully",
  "data": {
    "blogs": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "description": "وصف المدونة",
        "image": "/uploads/blogs/image.jpg",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pages": 1,
      "limit": 10
    }
  }
}
```

### مثال 2: جلب مدونة غير موجودة
```javascript
// Request
GET /api/blog/?id=507f1f77bcf86cd799439999

// Response
{
  "success": true,
  "message": "Blogs fetched successfully",
  "data": {
    "blogs": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "pages": 0,
      "limit": 10
    }
  }
}
```

### مثال 3: ID غير صحيح
```javascript
// Request
GET /api/blog/?id=invalid-id

// Response
{
  "message": "Validation Error",
  "errors": [
    {
      "key": "query",
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
- ✅ **اختياري**: يمكن استخدام الفلتر أو عدم استخدامه
- ✅ **متوافق مع الفلاتر الأخرى**: يعمل مع search, pagination, sorting
- ✅ **آمن**: لا يسمح بالوصول للمدونات المحذوفة

---

## 🎯 سيناريوهات الاستخدام

### 1. جلب مدونة محددة للعرض:
```javascript
GET /api/blog/?id=507f1f77bcf86cd799439011
```

### 2. التحقق من وجود مدونة:
```javascript
GET /api/blog/?id=507f1f77bcf86cd799439011
// إذا كانت موجودة: ترجع المدونة
// إذا لم تكن موجودة: ترجع array فارغ
```

### 3. دمج مع فلاتر أخرى:
```javascript
// جلب مدونة محددة مع ترتيب حسب التاريخ
GET /api/blog/?id=507f1f77bcf86cd799439011&sortBy=createdAt&sortOrder=desc
```

---

## 📊 الفوائد

1. **مرونة أكبر**: يمكن جلب مدونة محددة أو جميع المدونات
2. **أداء أفضل**: عند البحث عن مدونة واحدة، لا يتم جلب جميع المدونات
3. **سهولة الاستخدام**: نفس الـ endpoint مع معامل إضافي
4. **متوافق**: يعمل مع جميع الميزات الموجودة

الآن يمكنك فلتر المدونات بالـ ID بسهولة! 🎉
