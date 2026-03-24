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

        // توجيه إذا Microsoft
        if (data.redirect) {
          (user as any).redirectUrl = data.redirect;
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

        // حفظ redirect
        if ((user as any).redirectUrl) {
          token.redirectUrl = (user as any).redirectUrl;
        }
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

      // حفظ redirect في session
      if ((token as any).redirectUrl) {
        (session as any).redirectUrl = (token as any).redirectUrl;
      }

      return session;
    },

    // ================= REDIRECT =================
    async redirect({ url, baseUrl }) {
      try {
        // روابط خارجية
        if (url.startsWith("http://") || url.startsWith("https://")) {
          return url;
        }

        // روابط داخلية
        if (url.startsWith("/")) {
          return new URL(url, baseUrl).toString(); // WHATWG URL API لتجنب DeprecationWarning
        }

        return baseUrl;
      } catch {
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
