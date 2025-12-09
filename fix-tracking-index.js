
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const fixTrackingIndex = async () => {
  try {
    console.log('جار الاتصال بقاعدة البيانات...');
    
    if (!process.env.CONNECTION_URL) {
      throw new Error('CONNECTION_URL غير موجود في ملف .env');
    }
    
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✓ تم الاتصال بنجاح');

    const db = mongoose.connection.db;
    const collection = db.collection('orders');

    try {
      await collection.dropIndex('trackingNumber_1');
      console.log('✓ تم حذف الفهرس القديم بنجاح');
    } catch (error) {
      if (error.codeName === 'IndexNotFound' || error.message?.includes('index not found')) {
        console.log('✓ الفهرس القديم غير موجود (لا بأس)');
      } else {
        console.log('⚠ تحذير عند حذف الفهرس:', error.message);
      }
    }

    await collection.createIndex(
      { trackingNumber: 1 },
      { unique: true, sparse: true, name: 'trackingNumber_1' }
    );
    console.log('✓ تم إنشاء الفهرس الجديد (sparse unique) بنجاح');

    await mongoose.connection.close();
    console.log('\n✅ تم إصلاح الفهرس بنجاح! يمكنك الآن إعادة تشغيل التطبيق.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ حدث خطأ:', error.message);
    if (error.stack) {
      console.error('تفاصيل الخطأ:', error.stack);
    }
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

// تشغيل السكريبت
fixTrackingIndex();
