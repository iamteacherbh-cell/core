import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { message } = body

  // ... هنا ضع منطق الذكاء الاصطناعي الحقيقي ...
  const reply = `تم استلام رسالتك: ${message}`

  return NextResponse.json({ reply })
}
