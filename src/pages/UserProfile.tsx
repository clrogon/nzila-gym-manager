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
  User, Bell, Lock, Camera, Mail, Phone, 
  MapPin, Calendar, Save, Shield, Loader2 
} from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);

  // Personal Info State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('members');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [classReminders, setClassReminders] = useState(true);
  const [membershipReminders, setMembershipReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [reminderDays, setReminderDays] = useState('7');

  useEffect(() => {
    if (user && currentGym) {
      fetchMemberData();
      fetchPreferences();
    }
  }, [user, currentGym]);

  const fetchMemberData = async () => {
    if (!user || !currentGym) return;

    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .single();

      if (memberData) {
        setMember(memberData);
        setFullName(memberData.full_name || '');
        setEmail(memberData.email || user.email || '');
        setPhone(memberData.phone || '');
        setDateOfBirth(memberData.date_of_birth || '');
        setAddress(memberData.address || '');
        setBio(memberData.bio || '');
        setPhotoUrl(memberData.photo_url || '');
        setProfileVisibility(memberData.profile_visibility || 'members');
        setShowEmail(memberData.show_email_public || false);
        setShowPhone(memberData.show_phone_public || false);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };

  const fetchPreferences = async () => {
    if (!user || !currentGym) return;

    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (data) {
        setPreferences(data);
        setEmailNotifications(data.email_notifications ?? true);
        setSmsNotifications(data.sms_notifications ?? false);
        setClassReminders(data.class_reminders ?? true);
        setMembershipReminders(data.membership_reminders ?? true);
        setPaymentReminders(data.payment_reminders ?? true);
        setReminderDays(String(data.reminder_days_before || 7));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSavePersonal = async () => {
    if (!member || !currentGym) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          full_name: fullName,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          bio: bio || null,
          photo_url: photoUrl || null,
          profile_visibility: profileVisibility,
          show_email_public: showEmail,
          show_phone_public: showPhone,
        })
        .eq('id', member.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso');
      fetchMemberData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user || !currentGym) return;

    setLoading(true);
    try {
      const prefData = {
        user_id: user.id,
        gym_id: currentGym.id,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        class_reminders: classReminders,
        membership_reminders: membershipReminders,
        payment_reminders: paymentReminders,
        reminder_days_before: parseInt(reminderDays),
      };

      const { error } = preferences
        ? await supabase
            .from('user_preferences')
            .update(prefData)
            .eq('id', preferences.id)
        : await supabase.from('user_preferences').insert(prefData);

      if (error) throw error;

      toast.success('Preferências guardadas');
      fetchPreferences();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao guardar preferências');
    } finally {
      setLoading(false);
    }
  };

  if (!member) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerir informações pessoais e preferências</p>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="w-4 h-4 mr-2" />
              Pessoal
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-2" />
              Privacidade
            </TabsTrigger>
          </TabsList>

          {/* Personal Info */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informação Pessoal</CardTitle>
                <CardDescription>Atualize os seus dados pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="text-2xl">
                      {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label>URL da Foto</Label>
                    <Input
                      placeholder="https://..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o URL de uma imagem
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="dob"
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
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Conte-nos um pouco sobre si..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSavePersonal} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como deseja ser notificado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
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
                    <div>
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
                    <div>
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
                    <div>
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
                </div>

                <Button onClick={handleSavePreferences} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Definições de Privacidade</CardTitle>
                <CardDescription>Controle quem pode ver as suas informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Visibilidade do Perfil</Label>
                  <Select
                    value={profileVisibility}
                    onValueChange={setProfileVisibility}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="members">Apenas Membros</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controle quem pode ver o seu perfil
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar Email</p>
                    <p className="text-sm text-muted-foreground">
                      Outros membros podem ver o seu email
                    </p>
                  </div>
                  <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar Telefone</p>
                    <p className="text-sm text-muted-foreground">
                      Outros membros podem ver o seu telefone
                    </p>
                  </div>
                  <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                </div>

                <Button onClick={handleSavePersonal} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar Definições
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
