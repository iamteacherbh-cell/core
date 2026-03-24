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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common",
      authorization: { params: { scope: "openid email profile User.Read" } },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  pages: {
    signIn: "/login1",
    error: "/login1?error=true",
  },

  callbacks: {
    async signIn({ user, account }) {
      const provider = account?.provider || "unknown";
      console.log(`🔐 محاولة دخول عبر ${provider}:`, user.email);

      if (!user.email) return false;

      // ================= Google =================
      if (provider === "google") {
        try {
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/proxy-verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              provider: "google",
            }),
          });

          const data = await res.json();

          if (!data.success) {
            console.log("❌ Google verify failed:", data.message);
            return false;
          }

          return true;
        } catch (error) {
          console.error("❌ Google error:", error);
          return false;
        }
      }

      // ================= Microsoft =================
      if (provider === "azure-ad") {
        try {
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/proxy-verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              provider: "microsoft",
            }),
          });

          const data = await res.json();

          if (!data.success) {
            console.log("❌ Microsoft verify failed:", data.message);
            return false;
          }

          // ✅ حفظ رابط التوجيه
          user.microsoftRedirect = data.redirect;

          console.log("✅ Microsoft redirect:", data.redirect);

          return true;
        } catch (error) {
          console.error("❌ Microsoft error:", error);
          return false;
        }
      }

      return false;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;

        if ((user as any).microsoftRedirect) {
          token.microsoftRedirect = (user as any).microsoftRedirect;
        }
      }

      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      (session as any).accessToken = token.accessToken;
      (session as any).provider = token.provider;

      return session;
    },

    async redirect({ url, baseUrl, token }) {
      // ✅ Microsoft redirect
      if ((token as any)?.microsoftRedirect) {
        return (token as any).microsoftRedirect;
      }

      if (url.includes("error")) {
        return `${baseUrl}/login1?error=access_denied`;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      return baseUrl;
    },
  },

  events: {
    async signIn(message) {
      console.log("✅ دخول:", message.user?.email);
    },
    async signOut(message) {
      console.log("👋 خروج:", message.session?.user?.email);
    },
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
