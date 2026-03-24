// app/api/auth/[...nextauth]/route.ts
// ✅ الكود المعدّل للتوجيه إلى jobsboard.mywebcommunity.org

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftProvider from "next-auth/providers/azure-ad";

// التحقق من env
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("❌ Google Client ID or Secret is missing");
}
if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
  throw new Error("❌ Microsoft Client ID or Secret is missing");
}
if (!process.env.NEXTAUTH_URL) {
  throw new Error("❌ NEXTAUTH_URL is missing");
}

// ✅ رابط التوجيه الخارجي
const EXTERNAL_REDIRECT_BASE = "http://jobsboard.mywebcommunity.org";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common",
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
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login1",
    error: "/login1?error=true",
  },

  callbacks: {
    // ================= SIGN IN =================
    async signIn({ user, account }) {
      const provider = account?.provider || "unknown";
      console.log(`🔐 Login via ${provider}:`, user.email);

      if (!user.email) return false;

      try {
        // 🔥 إرسال البيانات إلى proxy للتحقق في jobsboard
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/proxy-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider: provider === "azure-ad" ? "microsoft" : provider,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          console.log("❌ Verify failed:", data.message);
          return false;
        }

        // ✅ إذا فيه redirect URL، ارجعه مباشرة (NextAuth سيوجه إليه)
        if (data.redirect) {
          console.log("✅ Redirecting to:", data.redirect);
          return data.redirect;
        }

        return true;
      } catch (error) {
        console.error("❌ Auth error:", error);
        return false;
      }
    },

    // ================= JWT =================
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }

      if (account) {
        token.provider = account.provider;
        token.accessToken = account.access_token;
      }

      return token;
    },

    // ================= SESSION =================
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      (session as any).provider = token.provider;
      (session as any).accessToken = token.accessToken;

      return session;
    },

    // ================= REDIRECT =================
    async redirect({ url, baseUrl }) {
      try {
        // ✅ السماح بالتوجيه إلى jobsboard
        if (url.includes("jobsboard.mywebcommunity.org")) {
          console.log("✅ Allowing redirect to jobsboard:", url);
          return url;
        }

        // ✅ السماح بالروابط الخارجية الموثوقة
        const trustedDomains = [
          "jobsboard.mywebcommunity.org",
          "icore.life",
        ];

        try {
          const urlObj = new URL(url);
          if (trustedDomains.some(domain => urlObj.hostname.includes(domain))) {
            return url;
          }
        } catch {
          // ليس URL صالح، تابع
        }

        // روابط http/https أخرى
        if (url.startsWith("http://") || url.startsWith("https://")) {
          // تحقق إذا كان من نفس الدومين
          const urlObj = new URL(url);
          const baseObj = new URL(baseUrl);
          if (urlObj.origin === baseObj.origin) {
            return url;
          }
          // للروابط الخارجية غير الموثوقة، ارجع للـ base
          return baseUrl;
        }

        // روابط داخلية (تبدأ بـ /)
        if (url.startsWith("/")) {
          return new URL(url, baseUrl).toString();
        }

        return baseUrl;
      } catch (error) {
        console.error("Redirect error:", error);
        return baseUrl;
      }
    },
  },

  events: {
    async signIn(message) {
      console.log("✅ Signed in:", message.user?.email);
    },
    async signOut(message) {
      console.log("👋 Signed out:", message.session?.user?.email);
    },
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
