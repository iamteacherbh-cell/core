import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftProvider from "next-auth/providers/azure-ad";

// التحقق من وجود المتغيرات البيئية لـ Google
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("❌ Google Client ID or Secret is missing in .env.local");
}

// التحقق من وجود المتغيرات البيئية لـ Microsoft
if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
  throw new Error("❌ Microsoft Client ID or Secret is missing in .env.local");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      // استخدام "common" للسماح بأي حساب Microsoft شخصي (outlook, hotmail, live)
      tenantId: "common",
      // تحديد نطاقات إضافية إذا احتجت
      authorization: {
        params: {
          scope: "openid email profile User.Read",
        },
      },
    }),
  ],
  
  secret: process.env.NEXTAUTH_SECRET,
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 يوم
  },
  
  pages: {
    signIn: "/login1",
    error: "/login1?error=true",
  },
  
  callbacks: {
    // التحقق من البريد الإلكتروني عند تسجيل الدخول (لكل provider)
    async signIn({ user, account, profile }) {
      const provider = account?.provider || 'unknown';
      console.log(`🔐 محاولة دخول عبر ${provider}:`, user.email);
      
      if (!user.email) {
        console.log("❌ لا يوجد بريد إلكتروني");
        return false;
      }
      
      try {
        // الاتصال بـ verify-email.php للتحقق من وجود البريد
        const response = await fetch('http://jobsboard.mywebcommunity.org/verify-email.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider: provider,
          }),
          cache: 'no-cache',
        });

        if (!response.ok) {
          console.log("❌ فشل الاتصال بـ verify-email.php");
          return false;
        }

        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ البريد موجود - سماح بالدخول عبر ${provider}`);
          return true;
        } else {
          console.log(`❌ البريد غير موجود - رفض الدخول عبر ${provider}`);
          return false;
        }
        
      } catch (error) {
        console.error("❌ خطأ في التحقق:", error);
        return false;
      }
    },
    
    // إضافة بيانات للـ JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        // إضافة الـ refresh token إذا كان موجودًا
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
      }
      return token;
    },
    
    // إضافة بيانات للجلسة
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      // إضافة التوكن للجلسة إذا احتجت استخدامه في API
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      return session;
    },
    
    // التوجيه بعد تسجيل الدخول
    async redirect({ url, baseUrl }) {
      // ✅ تعديل: التوجيه إلى الصفحة الرئيسية بدلاً من dashboard1
      if (url.includes('error')) {
        return `${baseUrl}/login1?error=access_denied`;
      }
      // إذا كان المستخدم قادم من صفحة معينة، ارجعه إليها
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // التوجيه الافتراضي إلى الصفحة الرئيسية
      return `${baseUrl}/`;
    },
  },
  
  // أحداث للتتبع
  events: {
    async signIn(message) {
      console.log("✅ مستخدم سجل دخول:", message.user?.email);
    },
    async signOut(message) {
      console.log("👋 مستخدم سجل خروج:", message.session?.user?.email);
    },
  },
  
  // تفعيل التصحيح في التطوير فقط
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
