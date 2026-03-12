import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import AppleProvider from "next-auth/providers/apple"; // فك التعليق إذا أردت Apple

// تعريف خيارات المصادقة
export const authOptions: NextAuthOptions = {
  providers: [
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Apple Provider (إذا أردت تفعيله لاحقاً)
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // }),
  ],
  
  // استراتيجية الجلسة
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 يوم
  },
  
  // صفحات مخصصة
  pages: {
    signIn: '/login1',
    error: '/login1', // صفحة الخطأ
  },
  
  // معالجات (Callbacks)
  callbacks: {
    // التحقق عند تسجيل الدخول
    async signIn({ user, account, profile }) {
      console.log("محاولة تسجيل دخول:", { email: user.email, provider: account?.provider });
      
      // التأكد من وجود البريد الإلكتروني
      if (!user.email) {
        console.log("لا يوجد بريد إلكتروني");
        return false;
      }
      
      try {
        // الاتصال بـ Supabase للتحقق من البريد الإلكتروني
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("Supabase credentials missing");
          return false;
        }
        
        // البحث عن المستخدم في جدول remote_users
        const response = await fetch(
          `${supabaseUrl}/rest/v1/remote_users?email=eq.${encodeURIComponent(user.email)}&select=id,email,full_name`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          console.error("Supabase response error:", await response.text());
          return false;
        }
        
        const users = await response.json();
        console.log("نتيجة البحث:", users);
        
        // التحقق من وجود المستخدم
        if (users && users.length > 0) {
          console.log("✅ البريد الإلكتروني موجود - سماح بالدخول");
          return true;
        } else {
          console.log("❌ البريد الإلكتروني غير موجود - رفض الدخول");
          return false;
        }
        
      } catch (error) {
        console.error("خطأ في التحقق من البريد:", error);
        return false;
      }
    },
    
    // إضافة بيانات إضافية للـ JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    
    // إضافة بيانات للجلسة
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    
    // إعادة توجيه بعد تسجيل الدخول
    async redirect({ url, baseUrl }) {
      // إذا كان هناك خطأ في التحقق
      if (url.includes('error=EmailNotRegistered')) {
        return `${baseUrl}/login?error=not_registered`;
      }
      // الصفحة الافتراضية بعد تسجيل الدخول
      return `${baseUrl}/dashboard`;
    },
  },
  
  // أحداث إضافية
  events: {
    async signIn(message) {
      console.log("مستخدم سجل دخول:", message);
    },
    async signOut(message) {
      console.log("مستخدم سجل خروج:", message);
    },
  },
  
  // تفعيل التصحيح (Debug) - عطلها في الإنتاج
  debug: process.env.NODE_ENV === 'development',
  
  // مفتاح سري إضافي
  secret: process.env.NEXTAUTH_SECRET,
};

// إنشاء المعالج
const handler = NextAuth(authOptions);

// تصدير المعالج لطرق GET و POST
export { handler as GET, handler as POST };
