// src/pages/UserProfile.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Save, Loader2 } from 'lucide-react';

export default function UserProfile() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<any>(null);

  // Personal Info State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    if (user && currentGym) {
      fetchMemberData();
    }
  }, [user, currentGym]);

  const fetchMemberData = async () => {
    if (!user || !currentGym) return;

    setLoading(true);
    try {
      const { data: memberData, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (error) throw error;

      if (memberData) {
        setMember(memberData);
        setFullName(memberData.full_name || '');
        setEmail(memberData.email || user.email || '');
        setPhone(memberData.phone || '');
        setDateOfBirth(memberData.date_of_birth || '');
        setAddress(memberData.address || '');
        setPhotoUrl(memberData.photo_url || '');
      } else {
        // Use auth user data if no member record
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || '');
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !currentGym) return;

    setSaving(true);
    try {
      if (member) {
        // Update existing member
        const { error } = await supabase
          .from('members')
          .update({
            full_name: fullName,
            email,
            phone,
            date_of_birth: dateOfBirth || null,
            address,
            photo_url: photoUrl || null,
          })
          .eq('id', member.id);

        if (error) throw error;
      }

      // Also update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email,
          phone,
          avatar_url: photoUrl || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Perfil atualizado com sucesso');
      fetchMemberData();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
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
            <AvatarFallback className="text-xl">
              {getInitials(fullName || email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{fullName || 'Meu Perfil'}</h1>
            <p className="text-muted-foreground">{email}</p>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Informações Pessoais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações de contato e dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+244 999 999 999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Seu endereço"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl">URL da Foto</Label>
                  <Input
                    id="photoUrl"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
