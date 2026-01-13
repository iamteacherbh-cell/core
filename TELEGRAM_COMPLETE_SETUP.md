# دليل إعداد Telegram - icore.life
# Telegram Setup Guide - icore.life

## معلومات البوت / Bot Information

- **Bot Token**: `8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os`
- **Bot Username**: `@icore2_bot`
- **Group ID**: `-1003583611128`

---

## خطوات الإعداد / Setup Steps

### 1. إعداد Webhook

#### الطريقة الأولى: من لوحة التحكم
1. اذهب إلى: `/dashboard/admin/telegram-setup`
2. انقر على "إعداد Webhook"
3. انتظر رسالة التأكيد

#### الطريقة الثانية: يدوياً
أرسل طلب POST إلى:
```
https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/setWebhook
```

مع البيانات:
```json
{
  "url": "https://v0-digital-platform-build-chi.vercel.app/api/telegram/webhook"
}
```

---

### 2. ربط حساب المستخدم

#### من الموقع:
1. سجل الدخول إلى حسابك على icore.life
2. اذهب إلى الإعدادات
3. أدخل Telegram ID الخاص بك
4. احفظ التغييرات

#### كيف تحصل على Telegram ID:
1. افتح Telegram
2. ابحث عن `@userinfobot`
3. ابدأ محادثة معه
4. سيرسل لك معرفك الرقمي (Telegram ID)

---

### 3. التحقق من الاتصال

#### اختبار من Telegram:
1. افتح `@icore2_bot`
2. أرسل رسالة: "مرحباً" أو "Hello"
3. يجب أن تصل الرسالة إلى قاعدة البيانات
4. يجب أن يرد البوت بذكاء اصطناعي

#### اختبار من الموقع:
1. اذهب إلى: `/dashboard/chat`
2. أرسل رسالة
3. يجب أن تصلك الرسالة على Telegram (إذا تم ربط الحساب)
4. يجب أن يرد البوت بذكاء اصطناعي

---

### 4. لوحة الإدارة

#### رسائل المستخدمين:
- اذهب إلى: `/dashboard/admin/messages`
- شاهد جميع الرسائل الواردة من Telegram
- رد على أي مستخدم مباشرة
- الرد سيصل إلى المستخدم على Telegram والموقع

---

## كيف يعمل النظام / How It Works

### من Telegram إلى الموقع:
1. المستخدم يرسل رسالة للبوت
2. Telegram يرسل Webhook إلى `/api/telegram/webhook`
3. النظام يحفظ الرسالة في قاعدة البيانات
4. الذكاء الاصطناعي يولد رداً
5. الرد يُحفظ ويُرسل للمستخدم على Telegram
6. الرسالة تظهر في لوحة الإدارة

### من الموقع إلى Telegram:
1. المستخدم يرسل رسالة من `/dashboard/chat`
2. النظام يحفظ الرسالة في قاعدة البيانات
3. الذكاء الاصطناعي يولد رداً
4. إذا كان المستخدم مربوط بـ Telegram، يُرسل الرد إلى Telegram
5. الرد يظهر في الموقع أيضاً

### من لوحة الإدارة:
1. المدير يشاهد رسائل المستخدمين في `/dashboard/admin/messages`
2. المدير يكتب رداً
3. الرد يُحفظ في قاعدة البيانات
4. الرد يُرسل مباشرة إلى Telegram chat_id الخاص بالمستخدم
5. المستخدم يستلم الرد على Telegram

---

## استكشاف الأخطاء / Troubleshooting

### الرسائل لا تصل:

#### تحقق من Webhook:
```bash
curl https://api.telegram.org/bot8289329398:AAGGqvg_2cnmpmkS0-UecU1JkOFyCBeU6os/getWebhookInfo
```

يجب أن يكون الرد:
```json
{
  "ok": true,
  "result": {
    "url": "https://v0-digital-platform-build-chi.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

#### تحقق من قاعدة البيانات:
- افتح Supabase
- تحقق من جدول `profiles`
- تأكد من أن `telegram_id` و `telegram_chat_id` محفوظين بشكل صحيح

#### تحقق من السجلات (Logs):
- افتح Vercel Dashboard
- اذهب إلى Logs
- ابحث عن `[v0]` في السجلات
- راجع أي أخطاء

---

## ملاحظات مهمة / Important Notes

1. **توكن البوت**: لا تشارك توكن البوت مع أحد
2. **Webhook**: يجب أن يكون HTTPS فقط
3. **Chat ID**: يختلف عن User ID في بعض الحالات
4. **المجموعات**: معرف المجموعة يبدأ بـ `-` (سالب)
5. **التزامن**: كل الرسائل محفوظة في قاعدة بيانات واحدة
6. **الذكاء الاصطناعي**: يستخدم GPT-4o-mini افتراضياً
7. **اللغة**: النظام يكتشف لغة المستخدم تلقائياً

---

## للدعم / Support

إذا واجهت أي مشاكل:
1. تحقق من هذا الدليل أولاً
2. راجع السجلات في Vercel
3. تحقق من قاعدة البيانات في Supabase
4. جرب حذف وإعادة إعداد Webhook
