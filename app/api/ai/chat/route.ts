import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// هذه الدالة تنشئ عميلًا صحيحًا للخادم
// تقرأ الكوكيز من الطلب القادم من المتصفح
function createSupabaseClientForAPI() {
  const cookieStore = cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST(req) {
  // استخدم العميل الخاص بالـ API هنا
  const supabase = createSupabaseClientForAPI();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('API Error: User not authenticated.', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    // ... هنا باقي كود الذكاء الاصطناعي الخاص بك ...
    // مثال بسيط:
    const reply = `تم استلام رسالتك: ${message}`;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('API Error: ', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
