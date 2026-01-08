import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  User, Bell, Shield, Mail, Phone, 
  MapPin, Calendar, Save, Loader2, Key
} from 'lucide-react';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';

interface UserPreferences {
  id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  class_reminders: boolean;
  membership_reminders: boolean;
  payment_reminders: boolean;
  marketing_emails: boolean;
  reminder_days_before: number;
}

export default function UserProfile() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Personal Info State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [classReminders, setClassReminders] = useState(true);
  const [membershipReminders, setMembershipReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [reminderDays, setReminderDays] = useState('7');

  useEffect(() => {
    if (user && currentGym) {
      fetchData();
    }
  }, [user, currentGym]);

  const fetchData = async () => {
    if (!user || !currentGym) return;

    setLoading(true);
    try {
      // Fetch member data
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);
        setFullName(memberData.full_name || '');
        setEmail(memberData.email || user.email || '');
        setPhone(memberData.phone || '');
        setDateOfBirth(memberData.date_of_birth || '');
        setAddress(memberData.address || '');
        setPhotoUrl(memberData.photo_url || '');
        setEmergencyContact(memberData.emergency_contact || '');
        setEmergencyPhone(memberData.emergency_phone || '');
      } else {
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
      }

      // Fetch preferences
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (prefData) {
        setPreferences(prefData);
        setEmailNotifications(prefData.email_notifications ?? true);
        setSmsNotifications(prefData.sms_notifications ?? false);
        setClassReminders(prefData.class_reminders ?? true);
        setMembershipReminders(prefData.membership_reminders ?? true);
        setPaymentReminders(prefData.payment_reminders ?? true);
        setMarketingEmails(prefData.marketing_emails ?? false);
        setReminderDays(String(prefData.reminder_days_before || 7));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !currentGym) return;

    setSaving(true);
    try {
      if (member) {
        const { error } = await supabase
          .from('members')
          .update({
            full_name: fullName,
            phone: phone || null,
            date_of_birth: dateOfBirth || null,
            address: address || null,
            photo_url: photoUrl || null,
            emergency_contact: emergencyContact || null,
            emergency_phone: emergencyPhone || null,
          })
          .eq('id', member.id);

        if (error) throw error;
      }

      // Update profile table
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          avatar_url: photoUrl || null,
        })
        .eq('id', user.id);

      toast.success('Perfil atualizado com sucesso');
      fetchData();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user || !currentGym) return;

    setSaving(true);
    try {
      const prefData = {
        user_id: user.id,
        gym_id: currentGym.id,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        class_reminders: classReminders,
        membership_reminders: membershipReminders,
        payment_reminders: paymentReminders,
        marketing_emails: marketingEmails,
        reminder_days_before: parseInt(reminderDays),
      };

      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update(prefData)
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_preferences')
          .insert(prefData);

        if (error) throw error;
      }

      toast.success('Preferências guardadas');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchData();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao guardar preferências');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={photoUrl} alt={fullName} />
            <AvatarFallback className="text-xl bg-primary/10">
              {getInitials(fullName || email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{fullName || 'Meu Perfil'}</h1>
            <p className="text-muted-foreground">{email}</p>
            {member?.status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {member.status === 'active' ? 'Ativo' : member.status}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Pessoal</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize os seus dados pessoais e informações de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo and Name */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="photoUrl">URL da Foto</Label>
                    <Input
                      id="photoUrl"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">Cole o URL de uma imagem de perfil</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="O seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        className="pl-10"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+244 923 456 789"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Morada</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="A sua morada"
                      className="pl-10 min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Contacto de Emergência</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Nome</Label>
                      <Input
                        id="emergencyContact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="Nome do contacto de emergência"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Telefone</Label>
                      <Input
                        id="emergencyPhone"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+244 923 456 789"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como deseja ser notificado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Notificações por SMS</p>
                    <p className="text-sm text-muted-foreground">Receber mensagens de texto</p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium">Lembretes Automáticos</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Lembretes de Aulas</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar antes das aulas reservadas
                      </p>
                    </div>
                    <Switch
                      checked={classReminders}
                      onCheckedChange={setClassReminders}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Expiração de Subscrição</p>
                      <p className="text-sm text-muted-foreground">
                        Alertar quando a subscrição estiver a expirar
                      </p>
                    </div>
                    <Switch
                      checked={membershipReminders}
                      onCheckedChange={setMembershipReminders}
                    />
                  </div>

                  {membershipReminders && (
                    <div className="ml-6 space-y-2">
                      <Label>Dias antes da expiração</Label>
                      <Select value={reminderDays} onValueChange={setReminderDays}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 dia</SelectItem>
                          <SelectItem value="3">3 dias</SelectItem>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="14">14 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Lembretes de Pagamento</p>
                      <p className="text-sm text-muted-foreground">
                        Enviar lembretes para pagamentos pendentes
                      </p>
                    </div>
                    <Switch
                      checked={paymentReminders}
                      onCheckedChange={setPaymentReminders}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Emails de Marketing</p>
                      <p className="text-sm text-muted-foreground">
                        Receber novidades e promoções
                      </p>
                    </div>
                    <Switch
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePreferences} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>Gerir a segurança da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                      Verificado
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <p className="font-medium">Palavra-passe</p>
                      <p className="text-sm text-muted-foreground">
                        Altere a sua palavra-passe regularmente para maior segurança
                      </p>
                    </div>
                    <ChangePasswordDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4 mr-2" />
                          Alterar
                        </Button>
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <p className="font-medium">Sessões Ativas</p>
                      <p className="text-sm text-muted-foreground">
                        Gerir dispositivos conectados
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Ver Sessões
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-destructive mb-2">Zona de Perigo</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ações irreversíveis relacionadas com a sua conta
                  </p>
                  <Button variant="destructive" size="sm" disabled>
                    Eliminar Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}