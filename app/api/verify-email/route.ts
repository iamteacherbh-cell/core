import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // طلب HTTP عادي من الخادم (ليس من المتصفح)
    const response = await fetch('http://jobsboard.mywebcommunity.org/verify-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'فشل الاتصال بالخادم' },
      { status: 500 }
    );
  }
}
