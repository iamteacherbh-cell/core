import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftProvider from "next-auth/providers/azure-ad";

// التحقق من المتغيرات البيئية
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("❌ Google Client ID or Secret is missing in .env.local");
}
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
      tenantId: "common",
      authorization: { params: { scope: "openid email profile User.Read" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login1", error: "/login1?error=true" },
  
  callbacks: {
    async signIn({ user, account }) {
      const provider = account?.provider || 'unknown';
      console.log(`🔐 محاولة دخول عبر ${provider}:`, user.email);
      if (!user.email) return false;

      // ========== Google ==========
      if (provider === 'google') {
        try {
          const response = await fetch('http://jobsboard.mywebcommunity.org/verify-email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, name: user.name, provider }),
          });
          if (!response.ok) return false;
          const data = await response.json();
          return data.success === true;
        } catch (error) {
          console.error("❌ Google error:", error);
          return false;
        }
      }

      // ========== Microsoft ==========
      if (provider === 'azure-ad') {
        try {
          const response = await fetch('http://jobsboard.mywebcommunity.org/verify-microsoft.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });
          
          if (!response.ok) {
            console.log("❌ فشل الاتصال بـ verify-microsoft.php");
            return false;
          }
          
          const data = await response.json();
          console.log("📦 استجابة verify-microsoft.php:", data);
          
          if (data.success && data.redirect) {
            // ✅ تخزين رابط التوجيه في account بدلاً من user
            account.microsoftRedirect = data.redirect;
            console.log(`✅ تم إنشاء توكن لـ Microsoft، رابط التوجيه: ${account.microsoftRedirect}`);
            return true;
          } else {
            console.log(`❌ فشل التحقق من Microsoft: ${data.message}`);
            return false;
          }
          
        } catch (error) {
          console.error("❌ Microsoft error:", error);
          return false;
        }
      }
      
      return false;
    },
    
    async jwt({ token, user, account }) {
      console.log("🔄 JWT - account exists:", account ? "yes" : "no");
      console.log("🔄 JWT - account.microsoftRedirect:", account?.microsoftRedirect);
      
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        
        // ✅ نقل microsoftRedirect من account إلى token
        if (account.microsoftRedirect) {
          token.microsoftRedirect = account.microsoftRedirect;
          console.log("✅ تم إضافة microsoftRedirect إلى token من account");
        }
      }
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      
      console.log("🔄 JWT - token after:", { 
        hasMicrosoftRedirect: !!token.microsoftRedirect,
        provider: token.provider 
      });
      
      return token;
    },
    
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      return session;
    },
    
    async redirect({ url, baseUrl, token }) {
      console.log("🔀 Redirect - token exists:", token ? "yes" : "no");
      console.log("🔀 Redirect - token.microsoftRedirect:", token?.microsoftRedirect);
      console.log("🔀 Redirect - url:", url);
      console.log("🔀 Redirect - baseUrl:", baseUrl);
      
      // ✅ إذا كان هناك رابط مخصص لـ Microsoft، استخدمه
      if (token?.microsoftRedirect) {
        console.log("🔀 التوجيه إلى Microsoft:", token.microsoftRedirect);
        return token.microsoftRedirect;
      }
      
      if (url.includes('error')) {
        console.log("🔀 التوجيه إلى خطأ:", `${baseUrl}/login1?error=access_denied`);
        return `${baseUrl}/login1?error=access_denied`;
      }
      
      if (url.startsWith('/')) {
        console.log("🔀 التوجيه إلى مسار داخلي:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      
      console.log("🔀 التوجيه الافتراضي إلى:", `${baseUrl}/`);
      return `${baseUrl}/`;
    },
  },
  
  events: {
    async signIn(message) { console.log("✅ دخول:", message.user?.email); },
    async signOut(message) { console.log("👋 خروج:", message.session?.user?.email); },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
