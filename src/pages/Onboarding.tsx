// src/pages/Onboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowRight } from 'lucide-react';
// Use native crypto for UUID generation

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
  // Helpers
  // ==========================
  const normalizePhone = (value: string) => value.replace(/\s+/g, '');

  const generateSlug = (name: string) => {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  };

  const createGym = async () => {
    if (!user) throw new Error('Utilizador não autenticado');

    const { data, error } = await supabase
      .from('gyms')
      .insert({
        name: gymName.trim(),
        slug: generateSlug(gymName),
        phone: normalizePhone(phone),
        address,
        email: user.email,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const assignOwnerRole = async (gymId: string) => {
    const { error } = await supabase.from('user_roles').insert({
      user_id: user!.id,
      gym_id: gymId,
      role: 'gym_owner',
    });

    if (error) throw error;
  };

  // ==========================
  // Submit
  // ==========================
  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gymName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Introduza o nome do ginásio para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const gym = await createGym();
      await assignOwnerRole(gym.id);
      await refreshGyms();

      toast({
        title: 'Ginásio criado com sucesso',
        description: 'Bem-vindo ao Nzila.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao criar ginásio',
        description:
          error.message || 'Ocorreu um problema. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // UI
  // ==========================
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-display">
              Configurar o seu ginásio
            </CardTitle>
            <CardDescription>
              Este é o primeiro passo para gerir membros, presenças e pagamentos
              no Nzila.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateGym} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gym-name">Nome do ginásio *</Label>
              <Input
                id="gym-name"
                placeholder="Ex: FitZone Luanda"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+244 923 456 789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua da Samba, Luanda"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary"
              disabled={loading}
            >
              {loading ? 'A criar ginásio…' : 'Criar ginásio'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => navigate('/dashboard')}
            >
              Configurar mais tarde
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
