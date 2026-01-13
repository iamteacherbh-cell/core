export const languages = {
  ar: "العربية",
  en: "English",
} as const

export type Language = keyof typeof languages

export const translations = {
  ar: {
    // Navigation
    home: "الرئيسية",
    features: "المميزات",
    about: "من نحن",
    contact: "اتصل بنا",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",

    // Hero
    heroTitle: "icore.life - منصتك المهنية للتواصل الذكي",
    heroSubtitle: "ابن شبكة علاقاتك المهنية والتجارية مع أدوات الذكاء الاصطناعي",
    getStarted: "ابدأ الآن",
    learnMore: "اعرف المزيد",

    // Features
    smartChat: "شات ذكي",
    smartChatDesc: "تواصل مع محترفين آخرين عبر واجهة شات ذكية مدعومة بالذكاء الاصطناعي",
    telegramIntegration: "تكامل Telegram",
    telegramIntegrationDesc: "استقبل الإشعارات والرسائل مباشرة على Telegram",
    professionalNetwork: "شبكة مهنية",
    professionalNetworkDesc: "بناء علاقات مهنية قوية مع رواد الأعمال والمحترفين",
    secureData: "بيانات آمنة",
    secureDataDesc: "حماية كاملة لبياناتك مع أعلى معايير الأمان",

    // Pricing
    // perMonth: "شهرياً",
    // subscribe: "اشترك الآن",
    // popular: "الأكثر شعبية",

    // Auth
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    rememberMe: "تذكرني",
    forgotPassword: "نسيت كلمة المرور؟",
    dontHaveAccount: "ليس لديك حساب؟",
    alreadyHaveAccount: "لديك حساب بالفعل؟",

    // Dashboard
    mySubscription: "اشتراكي",
    chatHistory: "سجل المحادثات",
    myConnections: "علاقاتي",
    settings: "الإعدادات",
    profile: "الملف الشخصي",

    // Messages
    loading: "جارِ التحميل...",
    error: "حدث خطأ",
    success: "تم بنجاح",
    noData: "لا توجد بيانات",

    // Admin
    adminMessages: "رسائل المستخدمين",
    aiChat: "الشات الذكي",
    replyTo: "الرد على",
    sendReply: "إرسال الرد",
    markAsRead: "تحديد كمقروء",
    unreadMessages: "رسائل غير مقروءة",
    allMessages: "جميع الرسائل",
    noMessages: "لا توجد رسائل",
    repliedAt: "تم الرد في",
    receivedAt: "تم الاستلام في",
    telegramSetup: "إعداد Telegram",
    webhookUrl: "رابط Webhook",
    setupWebhook: "إعداد Webhook",
    testConnection: "اختبار الاتصال",
    webhookInstructions: "لإعداد Telegram Bot، قم بنسخ رابط Webhook التالي",
    user: "المستخدم",
    message: "الرسالة",
    telegramConversations: "محادثات Telegram",
  },
  en: {
    // Navigation
    home: "Home",
    features: "Features",
    about: "About",
    contact: "Contact",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    dashboard: "Dashboard",

    // Hero
    heroTitle: "icore.life - Your Professional Platform for Smart Communication",
    heroSubtitle: "Build your professional and business network with AI-powered tools",
    getStarted: "Get Started",
    learnMore: "Learn More",

    // Features
    smartChat: "Smart Chat",
    smartChatDesc: "Connect with professionals through an AI-powered smart chat interface",
    telegramIntegration: "Telegram Integration",
    telegramIntegrationDesc: "Receive notifications and messages directly on Telegram",
    professionalNetwork: "Professional Network",
    professionalNetworkDesc: "Build strong professional relationships with entrepreneurs and professionals",
    secureData: "Secure Data",
    secureDataDesc: "Complete protection for your data with the highest security standards",

    // Pricing
    // perMonth: "per month",
    // subscribe: "Subscribe Now",
    // popular: "Most Popular",

    // Auth
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    phone: "Phone",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",

    // Dashboard
    mySubscription: "My Subscription",
    chatHistory: "Chat History",
    myConnections: "My Connections",
    settings: "Settings",
    profile: "Profile",

    // Messages
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    noData: "No data",

    // Admin
    adminMessages: "User Messages",
    aiChat: "AI Chat",
    replyTo: "Reply to",
    sendReply: "Send Reply",
    markAsRead: "Mark as Read",
    unreadMessages: "Unread Messages",
    allMessages: "All Messages",
    noMessages: "No messages",
    repliedAt: "Replied at",
    receivedAt: "Received at",
    telegramSetup: "Telegram Setup",
    webhookUrl: "Webhook URL",
    setupWebhook: "Setup Webhook",
    testConnection: "Test Connection",
    webhookInstructions: "To setup your Telegram Bot, copy the following Webhook URL",
    user: "User",
    message: "Message",
    telegramConversations: "Telegram Conversations",
  },
} as const

export function useTranslation(lang: Language) {
  return translations[lang]
}
