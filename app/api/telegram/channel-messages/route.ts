import { NextResponse } from 'next/server';

// هذه دالة وهمية. يجب أن تستبدلها بالدالة الحقيقية التي تجلب رسائلك من تيليجرام.
async function getTelegramMessages() {
  // هنا ضع منطقك لجلب الرسائل
  // مثال: استدعاء API تيليجرام أو قراءة من قاعدة البيانات
  console.log('Fetching Telegram messages...');
  
  // قم بإرجاع مصفوفة من الرسائل
  return [
    { id: 1, text: 'مرحباً', sender: 'user1', timestamp: new Date() },
    { id: 2, text: 'كيف حالك؟', sender: 'user2', timestamp: new Date() },
  ];
}

// تم تغيير POST إلى GET لحل خطأ 405
export async function GET(request) {
  try {
    const messages = await getTelegramMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
