import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // إذا لم يكن هناك جلسة أو البريد غير موجود، توجه مباشرة للرابط الخارجي
  if (!session?.user?.email) {
    return Response.redirect(
      "http://jobsboard.mywebcommunity.org/login.php",
      307
    );
  }

  try {
    // إرسال البيانات إلى ملف PHP للتحقق في قاعدة البيانات
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

    // إذا تحقق البريد بنجاح، توجيه المستخدم إلى الرابط مع التوكن
    if (data?.success && data?.redirect) {
      return Response.redirect(data.redirect, 307);
    }

    // إذا فشل التحقق
    return Response.redirect(
      "http://jobsboard.mywebcommunity.org/login.php?error=unauthorized",
      307
    );

  } catch (err) {
    console.error("❌ Error contacting verify-microsoft.php:", err);
    return Response.redirect(
      "http://jobsboard.mywebcommunity.org/login.php?error=server-error",
      307
    );
  }
}
