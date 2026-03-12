import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // التحقق من البريد الإلكتروني عبر Supabase
      try {
        const response = await fetch('https://tozvejugoydqcjaekerk.supabase.co/rest/v1/remote_users', {
          method: 'GET',
          headers: {
            'apikey': process.env.SUPABASE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_KEY!}`,
          },
        });
        
        // التحقق مما إذا كان البريد موجوداً
        const users = await response.json();
        const userExists = users.some(u => u.email === user.email);
        
        if (userExists) {
          return true; // البريد موجود - سمح بالدخول
        } else {
          return false; // البريد غير موجود - ارفض الدخول
        }
      } catch (error) {
        console.error('Error:', error);
        return false;
      }
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/login1',
    error: '/login1?error=EmailNotRegistered',
  },
});

export { handler as GET, handler as POST };
