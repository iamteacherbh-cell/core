import { createClient } from '@/lib/supabase/server'; // استخدام الطريقة المركزية
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = await createClient(); // إنشاء العميل بالطريقة الصحيحة

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    // ... هنا ضع منطق الذكاء الاصطناعي الحقيقي الخاص بك ...
    const reply = `تم استلام رسالتك: ${message}`;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
