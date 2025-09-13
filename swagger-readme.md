# Swagger YAML Documentation

## 📋 Overview

ملف `swagger.yaml` يحتوي على توثيق شامل لـ API الخاص بـ Nasij Ward بتنسيق YAML بسيط ومفهوم.

## 🚀 الوصول للتوثيق

```
http://localhost:3000/api-docs
```

## 📁 الملفات

- **`swagger.yaml`** - ملف التوثيق الرئيسي
- **`src/app.controller.js`** - يحتوي على إعداد Swagger UI

## ✨ المزايا

### ✅ **بساطة**
- ملف واحد فقط يحتوي على كل التوثيق
- تنسيق YAML سهل القراءة والتحرير
- لا حاجة لملفات JavaScript معقدة

### ✅ **سهولة التحرير**
- تحرير مباشر في ملف YAML
- لا حاجة لإعادة تشغيل السيرفر عند التحرير (في بعض الحالات)
- تنسيق واضح ومنظم

### ✅ **شامل**
- جميع endpoints موثقة
- جميع schemas معرفة
- أمثلة واضحة للـ requests والـ responses
- دعم JWT authentication

## 📝 كيفية التحرير

### إضافة endpoint جديد

```yaml
paths:
  /new-endpoint:
    post:
      summary: وصف الـ endpoint
      tags: [TagName]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/YourSchema'
      responses:
        '200':
          description: نجح العمل
```

### إضافة schema جديد

```yaml
components:
  schemas:
    NewSchema:
      type: object
      required:
        - field1
      properties:
        field1:
          type: string
          example: "قيمة مثال"
```

## 🔧 Dependencies

```json
{
  "js-yaml": "^4.1.0",
  "swagger-ui-express": "^5.0.0"
}
```

## 🎯 الاستخدام في الكود

```javascript
import yaml from 'js-yaml'
import fs from 'fs'

const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
```

---

**الآن التوثيق أصبح بسيط ومنظم في ملف واحد! 🎉**
