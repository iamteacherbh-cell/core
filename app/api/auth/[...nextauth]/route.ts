import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftProvider from "next-auth/providers/azure-ad";
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// بيانات اتصال MySQL
const DB_HOST = 'fdb1029.awardspace.net';
const DB_NAME = '4537032_bh';
const DB_USER = '4537032_bh';
const DB_PASS = 'sea12345';

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
        let connection;
        try {
          connection = await mysql.createConnection({
            host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME,
          });
          
          // 1. التحقق من وجود البريد في remote_users
          const [rows] = await connection.execute(
            'SELECT id FROM remote_users WHERE email = ?',
            [user.email]
          );
          if (!Array.isArray(rows) || rows.length === 0) {
            console.log(`❌ بريد Microsoft غير مسجل: ${user.email}`);
            return false;
          }
          console.log(`✅ بريد Microsoft موجود: ${user.email}`);
          
          // 2. إنشاء token
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 10);
          
          // 3. تخزين token في store_token.php
          const storeResponse = await fetch('http://jobsboard.mywebcommunity.org/store_token.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, token, expires: expiresAt.toISOString() }),
          });
          const storeData = await storeResponse.json();
          if (!storeData.success) {
            console.log("❌ فشل تخزين token:", storeData.error);
            return false;
          }
          
          // 4. حفظ رابط التوجيه في user
          user.microsoftRedirect = `http://jobsboard.mywebcommunity.org/login.php?token=${token}`;
          console.log(`✅ تم تخزين token، رابط التوجيه: ${user.microsoftRedirect}`);
          return true;
          
        } catch (error) {
          console.error("❌ Microsoft error:", error);
          return false;
        } finally {
          if (connection) await connection.end();
        }
      }
      
      return false;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        if (user.microsoftRedirect) {
          token.microsoftRedirect = user.microsoftRedirect;
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
      session.accessToken = token.accessToken as string;
      session.provider = token.provider as string;
      return session;
    },
    
    async redirect({ url, baseUrl, token }) {
      // ✅ إذا كان هناك رابط مخصص لـ Microsoft، استخدمه
      if (token?.microsoftRedirect) {
        console.log("🔀 التوجيه إلى Microsoft:", token.microsoftRedirect);
        return token.microsoftRedirect;
      }
      if (url.includes('error')) {
        return `${baseUrl}/login1?error=access_denied`;
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
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
