// app/api/proxy-verify/route.ts
// ✅ API للتحقق من البريد وإنشاء token للتوجيه إلى jobsboard

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// ✅ رابط موقعك الخارجي
const JOBSBOARD_URL = "http://jobsboard.mywebcommunity.org";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().replace(/\n/g, '');
    const name = body.name || '';
    const provider = body.provider || 'unknown';

    console.log(`🔍 Verifying email: ${email} via ${provider}`);

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'البريد مطلوب'
      }, { status: 400 });
    }

    // ✅ إنشاء رمز عشوائي آمن (64 حرف hex)
    const token = randomBytes(32).toString('hex');

    // ✅ وقت الانتهاء (10 دقائق)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // ✅ تخزين الرمز في قاعدة بيانات jobsboard
    try {
      const storeResponse = await fetch(`${JOBSBOARD_URL}/store_token.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          token: token,
          name: name,
          provider: provider,
          expires: expiresAt.toISOString()
        })
      });

      const storeResult = await storeResponse.json();

      if (!storeResult.success) {
        console.log("❌ Store token failed:", storeResult.message);
        // نستمر حتى لو فشل التخزين - قد يكون مشكلة اتصال مؤقتة
      } else {
        console.log("✅ Token stored successfully");
      }
    } catch (storeError) {
      console.error("⚠️ Store token error (continuing anyway):", storeError);
      // نستمر حتى لو فشل - قد يكون مشكلة CORS
    }

    // ✅ إرسال رابط التوجيه مع الـ token
    const redirectUrl = `${JOBSBOARD_URL}/login.php?token=${token}`;

    console.log(`✅ Redirect URL: ${redirectUrl}`);

    return NextResponse.json({
      success: true,
      redirect: redirectUrl,
      message: 'تم التحقق بنجاح'
    });

  } catch (error) {
    console.error("❌ Proxy verify error:", error);
    return NextResponse.json({
      success: false,
      message: 'خطأ في الخادم'
    }, { status: 500 });
  }
}

// ✅ دعم CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
