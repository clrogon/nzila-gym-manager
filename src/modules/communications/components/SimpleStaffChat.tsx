import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getStaffMessages, sendStaffMessage, markStaffMessageAsRead } from '@/services/communicationService';
import type { StaffMessage } from '@/types/communications';

interface SimpleStaffChatProps {
  selectedUserId: string | null;
  recipientName: string;
  recipientAvatar?: string;
}

export function SimpleStaffChat({ selectedUserId, recipientName, recipientAvatar }: SimpleStaffChatProps) {
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const loadMessages = async (userId: string) => {
    try {
      const data = await getStaffMessages(userId);
      const unreadMessages = data.filter(m => !m.is_read && m.recipient_id === 'current-user-id');
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(m => markStaffMessageAsRead(m.id));
      }
      
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    setLoading(true);
    try {
      const sentMessage = await sendStaffMessage({
        recipient_id: selectedUserId,
        message: newMessage,
      });
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            {recipientAvatar ? (
              <AvatarImage src={recipientAvatar} alt={recipientName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(recipientName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{recipientName}</h3>
            <p className="text-sm text-muted-foreground">Click to message</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === 'current-user-id';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {!isOwn && (
                    <Avatar className="flex-shrink-0">
                      {message.sender?.user_metadata?.avatar_url ? (
                        <AvatarImage
                          src={message.sender.user_metadata.avatar_url}
                          alt={message.sender.user_metadata.full_name || message.sender.email}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(
                          message.sender?.user_metadata?.full_name || message.sender.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[70%] ${isOwn ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), 'HH:mm')}
                      {isOwn && message.is_read && (
                        <span className="ml-2 text-green-500">✓✓</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !newMessage.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
