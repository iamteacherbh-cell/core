import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanEmail = body.email?.trim().replace(/\n/g, '');
    
    if (!cleanEmail) {
      return NextResponse.json({ success: false, message: 'البريد مطلوب' }, { status: 400 });
    }
    
    // إنشاء رمز عشوائي آمن
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // صالح لمدة 10 دقائق
    
    // تخزين الرمز في قاعدة البيانات (يفضل استخدام Redis أو جدول مؤقت)
    // هنا مثال باستخدام نفس قاعدة البيانات
    const response = await fetch('http://jobsboard.mywebcommunity.org/store_token.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        token: token,
        expires: expiresAt.toISOString()
      })
    });

    // إرسال الرمز في الرابط بدلاً من البريد
    return NextResponse.json({
      success: true,
      redirect: `http://jobsboard.mywebcommunity.org/login.php?token=${token}`
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 });
  }
}
