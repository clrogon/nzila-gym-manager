// src/pages/Onboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Onboarding() {
  const { user } = useAuth();
  const { refreshGyms } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // ==========================
  // Funções auxiliares
  // ==========================
  
  const normalizePhone = (phone: string) => phone.replace(/\s+/g, '');

  const generateSlug = (name: string) => {
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${baseSlug}-${uuidv4().slice(0, 8)}`;
  };

  const createGym = async () => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .insert({
        name: gymName,
        slug: generateSlug(gymName),
        phone: normalizePhone(phone),
        address,
        email: user.email,
      })
      .select()
      .single();

    if (gymError) throw gymError;
    return gym;
  };

  const assignOwnerRole = async (gymId: string) => {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user!.id,
        gym_id: gymId,
        role: 'gym_owner',
      });

    if (roleError) throw roleError;
  };

  // ==========================
  // Handler principal
  // ==========================
  
  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) {
      toast({ title: 'Erro', description: 'O nome da ginásio é obrigatório', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const gym = await createGym();
      await assignOwnerRole(gym.id);
      await refreshGyms();
      toast({ title: 'Ginásio criado', description: 'Bem-vindo ao Nzila!' });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar ginásio:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar ginásio. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // JSX
  // ==========================
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-fade-in glass">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Configure a sua Ginásio</CardTitle>
            <CardDescription>
              Vamos preparar o seu ginásio para gerir os membros
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateGym} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gym-name">Nome do Ginásio *</Label>
              <Input
                id="gym-name"
                placeholder="FitZone Gym"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+244 923 456 789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua da Samba, Luanda"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full gradient-primary" disabled={loading}>
              {loading ? 'A criar...' : 'Criar Ginásio'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full mt-2"
              onClick={() => navigate('/dashboard')}
            >
              Ignorar por agora
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
