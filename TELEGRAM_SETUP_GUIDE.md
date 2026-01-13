# Tamam Telegram Bot Setup Guide / دليل إعداد بوت تمام على Telegram

## English

### For Administrators

1. **Setup Webhook**
   - Go to Dashboard → Admin → Telegram Setup
   - Click "Setup Webhook" button to automatically configure the webhook
   - Or manually set webhook using the URL provided

2. **Test the Bot**
   - Open Telegram and search for `@icore2_bot`
   - Send any message to test the connection
   - You should receive an automatic response

3. **Manage User Messages**
   - Go to Dashboard → Admin → User Messages
   - View all incoming messages from Telegram users
   - Reply directly from the admin panel
   - Messages are grouped by user for easy management

### For Users

1. **Get Your Telegram ID**
   - Open Telegram and search for `@userinfobot`
   - Start a chat with the bot
   - It will send you your Telegram ID (a number like 123456789)

2. **Link Your Account**
   - Go to Dashboard → Settings
   - Enter your Telegram ID and username
   - Click "Link Account"

3. **Start Chatting**
   - Send a message to `@icore2_bot` on Telegram
   - The AI will respond automatically
   - All conversations are synced between the website and Telegram
   - You can chat from either platform

### How It Works

- **From Telegram → Website**: Messages sent to the bot are automatically saved and can be viewed in the admin panel
- **From Website → Telegram**: Messages sent from the website chat are delivered to your Telegram
- **AI Responses**: The bot uses AI to respond automatically in your preferred language (Arabic or English)

---

## العربية

### للمدراء

1. **إعداد Webhook**
   - اذهب إلى لوحة التحكم ← الإدارة ← إعداد Telegram
   - اضغط على زر "إعداد Webhook" للإعداد التلقائي
   - أو قم بإعداد الـ webhook يدوياً باستخدام الرابط المعروض

2. **اختبار البوت**
   - افتح Telegram وابحث عن `@icore2_bot`
   - أرسل أي رسالة لاختبار الاتصال
   - ستتلقى رداً تلقائياً

3. **إدارة رسائل المستخدمين**
   - اذهب إلى لوحة التحكم ← الإدارة ← رسائل المستخدمين
   - شاهد جميع الرسائل الواردة من مستخدمي Telegram
   - رد مباشرة من لوحة الإدارة
   - الرسائل مجمعة حسب المستخدم لسهولة الإدارة

### للمستخدمين

1. **احصل على معرف Telegram الخاص بك**
   - افتح Telegram وابحث عن `@userinfobot`
   - ابدأ محادثة مع البوت
   - سيرسل لك معرف Telegram الخاص بك (رقم مثل 123456789)

2. **ربط حسابك**
   - اذهب إلى لوحة التحكم ← الإعدادات
   - أدخل معرف Telegram واسم المستخدم
   - اضغط على "ربط الحساب"

3. **ابدأ المحادثة**
   - أرسل رسالة إلى `@icore2_bot` على Telegram
   - سيرد عليك الذكاء الاصطناعي تلقائياً
   - جميع المحادثات متزامنة بين الموقع و Telegram
   - يمكنك الدردشة من أي منصة

### كيف يعمل النظام

- **من Telegram → الموقع**: الرسائل المرسلة إلى البوت تُحفظ تلقائياً ويمكن عرضها في لوحة الإدارة
- **من الموقع → Telegram**: الرسائل المرسلة من شات الموقع تُسلّم إلى Telegram الخاص بك
- **ردود الذكاء الاصطناعي**: البوت يستخدم الذكاء الاصطناعي للرد تلقائياً بلغتك المفضلة (عربي أو إنجليزي)

## Technical Details / التفاصيل التقنية

### Bot Token
```
8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os
```

### Bot Username
```
@icore2_bot
```

### Webhook Endpoint
```
https://your-domain.com/api/telegram/webhook
```

### Features / المميزات

- ✅ Bidirectional messaging (Telegram ↔ Website)
- ✅ AI-powered responses using GPT-5-mini
- ✅ Multi-user support
- ✅ Arabic and English language support
- ✅ Message history tracking
- ✅ Admin panel for managing conversations
- ✅ Real-time message synchronization

### Troubleshooting / حل المشاكل

**Messages not being received:**
1. Check if webhook is properly setup (Admin → Telegram Setup → Test Connection)
2. Verify your Telegram ID is correctly linked (Settings page)
3. Make sure you're chatting with the correct bot (@icore2_bot)
4. Check the browser console for any errors

**AI not responding:**
1. Ensure you have linked your Telegram account
2. Check that the bot has received your message (Admin → User Messages)
3. Verify the AI API is working (try the web chat first)

**الرسائل لا تصل:**
1. تحقق من إعداد webhook بشكل صحيح (الإدارة ← إعداد Telegram ← اختبار الاتصال)
2. تأكد من ربط معرف Telegram بشكل صحيح (صفحة الإعدادات)
3. تأكد من أنك تتحدث مع البوت الصحيح (@icore2_bot)
4. تحقق من وحدة تحكم المتصفح للأخطاء

**الذكاء الاصطناعي لا يستجيب:**
1. تأكد من ربط حساب Telegram الخاص بك
2. تحقق من وصول الرسالة للبوت (الإدارة ← رسائل المستخدمين)
3. تأكد من عمل واجهة الذكاء الاصطناعي (جرب الشات في الموقع أولاً)
