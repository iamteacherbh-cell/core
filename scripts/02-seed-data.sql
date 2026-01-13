-- Insert subscription plans
INSERT INTO subscription_plans (name_ar, name_en, description_ar, description_en, price, duration_days, features_ar, features_en)
VALUES 
  (
    'خطة أساسية',
    'Basic Plan',
    'خطة مثالية للبدء في بناء شبكة علاقاتك المهنية',
    'Perfect plan to start building your professional network',
    29.99,
    30,
    '["الوصول إلى الشات الذكي", "10 رسائل يومياً", "الملف الشخصي الأساسي"]',
    '["Access to smart chat", "10 daily messages", "Basic profile"]'
  ),
  (
    'خطة احترافية',
    'Professional Plan',
    'للمحترفين الذين يبحثون عن تواصل غير محدود',
    'For professionals seeking unlimited communication',
    79.99,
    30,
    '["شات ذكي غير محدود", "رسائل غير محدودة", "ملف شخصي مميز", "تكامل Telegram", "الأولوية في الدعم"]',
    '["Unlimited smart chat", "Unlimited messages", "Premium profile", "Telegram integration", "Priority support"]'
  ),
  (
    'خطة الأعمال',
    'Business Plan',
    'الحل الشامل للشركات والمؤسسات',
    'Complete solution for companies and organizations',
    199.99,
    30,
    '["كل مميزات الخطة الاحترافية", "حسابات متعددة", "تحليلات متقدمة", "API مخصص", "مدير حساب مخصص"]',
    '["All Professional features", "Multiple accounts", "Advanced analytics", "Custom API", "Dedicated account manager"]'
  )
ON CONFLICT DO NOTHING;
