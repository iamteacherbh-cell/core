'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Send, Hash } from 'lucide-react';

// --- Types ---
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

interface ChannelMessage {
  id: string;
  channel_name: string;
  message_text: string;
  created_at: string;
}

// --- Main Component ---
export default function TelegramChatPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyText, setReplyText] = useState("");
  const [channelText, setChannelText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isSendingChannel, setIsSendingChannel] = useState(false);

  // معرف القناة الذي أرسلته لي
  const CHANNEL_ID = "-1003583611128";

  // 1. جلب كل المستخدمين المرتبطين بتيليجرام
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

  // 2. جلب رسائل المستخدم عند تحديده
  useEffect(() => {
    if (!selectedProfile) return;
    setMessages([]); // مسح الرسائل القديمة

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

  // 3. جلب رسائل القناة
  useEffect(() => {
    const fetchChannelMessages = async () => {
      const { data, error } = await supabase
        .from('channel_messages')
        .select('*')
        .eq('telegram_chat_id', CHANNEL_ID)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching channel messages:', error);
      } else {
        setChannelMessages(data || []);
      }
    };
    fetchChannelMessages();
  }, []);

  // --- Action Handlers ---
  const handleSendReply = async () => {
    if (!selectedProfile || !replyText.trim() || isSendingReply) return;
    setIsSendingReply(true);
    try {
      const res = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedProfile.telegram_chat_id, message: replyText.trim(), isChannel: false }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      setReplyText("");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSendToChannel = async () => {
    if (!channelText.trim() || isSendingChannel) return;
    setIsSendingChannel(true);
    try {
      const res = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: CHANNEL_ID, message: channelText.trim(), isChannel: true }),
      });
      if (!res.ok) throw new Error('Failed to send to channel');
      setChannelText("");
    } catch (error) {
      console.error("Error sending to channel:", error);
    } finally {
      setIsSendingChannel(false);
    }
  };


  // --- UI ---
  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full">
      {/* Column 1: User List */}
      <div className="w-1/3 border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5" /> محادثات تيليجرام</h2>
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

      {/* Column 2: Selected User Chat */}
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
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="اكتب ردًا..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSendingReply}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                />
                <Button onClick={handleSendReply} disabled={isSendingReply || !replyText.trim()}>
                  {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            اختر محادثة لعرضها
          </div>
        )}
      </div>

      {/* Column 3: Channel */}
      <div className="w-1/3 border-l p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
            <Hash className="h-5 w-5" />
            <h2 className="text-lg font-semibold">القناة</h2>
        </div>
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {channelMessages.map(msg => (
                <div key={msg.id} className="p-2 rounded-lg bg-muted">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{msg.channel_name}</p>
                    <p className="text-sm">{msg.message_text}</p>
                </div>
            ))}
        </div>
        <div className="border-t pt-4">
            <div className="flex gap-2">
                <Input
                    placeholder="أرسل إلى القناة..."
                    value={channelText}
                    onChange={(e) => setChannelText(e.target.value)}
                    disabled={isSendingChannel}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendToChannel()}
                />
                <Button onClick={handleSendToChannel} disabled={isSendingChannel || !channelText.trim()}>
                    {isSendingChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
