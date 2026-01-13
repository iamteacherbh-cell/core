# iCore Telegram Bot Server

سيرفر Node.js مستقل لإدارة بوت Telegram الخاص بمنصة iCore.

## الميزات | Features

✅ استقبال الرسائل من Telegram
✅ الرد التلقائي باستخدام AI (OpenAI GPT-4o-mini)
✅ حفظ المحادثات في Supabase
✅ دعم اللغتين العربية والإنجليزية
✅ نظام webhook متكامل
✅ سهل النشر على أي سيرفر Node.js

## البدء السريع | Quick Start

1. ثبت الحزم:
```bash
npm install
```

2. أنشئ ملف `.env`:
```bash
cp .env.example .env
```

3. عدّل `.env` بمفاتيحك

4. شغّل السيرفر:
```bash
npm start
```

## البنية | Structure

```
node-server/
├── server.js           # السيرفر الرئيسي
├── package.json        # الحزم والتبعيات
├── .env.example        # مثال على ملف البيئة
├── DEPLOYMENT_GUIDE.md # دليل النشر الكامل
└── README.md          # هذا الملف
```

## الـ Endpoints

- `GET /health` - التحقق من صحة السيرفر
- `POST /telegram/webhook` - استقبال رسائل Telegram
- `POST /telegram/setup-webhook` - إعداد webhook
- `GET /telegram/webhook-info` - معلومات webhook الحالي

## التوثيق الكامل

راجع [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) للحصول على دليل نشر مفصل.
