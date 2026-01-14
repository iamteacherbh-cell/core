'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  telegram_username: string | null;
  telegram_chat_id: string | null;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export default function TelegramChatPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب كل المستخدمين المرتبطين بتيليجرام
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, telegram_username, telegram_chat_id')
        .not('telegram_chat_id', 'is', null);

      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  // جلب رسائل المستخدم المحدد
  useEffect(() => {
    if (!selectedProfile) return;

    const fetchMessages = async () => {
      // أولاً، ابحث عن session_id للمستخدم
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', selectedProfile.id)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (session) {
        // ثانياً، جلب الرسائل من جدول الرسائل الموحد
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
        } else {
          setMessages(data || []);
        }
      }
    };
    fetchMessages();
  }, [selectedProfile]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full">
      {/* قائمة المستخدمين */}
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">محادثات تيليجرام</h2>
        {profiles.map(profile => (
          <Card
            key={profile.id}
            className={`mb-2 cursor-pointer transition-colors ${selectedProfile?.id === profile.id ? 'bg-accent' : ''}`}
            onClick={() => setSelectedProfile(profile)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>{profile.full_name || 'مستخدم غير معروف'}</span>
                <Badge variant="outline"><MessageCircle className="h-3 w-3" /></Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">@{profile.telegram_username}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* نافذة الدردشة */}
      <div className="flex-1 flex flex-col">
        {selectedProfile ? (
          <>
            <div className="p-4 border-b">
              <h3 className="font-semibold">{selectedProfile.full_name}</h3>
              <p className="text-sm text-muted-foreground">@{selectedProfile.telegram_username}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={`p-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            اختر محادثة لعرضها
          </div>
        )}
      </div>
    </div>
  );
}
