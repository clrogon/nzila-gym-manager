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

export default function Onboarding() {
  const { user } = useAuth();
  const { refreshGyms } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  };

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create the gym
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .insert({
          name: gymName,
          slug: generateSlug(gymName),
          phone,
          address,
          email: user.email,
        })
        .select()
        .single();

      if (gymError) throw gymError;

      // Assign user as gym owner
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          gym_id: gym.id,
          role: 'gym_owner',
        });

      if (roleError) throw roleError;

      await refreshGyms();
      toast({ title: 'Gym Created', description: 'Welcome to GymFlow!' });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating gym:', error);
      toast({ title: 'Error', description: 'Failed to create gym. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-display">Set Up Your Gym</CardTitle>
            <CardDescription>
              Let's get your gym ready to manage members
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateGym} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gym-name">Gym Name *</Label>
              <Input
                id="gym-name"
                placeholder="FitZone Gym"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+244 923 456 789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Rua da Samba, Luanda"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full gradient-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Gym'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Skip for now
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}