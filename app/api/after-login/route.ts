import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    // إذا لم يسجل المستخدم الدخول، توجه مباشرة للرابط الخارجي
    return Response.redirect(
      "http://jobsboard.mywebcommunity.org/login.php",
      307
    );
  }

  // إرسال بيانات البريد إلى verify-microsoft.php
  const res = await fetch(
    "https://jobsboard.mywebcommunity.org/verify-microsoft.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name,
        provider: "microsoft",
      }),
    }
  );

  const data = await res.json();

  // إذا كان البريد موجود وتم إنشاء توكن، توجيه المستخدم للرابط مع التوكن
  if (data?.success && data?.redirect) {
    return Response.redirect(data.redirect, 307);
  }

  // إذا لم يتم التحقق، توجه للصفحة الرئيسية أو صفحة خطأ آمنة
  return Response.redirect(
    "http://jobsboard.mywebcommunity.org/login.php?error=unauthorized",
    307
  );
}
