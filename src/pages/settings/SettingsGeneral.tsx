import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { RequirePermission } from '@/components/common/RequirePermission';
import { Save, Upload } from 'lucide-react';

const TIMEZONES = [
  'Africa/Luanda',
  'Africa/Johannesburg',
  'Europe/Lisbon',
  'Europe/London',
  'UTC',
];

const LOCALES = [
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
];

interface Gym {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  timezone: string | null;
  currency: string | null;
  logo_url: string | null;

  /* ADDITIVE FIELDS */
  locale?: string | null;
  vat_number?: string | null;
  default_membership_duration?: number | null;
  grace_period_days?: number | null;
  auto_suspend_unpaid?: boolean | null;
  brand_color?: string | null;
  invoice_footer?: string | null;
}

interface SettingsGeneralProps {
  gym: Gym;
  refreshGyms: () => Promise<void>;
}

export default function SettingsGeneral({ gym, refreshGyms }: SettingsGeneralProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /* EXISTING STATE */
  const [gymName, setGymName] = useState(gym.name);
  const [phone, setPhone] = useState(gym.phone || '');
  const [address, setAddress] = useState(gym.address || '');
  const [email, setEmail] = useState(gym.email || '');
  const [timezone, setTimezone] = useState(gym.timezone || 'Africa/Luanda');
  const [currency, setCurrency] = useState(gym.currency || 'AOA');
  const [logoUrl, setLogoUrl] = useState(gym.logo_url || '');

  /* NEW – ADDITIVE STATE */
  const [locale, setLocale] = useState(gym.locale || 'pt-PT');
  const [vatNumber, setVatNumber] = useState(gym.vat_number || '');
  const [defaultDuration, setDefaultDuration] = useState(
    gym.default_membership_duration || 30
  );
  const [gracePeriod, setGracePeriod] = useState(
    gym.grace_period_days || 5
  );
  const [autoSuspend, setAutoSuspend] = useState(
    gym.auto_suspend_unpaid ?? true
  );
  const [brandColor, setBrandColor] = useState(
    gym.brand_color || '#111827'
  );
  const [invoiceFooter, setInvoiceFooter] = useState(
    gym.invoice_footer || ''
  );

  useEffect(() => {
    setGymName(gym.name);
    setPhone(gym.phone || '');
    setAddress(gym.address || '');
    setEmail(gym.email || '');
    setTimezone(gym.timezone || 'Africa/Luanda');
    setCurrency(gym.currency || 'AOA');
    setLogoUrl(gym.logo_url || '');

    setLocale(gym.locale || 'pt-PT');
    setVatNumber(gym.vat_number || '');
    setDefaultDuration(gym.default_membership_duration || 30);
    setGracePeriod(gym.grace_period_days || 5);
    setAutoSuspend(gym.auto_suspend_unpaid ?? true);
    setBrandColor(gym.brand_color || '#111827');
    setInvoiceFooter(gym.invoice_footer || '');
  }, [gym]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gyms')
        .update({
          /* EXISTING */
          name: gymName,
          phone,
          address,
          email,
          timezone,
          currency,
          logo_url: logoUrl || null,

          /* ADDITIVE */
          locale,
          vat_number: vatNumber || null,
          default_membership_duration: defaultDuration,
          grace_period_days: gracePeriod,
          auto_suspend_unpaid: autoSuspend,
          brand_color: brandColor,
          invoice_footer: invoiceFooter || null,
        })
        .eq('id', gym.id);

      if (error) throw error;

      await refreshGyms();
      toast({
        title: 'Definições guardadas',
        description: 'As definições do ginásio foram atualizadas.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao guardar definições.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informação do Ginásio</CardTitle>
        <CardDescription>
          Configuração geral, regras operacionais e branding
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* LOGO (UNCHANGED) */}
        <div className="space-y-2">
          <Label>Logótipo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <Input
              placeholder="URL do logótipo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* BASIC INFO (UNCHANGED) */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Nome do Ginásio</Label>
            <Input value={gymName} onChange={(e) => setGymName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Morada</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* REGIONAL – EXTENSION */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Região</Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCALES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Moeda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AOA">AOA</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>NIF / VAT</Label>
          <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
        </div>

        <Separator />

        {/* OPERATIONAL RULES */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Duração padrão da mensalidade (dias)</Label>
            <Input type="number" value={defaultDuration} onChange={(e) => setDefaultDuration(+e.target.value)} />
          </div>
          <div>
            <Label>Período de tolerância (dias)</Label>
            <Input type="number" value={gracePeriod} onChange={(e) => setGracePeriod(+e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <span>Suspender automaticamente por falta de pagamento</span>
          <Switch checked={autoSuspend} onCheckedChange={setAutoSuspend} />
        </div>

        <Separator />

        {/* BRANDING */}
        <div className="space-y-2">
          <Label>Cor principal da marca</Label>
          <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
        </div>

        <div>
          <Label>Rodapé das faturas / recibos</Label>
          <Textarea
            value={invoiceFooter}
            onChange={(e) => setInvoiceFooter(e.target.value)}
            placeholder="Texto legal ou informativo"
          />
        </div>

        <RequirePermission permission="settings:update">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'A guardar...' : 'Guardar alterações'}
          </Button>
        </RequirePermission>
      </CardContent>
    </Card>
  );
}
