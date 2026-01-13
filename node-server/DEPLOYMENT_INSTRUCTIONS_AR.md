# تعليمات نشر سيرفر iCore Telegram Bot

## الخطوة 1: رفع الملفات إلى السيرفر

قم برفع الملفات التالية إلى مجلد `/home/container/` في سيرفر Katabump:

```
/home/container/
├── index.js
├── package.json
├── .env
```

## الخطوة 2: تثبيت المكتبات

بعد رفع الملفات، سيقوم السيرفر تلقائياً بتثبيت المكتبات من `package.json`.

إذا لم يعمل تلقائياً، يمكنك تشغيل:
```bash
npm install
```

## الخطوة 3: التحقق من ملف .env

تأكد أن ملف `.env` يحتوي على:

```env
SUPABASE_URL=https://tozvejugoydqcjaekerk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvenZlanVnb3lkcWNqYWVrZXJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA1NzMzOCwiZXhwIjoyMDgzNjMzMzM4fQ.B0hA7UClJ5qkV0eNfL5yuuTuR-x7Vk3B6G4190JGabc
TELEGRAM_BOT_TOKEN=8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os
PORT=3001
```

## الخطوة 4: تشغيل السيرفر

السيرفر سيبدأ تلقائياً بتشغيل:
```bash
node index.js
```

## الخطوة 5: إعداد Webhook

بعد تشغيل السيرفر، ستحتاج لإعداد webhook لـ Telegram. استخدم عنوان IP الخاص بالسيرفر:

```
http://51.75.118.170:20166/webhook/telegram
```

### طريقة 1: استخدام curl

```bash
curl -X POST "https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://51.75.118.170:20166/webhook/telegram"}'
```

### طريقة 2: استخدام المتصفح

افتح هذا الرابط في المتصفح:
```
https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/setWebhook?url=http://51.75.118.170:20166/webhook/telegram
```

### طريقة 3: من خلال API السيرفر

```bash
curl -X POST http://51.75.118.170:20166/setup-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"http://51.75.118.170:20166/webhook/telegram"}'
```

## الخطوة 6: التحقق من Webhook

للتحقق من أن webhook يعمل:

```bash
curl "https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/getWebhookInfo"
```

يجب أن تحصل على رد مثل:
```json
{
  "ok": true,
  "result": {
    "url": "http://51.75.118.170:20166/webhook/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## الخطوة 7: اختبار البوت

1. افتح Telegram وابحث عن البوت: `@icore2_bot`
2. أرسل رسالة "/start" أو أي رسالة
3. يجب أن يرد البوت تلقائياً

## التحقق من صحة التشغيل

افتح في المتصفح:
```
http://51.75.118.170:20166/health
```

يجب أن ترى:
```json
{
  "status": "ok",
  "timestamp": "2025-01-12T...",
  "supabase": "https://tozvejugoydqcjaekerk.supabase.co",
  "telegram": "configured"
}
```

## استكشاف الأخطاء

### خطأ: supabaseUrl is required

تأكد من أن ملف `.env` موجود في نفس مجلد `index.js` ويحتوي على جميع المتغيرات.

### خطأ: Connection refused

تأكد أن:
1. السيرفر يعمل على المنفذ الصحيح (3001)
2. المنفذ 20166 في Katabump يشير إلى المنفذ 3001 داخل الحاوية

### الرسائل لا تصل

1. تحقق من webhook: `getWebhookInfo`
2. تحقق من أن URL صحيح ويمكن الوصول إليه من الإنترنت
3. تأكد أن السيرفر يعمل ويظهر "Server running on port 3001"

## ملاحظات مهمة

- السيرفر يستخدم AI محلي مدمج (بدون OpenAI)
- جميع الرسائل تُحفظ في Supabase تلقائياً
- البوت يرد تلقائياً بردود ذكية بالعربية والإنجليزية
- يمكن للمشرف الرد من لوحة التحكم في الموقع
