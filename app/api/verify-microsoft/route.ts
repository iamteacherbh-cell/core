import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;
    
    if (!email) {
      return NextResponse.json({ success: false, message: 'البريد مطلوب' }, { status: 400 });
    }
    
    // التحقق من وجود البريد عبر verify-microsoft.php
    const verifyResponse = await fetch('http://jobsboard.mywebcommunity.org/verify-microsoft.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    
    const verifyData = await verifyResponse.json();
    
    if (!verifyData.success) {
      return NextResponse.json({ success: false, message: verifyData.message }, { status: 400 });
    }
    
    // إذا كان verify-microsoft.php أعاد رابط التوجيه، استخدمه مباشرة
    if (verifyData.redirect) {
      return NextResponse.json({
        success: true,
        redirect: verifyData.redirect
      });
    }
    
    // إنشاء رمز عشوائي آمن (إذا لم يتم في verify-microsoft.php)
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    // تخزين الرمز
    const storeResponse = await fetch('http://jobsboard.mywebcommunity.org/store_token.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        token,
        expires: expiresAt.toISOString()
      })
    });
    
    return NextResponse.json({
      success: true,
      redirect: `http://jobsboard.mywebcommunity.org/login.php?token=${token}`
    });
    
  } catch (error) {
    console.error('Verify Microsoft error:', error);
    return NextResponse.json({ success: false, message: 'خطأ في الخادم' }, { status: 500 });
  }
}
