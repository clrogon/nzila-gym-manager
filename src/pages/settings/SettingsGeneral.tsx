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
  locale: string | null;
  currency: string | null;
  vat_number: string | null;
  logo_url: string | null;
  default_membership_days: number | null;
  grace_period_days: number | null;
  auto_suspend_unpaid: boolean | null;
  primary_color: string | null;
  invoice_footer: string | null;
}

interface SettingsGeneralProps {
  gym: Gym;
  refreshGyms: () => Promise<void>;
}

export default function SettingsGeneral({ gym, refreshGyms }: SettingsGeneralProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Basic info
  const [gymName, setGymName] = useState(gym.name);
  const [phone, setPhone] = useState(gym.phone || '');
  const [address, setAddress] = useState(gym.address || '');
  const [email, setEmail] = useState(gym.email || '');
  const [logoUrl, setLogoUrl] = useState(gym.logo_url || '');
  
  // Identity & localisation
  const [timezone, setTimezone] = useState(gym.timezone || 'Africa/Luanda');
  const [locale, setLocale] = useState(gym.locale || 'pt-PT');
  const [currency, setCurrency] = useState(gym.currency || 'AOA');
  const [vatNumber, setVatNumber] = useState(gym.vat_number || '');

  // Operational rules
  const [defaultMembership, setDefaultMembership] = useState(gym.default_membership_days?.toString() || '30');
  const [gracePeriod, setGracePeriod] = useState(gym.grace_period_days?.toString() || '3');
  const [autoSuspend, setAutoSuspend] = useState(gym.auto_suspend_unpaid || false);

  // Branding
  const [primaryColor, setPrimaryColor] = useState(gym.primary_color || '#000000');
  const [invoiceFooter, setInvoiceFooter] = useState(gym.invoice_footer || '');

  useEffect(() => {
    setGymName(gym.name);
    setPhone(gym.phone || '');
    setAddress(gym.address || '');
    setEmail(gym.email || '');
    setLogoUrl(gym.logo_url || '');
    setTimezone(gym.timezone || 'Africa/Luanda');
    setLocale(gym.locale || 'pt-PT');
    setCurrency(gym.currency || 'AOA');
    setVatNumber(gym.vat_number || '');
    setDefaultMembership(gym.default_membership_days?.toString() || '30');
    setGracePeriod(gym.grace_period_days?.toString() || '3');
    setAutoSuspend(gym.auto_suspend_unpaid || false);
    setPrimaryColor(gym.primary_color || '#000000');
    setInvoiceFooter(gym.invoice_footer || '');
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
          logo_url: logoUrl || null,
          timezone,
          locale,
          currency,
          vat_number: vatNumber || null,
          default_membership_days: parseInt(defaultMembership),
          grace_period_days: parseInt(gracePeriod),
          auto_suspend_unpaid: autoSuspend,
          primary_color: primaryColor,
          invoice_footer: invoiceFooter || null,
        })
        .eq('id', gym.id);

      if (error) throw error;
      await refreshGyms();
      toast({ title: 'Definições Guardadas', description: 'As definições do ginásio foram atualizadas.' });
    } catch (error) {
      console.error('Erro ao guardar definições:', error);
      toast({ title: 'Erro', description: 'Falha ao guardar definições.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informação do Ginásio</CardTitle>
        <CardDescription>Atualize a informação básica, identidade e regras operacionais do ginásio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logótipo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
              {logoUrl ? (
                <img src={logoUrl} alt="Logótipo do ginásio" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <Input placeholder="URL do Logótipo" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* Identity & Localisation */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome do Ginásio *</Label>
            <Input value={gymName} onChange={e => setGymName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input placeholder="+244 923 456 789" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Morada</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Luanda">Africa/Luanda (WAT)</SelectItem>
                <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                <SelectItem value="Europe/Lisbon">Europe/Lisbon (WET)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Localização / Locale</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-PT">pt-PT</SelectItem>
                <SelectItem value="en-US">en-US</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Moeda Padrão</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AOA">AOA - Kwanza</SelectItem>
                <SelectItem value="USD">USD - Dólar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="ZAR">ZAR - Rand</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>NIF / VAT</Label>
            <Input value={vatNumber} onChange={e => setVatNumber(e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* Operational rules */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Duração padrão da subscrição (dias)</Label>
            <Input type="number" value={defaultMembership} onChange={e => setDefaultMembership(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Período de tolerância (dias)</Label>
            <Input type="number" value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-center gap-2">
            <Label>Suspender automaticamente em pagamentos em atraso</Label>
            <Input type="checkbox" checked={autoSuspend} onChange={e => setAutoSuspend(e.target.checked)} />
          </div>
        </div>

        <Separator />

        {/* Branding */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Cor Principal da Marca</Label>
            <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto do rodapé em faturas / recibos</Label>
            <Input value={invoiceFooter} onChange={e => setInvoiceFooter(e.target.value)} />
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
