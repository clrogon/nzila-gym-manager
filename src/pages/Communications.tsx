import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Users, Send, MoreVertical, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getStaffMessages,
  sendStaffMessage,
  sendWhatsAppMessage,
  getWhatsAppHistory,
} from '@/services/communicationService';
import type { StaffMessage, WhatsAppMessage } from '@/types/communications';

interface StaffContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  online?: boolean;
}

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export default function CommunicationsPage() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'staff' | 'whatsapp'>('staff');
  
  // Staff chat state
  const [staffContacts, setStaffContacts] = useState<StaffContact[]>([]);
  const [selectedStaffContact, setSelectedStaffContact] = useState<StaffContact | null>(null);
  const [chatMessages, setChatMessages] = useState<StaffMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // WhatsApp state
  const [members, setMembers] = useState<Member[]>([]);
  const [whatsappMessages, setWhatsAppMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [newWhatsAppMessage, setNewWhatsAppMessage] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Fetch staff members from user_roles
  const fetchStaffContacts = useCallback(async () => {
    if (!currentGym?.id) return;
    
    setLoadingStaff(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, is_trainer')
        .eq('gym_id', currentGym.id)
        .neq('user_id', user?.id); // Exclude current user

      if (error) throw error;

      // Map to staff contacts
      const contacts: StaffContact[] = (data || []).map((ur) => ({
        id: ur.id,
        user_id: ur.user_id,
        name: `Staff Member`, // We don't have names in user_roles
        email: '',
        role: ur.role || (ur.is_trainer ? 'Trainer' : 'Staff'),
        online: false,
      }));

      setStaffContacts(contacts);
    } catch (err) {
      console.error('Error fetching staff:', err);
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  }, [currentGym?.id, user?.id]);

  // Fetch members for WhatsApp
  const fetchMembers = useCallback(async () => {
    if (!currentGym?.id) return;
    
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, phone, email')
        .eq('gym_id', currentGym.id)
        .not('phone', 'is', null)
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  }, [currentGym?.id]);

  // Fetch messages for selected staff contact
  const fetchMessages = useCallback(async () => {
    if (!selectedStaffContact) return;
    
    setLoadingMessages(true);
    try {
      const messages = await getStaffMessages(selectedStaffContact.user_id);
      setChatMessages(messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedStaffContact]);

  // Fetch WhatsApp history
  const fetchWhatsAppHistory = useCallback(async () => {
    try {
      const messages = await getWhatsAppHistory();
      setWhatsAppMessages(messages);
    } catch (err) {
      console.error('Error fetching WhatsApp history:', err);
    }
  }, []);

  useEffect(() => {
    fetchStaffContacts();
    fetchMembers();
    fetchWhatsAppHistory();
  }, [fetchStaffContacts, fetchMembers, fetchWhatsAppHistory]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentGym?.id || !user?.id) return;

    const channel = supabase
      .channel('staff_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_messages',
          filter: `gym_id=eq.${currentGym.id}`,
        },
        (payload) => {
          const newMsg = payload.new as StaffMessage;
          // Only add if it's part of the current conversation
          if (
            selectedStaffContact &&
            (newMsg.sender_id === selectedStaffContact.user_id ||
              newMsg.recipient_id === selectedStaffContact.user_id)
          ) {
            setChatMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGym?.id, user?.id, selectedStaffContact]);

  const handleSendStaffMessage = async () => {
    if (!newMessage.trim() || !selectedStaffContact) return;

    setSendingMessage(true);
    try {
      await sendStaffMessage({
        recipient_id: selectedStaffContact.user_id,
        message: newMessage,
      });
      setNewMessage('');
      // Refresh messages
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!newWhatsAppMessage.trim()) return;

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    
    setSendingWhatsApp(true);
    try {
      await sendWhatsAppMessage({
        member_id: selectedMemberId || undefined,
        phone_number: selectedMember?.phone || undefined,
        message: newWhatsAppMessage,
      });
      toast.success('WhatsApp message queued');
      setNewWhatsAppMessage('');
      setSelectedMemberId('');
      await fetchWhatsAppHistory();
    } catch (err) {
      console.error('Error sending WhatsApp:', err);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'sent':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold">Communications</h1>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'staff' | 'whatsapp')}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 border-b rounded-none">
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Internal Staff
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp (Members)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Staff List */}
              <div className="w-80 border-r flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg">Staff Members</h2>
                </div>
                <ScrollArea className="flex-1">
                  {loadingStaff ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : staffContacts.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">
                      No other staff members found
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {staffContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedStaffContact(contact)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            selectedStaffContact?.id === contact.id
                              ? 'bg-accent'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {contact.role}
                            </p>
                          </div>
                          {contact.online && (
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedStaffContact ? (
                  <>
                    <div className="p-4 border-b flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(selectedStaffContact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {selectedStaffContact.name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedStaffContact.role}
                        </p>
                      </div>
                      <Badge variant="outline">Staff Chat</Badge>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((msg) => {
                            const isOwn = msg.sender_id === user?.id;
                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[80%] ${
                                  isOwn ? 'ml-auto flex-row-reverse' : ''
                                }`}
                              >
                                {!isOwn && (
                                  <Avatar className="flex-shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                      {getInitials(selectedStaffContact.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}

                                <div className="flex-1">
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${
                                      isOwn
                                        ? 'bg-primary text-primary-foreground rounded-br-md'
                                        : 'bg-muted rounded-bl-md'
                                    }`}
                                  >
                                    <p className="break-words whitespace-pre-wrap">
                                      {msg.message}
                                    </p>
                                  </div>
                                  <div
                                    className={`text-xs text-muted-foreground mt-1 ${
                                      isOwn ? 'text-right' : ''
                                    }`}
                                  >
                                    {formatTime(msg.created_at)}
                                    {isOwn && msg.is_read && (
                                      <span className="ml-2 text-green-500">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendStaffMessage();
                      }}
                      className="p-4 border-t"
                    >
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                          disabled={sendingMessage}
                        />
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || sendingMessage}
                        >
                          {sendingMessage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">
                        Select a staff member to start chatting
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex flex-col p-6 max-w-4xl mx-auto overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      WhatsApp Integration
                    </div>
                    <Badge variant="outline" className="text-sm">
                      Business API Required
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      Send WhatsApp Message
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Recipient
                        </label>
                        {loadingMembers ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading members...
                          </div>
                        ) : (
                          <select
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 bg-background"
                          >
                            <option value="">Select a member...</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.full_name} ({member.phone})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Message
                        </label>
                        <textarea
                          value={newWhatsAppMessage}
                          onChange={(e) => setNewWhatsAppMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={4}
                          className="w-full border rounded-md px-3 py-2 resize-none bg-background"
                        />
                      </div>
                      <Button
                        onClick={handleSendWhatsApp}
                        disabled={!newWhatsAppMessage.trim() || !selectedMemberId || sendingWhatsApp}
                      >
                        {sendingWhatsApp ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send WhatsApp Message
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-lg mb-3">
                      Recent WhatsApp Messages
                    </h3>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-3">
                        {whatsappMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            No WhatsApp messages sent yet
                          </div>
                        ) : (
                          whatsappMessages.map((msg) => {
                            const member = members.find(
                              (m) => m.id === msg.member_id
                            );
                            return (
                              <div
                                key={msg.id}
                                className="flex items-start gap-3 p-3 border rounded-lg"
                              >
                                <Avatar className="flex-shrink-0">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    {getInitials(member?.full_name || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div>
                                      <p className="font-medium">
                                        {member?.full_name || 'Unknown'}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {msg.phone_number}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs border-0 ${getStatusColor(
                                        msg.status
                                      )} text-white`}
                                    >
                                      {msg.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-sm">{msg.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTime(msg.created_at)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-shrink-0 opacity-0 hover:opacity-100"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">
                          Setup WhatsApp Integration
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Configure your WhatsApp Business API credentials in
                          Settings to enable real WhatsApp messaging for members.
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/settings">Go to Settings</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
