import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RequirePermission } from '@/components/common/RequirePermission';
import { Save, Upload } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  timezone: string | null;
  currency: string | null;
  logo_url: string | null;
}

interface SettingsGeneralProps {
  gym: Gym;
  refreshGyms: () => Promise<void>;
}

export default function SettingsGeneral({ gym, refreshGyms }: SettingsGeneralProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [gymName, setGymName] = useState(gym.name);
  const [phone, setPhone] = useState(gym.phone || '');
  const [address, setAddress] = useState(gym.address || '');
  const [email, setEmail] = useState(gym.email || '');
  const [timezone, setTimezone] = useState(gym.timezone || 'Africa/Luanda');
  const [currency, setCurrency] = useState(gym.currency || 'AOA');
  const [logoUrl, setLogoUrl] = useState(gym.logo_url || '');

  useEffect(() => {
    setGymName(gym.name);
    setPhone(gym.phone || '');
    setAddress(gym.address || '');
    setEmail(gym.email || '');
    setTimezone(gym.timezone || 'Africa/Luanda');
    setCurrency(gym.currency || 'AOA');
    setLogoUrl(gym.logo_url || '');
  }, [gym]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gyms')
        .update({
          name: gymName,
          phone,
          address,
          email,
          timezone,
          currency,
          logo_url: logoUrl || null,
        })
        .eq('id', gym.id);

      if (error) throw error;

      await refreshGyms();
      toast({ 
        title: 'Definições Guardadas', 
        description: 'As definições do ginásio foram atualizadas.' 
      });
    } catch (error) {
      console.error('Erro ao guardar definições:', error);
      toast({ 
        title: 'Erro', 
        description: 'Falha ao guardar definições.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informação do Ginásio</CardTitle>
        <CardDescription>Atualize a informação básica e marca do seu ginásio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logótipo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logótipo do ginásio" 
                  className="w-full h-full object-cover rounded-lg" 
                />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Input
                placeholder="URL do Logótipo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Insira um URL para o logótipo do ginásio ou carregue uma imagem
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Basic Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gymName">Nome do Ginásio *</Label>
            <Input
              id="gymName"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+244 923 456 789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Morada</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Regional Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Luanda">Africa/Luanda (WAT)</SelectItem>
                <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                <SelectItem value="Europe/Lisbon">Europe/Lisbon (WET)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AOA">AOA - Kwanza Angolano</SelectItem>
                <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="ZAR">ZAR - Rand Sul-Africano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <RequirePermission permission="settings:update">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </RequirePermission>
      </CardContent>
    </Card>
  );
}
