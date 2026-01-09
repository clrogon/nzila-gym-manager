import { useState, useEffect } from 'react';
import { MessageSquare, Users, Send, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGym } from '@/contexts/GymContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface StaffContact {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  online?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  isRead?: boolean;
}

interface WhatsAppMessage {
  id: string;
  memberName: string;
  memberPhone: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
}

const mockStaffContacts: StaffContact[] = [
  { id: '1', name: 'Sarah Johnson', role: 'Manager', avatar: '', online: true },
  { id: '2', name: 'Mike Chen', role: 'Trainer', avatar: '', online: true },
  { id: '3', name: 'Emma Wilson', role: 'Receptionist', avatar: '', online: false },
];

const mockChatMessages: ChatMessage[] = [
  { id: '1', senderId: '1', senderName: 'Sarah Johnson', message: 'Hey, can you check to schedule for tomorrow?', timestamp: new Date(Date.now() - 3600000), isOwn: false },
  { id: '2', senderId: 'me', senderName: 'Me', message: 'Sure! I\'ll look at it right now.', timestamp: new Date(Date.now() - 3000000), isOwn: true },
  { id: '3', senderId: '1', senderName: 'Sarah Johnson', message: 'Thanks! Also, AC in room 3 needs maintenance.', timestamp: new Date(Date.now() - 2400000), isOwn: false },
];

const mockWhatsAppMessages: WhatsAppMessage[] = [
  { id: '1', memberName: 'John Doe', memberPhone: '+1234567890', message: 'Reminder: Your membership expires in 5 days', status: 'delivered', timestamp: new Date(Date.now() - 7200000) },
  { id: '2', memberName: 'Jane Smith', memberPhone: '+1987654321', message: 'Your class booking for tomorrow is confirmed', status: 'sent', timestamp: new Date(Date.now() - 3600000) },
];

export default function CommunicationsPage() {
  const gymContext = useGym();
  const [activeTab, setActiveTab] = useState<'staff' | 'whatsapp'>('staff');
  const [selectedStaffContact, setSelectedStaffContact] = useState<StaffContact | null>(null);
  const [staffContacts, setStaffContacts] = useState<StaffContact[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [whatsappMessages, setWhatsAppMessages] = useState<WhatsAppMessage[]>([]);
  const [newWhatsAppMessage, setNewWhatsAppMessage] = useState('');

  useEffect(() => {
    setStaffContacts(mockStaffContacts);
    setChatMessages(mockChatMessages);
    setWhatsAppMessages(mockWhatsAppMessages);
  }, []);

  const handleSendStaffMessage = () => {
    if (!newMessage.trim() || !selectedStaffContact) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: 'Me',
      message: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };

    setChatMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  const handleSendWhatsApp = () => {
    if (!newWhatsAppMessage.trim()) return;

    alert(`WhatsApp integration would send: ${newWhatsAppMessage}\n\nNote: Configure your WhatsApp Business API in settings to enable this feature.`);
    setNewWhatsAppMessage('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        <div className="border-b p-4">
          <h1 className="text-2xl font-bold">Communications</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'staff' | 'whatsapp')} className="flex-1">
        <TabsList className="grid w-full grid-cols-2 border-b">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Internal Staff
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp (Members)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="flex-1 overflow-hidden">
          <div className="flex h-full">
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Staff Members</h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                  {staffContacts.map(contact => (
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
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.role}</p>
                      </div>
                      {contact.online && (
                        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedStaffContact ? (
                <>
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      {selectedStaffContact.avatar ? (
                        <img src={selectedStaffContact.avatar} alt={selectedStaffContact.name} className="w-full h-full object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(selectedStaffContact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedStaffContact.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStaffContact.role}</p>
                    </div>
                    <Badge variant="outline">Staff Chat</Badge>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[80%] ${
                            msg.isOwn ? 'ml-auto flex-row-reverse' : ''
                          }`}
                        >
                          {!msg.isOwn && (
                            <Avatar className="flex-shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {getInitials(msg.senderName)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className="flex-1">
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                msg.isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            <div
                              className={`text-xs text-muted-foreground mt-1 ${
                                msg.isOwn ? 'text-right' : ''
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                              {msg.isOwn && msg.isRead && (
                                <span className="ml-2 text-green-500">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSendStaffMessage(); }}
                    className="p-4 border-t"
                  >
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Select a staff member to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col p-6 max-w-4xl mx-auto">
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
                  <h3 className="font-semibold text-lg mb-3">Send WhatsApp Message</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Recipient</label>
                      <select className="w-full border rounded-md px-3 py-2">
                        <option value="">Select a member...</option>
                        <option value="1">John Doe (+1234567890)</option>
                        <option value="2">Jane Smith (+1987654321)</option>
                        <option value="3">Bob Johnson (+1555123456)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <textarea
                        value={newWhatsAppMessage}
                        onChange={(e) => setNewWhatsAppMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={4}
                        className="w-full border rounded-md px-3 py-2 resize-none"
                      />
                    </div>
                    <Button onClick={handleSendWhatsApp} disabled={!newWhatsAppMessage.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Send WhatsApp Message
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-3">Recent WhatsApp Messages</h3>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {whatsappMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No WhatsApp messages sent yet
                        </div>
                      ) : (
                        whatsappMessages.map(msg => (
                          <div
                            key={msg.id}
                            className="flex items-start gap-3 p-3 border rounded-lg"
                          >
                            <Avatar className="flex-shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {getInitials(msg.memberName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <p className="font-medium">{msg.memberName}</p>
                                  <p className="text-sm text-muted-foreground">{msg.memberPhone}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs border-0 ${getStatusColor(msg.status)} text-white`}
                                >
                                  {msg.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(msg.timestamp)}
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
                        ))
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
                      <h4 className="font-semibold mb-1">Setup WhatsApp Integration</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Configure your WhatsApp Business API credentials in Settings to enable real WhatsApp messaging for members.
                      </p>
                      <Button variant="outline" size="sm">
                        Go to Settings
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
