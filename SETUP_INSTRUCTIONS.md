# iCore - دليل إعداد Telegram

## خطوات إعداد البوت

### 1. إعداد Webhook

يجب إعداد webhook للبوت ليستقبل الرسائل. استخدم الرابط التالي:

```
https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/setWebhook?url=YOUR_DEPLOYMENT_URL/api/telegram/webhook
```

استبدل `YOUR_DEPLOYMENT_URL` برابط موقعك المنشور على Vercel.

### 2. التحقق من Webhook

للتحقق من إعداد webhook:

```
https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/getWebhookInfo
```

### 3. ربط حساب المستخدم

1. المستخدم يذهب إلى Dashboard → Settings
2. يدخل Telegram User ID الخاص به
3. يحفظ الإعدادات

**كيفية الحصول على Telegram User ID:**
- افتح البوت: @icore2_bot
- أرسل أي رسالة
- البوت سيرد برسالة ترحيبية تطلب منك ربط الحساب
- ID الخاص بك موجود في السجلات

### 4. كيفية عمل النظام

**من Telegram إلى الموقع:**
1. المستخدم يرسل رسالة للبوت على Telegram
2. Webhook يستقبل الرسالة
3. النظام يتحقق من ربط الحساب
4. يحفظ الرسالة في قاعدة البيانات
5. يولد رد بالذكاء الاصطناعي
6. يرسل الرد إلى Telegram
7. الرسائل تظهر في صفحة Chat بالموقع

**من الموقع إلى Telegram:**
1. المستخدم يرسل رسالة من صفحة Chat
2. النظام يحفظ الرسالة
3. يولد رد بالذكاء الاصطناعي
4. يرسل نسخة إلى Telegram (إذا كان الحساب مربوط)
5. الرسائل متزامنة بين المنصتين

### 5. للمشرفين

يمكن للمشرفين:
- قراءة جميع رسائل المستخدمين من Dashboard → Admin → User Messages
- الرد على أي مستخدم مباشرة
- الردود ترسل تلقائياً إلى Telegram

### معرف المجموعة

إذا كنت تريد إرسال رسائل إلى مجموعة:
- Group ID: -1003583611128
- يمكن استخدامه في telegram_chat_id

### معلومات البوت

- Bot Token: 8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os
- Bot Username: @icore2_bot
- Bot Link: t.me/icore2_bot

---

## Setup Instructions (English)

### How the System Works

**From Telegram to Website:**
1. User sends message to bot on Telegram
2. Webhook receives the message
3. System checks if account is linked
4. Saves message to database
5. Generates AI response
6. Sends reply to Telegram
7. Messages appear in Chat page on website

**From Website to Telegram:**
1. User sends message from Chat page
2. System saves the message
3. Generates AI response
4. Sends copy to Telegram (if account is linked)
5. Messages are synchronized between both platforms

### For Administrators

Administrators can:
- Read all user messages from Dashboard → Admin → User Messages
- Reply to any user directly
- Replies are automatically sent to Telegram
