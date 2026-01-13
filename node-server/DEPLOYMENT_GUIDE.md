# 🚀 دليل نشر سيرفر iCore على Katabump
# iCore Server Deployment Guide for Katabump

## 📋 المتطلبات | Requirements

- Node.js 18 أو أحدث | Node.js 18 or newer
- npm أو yarn
- حساب Supabase مع المشروع المُعد
- Telegram Bot Token
- (اختياري) OpenAI API Key للذكاء الاصطناعي

## 🔧 خطوات التثبيت | Installation Steps

### 1. رفع الملفات إلى السيرفر | Upload Files to Server

استخدم SFTP للاتصال بالسيرفر:
```
Host: sftp.fr-node-49.katabump.com
Port: 2022
Username: ff86f692197f317.e7d14421
```

ارفع مجلد `node-server` بالكامل إلى السيرفر.

### 2. الاتصال بالسيرفر عبر SSH | Connect via SSH

```bash
ssh ff86f692197f317.e7d14421@sftp.fr-node-49.katabump.com -p 2022
```

### 3. الانتقال إلى مجلد المشروع | Navigate to Project

```bash
cd node-server
```

### 4. تثبيت الحزم | Install Dependencies

```bash
npm install
```

### 5. إعداد ملف البيئة | Configure Environment

```bash
cp .env.example .env
nano .env
```

قم بتعديل القيم التالية | Edit the following values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TELEGRAM_BOT_TOKEN=8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os
OPENAI_API_KEY=your_openai_key_if_available
PORT=3001
```

**ملاحظة هامة:** للحصول على مفاتيح Supabase:
1. اذهب إلى https://supabase.com/dashboard/project/your-project-id/settings/api
2. انسخ `URL` و `service_role key` (ليس anon key)

### 6. تشغيل السيرفر | Start Server

#### للتشغيل المباشر | Direct Run:
```bash
npm start
```

#### للتشغيل في الخلفية مع PM2 | Run with PM2 (Recommended):
```bash
# تثبيت PM2 | Install PM2
npm install -g pm2

# تشغيل السيرفر | Start server
pm2 start server.js --name icore-bot

# حفظ الإعدادات | Save configuration
pm2 save

# تفعيل التشغيل التلقائي عند إعادة التشغيل | Enable auto-start
pm2 startup
```

### 7. إعداد Webhook | Setup Webhook

بعد تشغيل السيرفر، قم بإعداد webhook لـ Telegram:

```bash
curl -X POST http://51.75.118.170:20166/telegram/setup-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "http://51.75.118.170:20166/telegram/webhook"}'
```

أو استخدم المتصفح لزيارة:
```
http://51.75.118.170:20166/telegram/webhook-info
```

### 8. التحقق من الحالة | Check Status

```bash
# التحقق من صحة السيرفر | Health check
curl http://51.75.118.170:20166/health

# معلومات الـ webhook | Webhook info
curl http://51.75.118.170:20166/telegram/webhook-info

# إذا كنت تستخدم PM2 | If using PM2
pm2 status
pm2 logs icore-bot
```

## 🔒 الأمان | Security

1. **لا تشارك مفاتيح API:** احتفظ بملف `.env` سرياً
2. **استخدم HTTPS:** في الإنتاج، استخدم شهادة SSL
3. **قيّد الوصول:** استخدم جدار ناري لتقييد الوصول إلى المنافذ

## 📊 المراقبة | Monitoring

### عرض السجلات | View Logs:
```bash
pm2 logs icore-bot
```

### إعادة التشغيل | Restart:
```bash
pm2 restart icore-bot
```

### إيقاف السيرفر | Stop:
```bash
pm2 stop icore-bot
```

## 🐛 استكشاف الأخطاء | Troubleshooting

### المشكلة: السيرفر لا يعمل
**الحل:**
```bash
pm2 logs icore-bot --lines 100
```

### المشكلة: Telegram لا يرسل الرسائل
**الحل:**
1. تحقق من Webhook:
```bash
curl http://51.75.118.170:20166/telegram/webhook-info
```
2. تأكد من أن الـ URL صحيح ويمكن الوصول إليه
3. أعد إعداد الـ webhook

### المشكلة: قاعدة البيانات لا تستجيب
**الحل:**
1. تحقق من صحة مفاتيح Supabase في `.env`
2. تأكد من أن الجداول موجودة في Supabase
3. تحقق من صلاحيات RLS

## 📱 الاتصال بـ Telegram

بعد تشغيل السيرفر بنجاح:
1. افتح Telegram وابحث عن البوت: `@icore2_bot`
2. اضغط Start
3. اذهب إلى https://icore.life/dashboard/settings
4. اربط حساب Telegram الخاص بك
5. ابدأ المحادثة!

## 🔄 التحديثات | Updates

لتحديث السيرفر:
```bash
git pull  # إذا كنت تستخدم Git
pm2 restart icore-bot
```

## 📞 الدعم | Support

في حال واجهت أي مشاكل:
1. تحقق من السجلات: `pm2 logs icore-bot`
2. تحقق من ملف `.env`
3. تأكد من تشغيل جميع الخدمات (Supabase, Telegram)

---

## معلومات السيرفر الخاص بك | Your Server Info

```
Node: GRA-N49 - Gratuit
Server ID: e7d14421-2259-4fcb-9d52-72fd2d6a1fab
Hostname: 51.75.118.170:20166
Server IP: 51.75.118.170
SFTP: sftp.fr-node-49.katabump.com:2022
```

تم الإنشاء بواسطة v0 لـ iCore 🚀
