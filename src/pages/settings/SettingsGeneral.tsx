import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIMEZONES = [
  'Africa/Luanda',
  'Europe/Lisbon',
  'Europe/London',
  'America/New_York',
  'America/Sao_Paulo',
];

const CURRENCIES = ['AOA', 'EUR', 'USD'];

const LOCALES = [
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
];

interface Props {
  gym: any;
  refreshGyms: () => void;
}

export default function SettingsGeneral({ gym, refreshGyms }: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: gym.name || '',
    logoUrl: gym.logo_url || '',
    timezone: gym.timezone || 'Africa/Luanda',
    locale: gym.locale || 'pt-PT',
    currency: gym.currency || 'AOA',
    vatNumber: gym.vat_number || '',
    defaultMembershipDuration: gym.default_membership_duration || 30,
    gracePeriodDays: gym.grace_period_days || 5,
    autoSuspendUnpaid: gym.auto_suspend_unpaid ?? true,
    brandColor: gym.brand_color || '#111827',
    invoiceFooter: gym.invoice_footer || '',
  });

  const update = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const uploadLogo = async (file: File) => {
    const path = `logos/${gym.id}.png`;
    await supabase.storage.from('gym-assets').upload(path, file, {
      upsert: true,
    });

    const { data } = supabase.storage
      .from('gym-assets')
      .getPublicUrl(path);

    update('logoUrl', data.publicUrl);
  };

  const save = async () => {
    setLoading(true);
    await supabase
      .from('gyms')
      .update({
        name: form.name,
        logo_url: form.logoUrl,
        timezone: form.timezone,
        locale: form.locale,
        currency: form.currency,
        vat_number: form.vatNumber,
        default_membership_duration: form.defaultMembershipDuration,
        grace_period_days: form.gracePeriodDays,
        auto_suspend_unpaid: form.autoSuspendUnpaid,
        brand_color: form.brandColor,
        invoice_footer: form.invoiceFooter,
      })
      .eq('id', gym.id);

    refreshGyms();
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Identity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identidade & Localização</h2>

        <div>
          <Label>Nome do Ginásio</Label>
          <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>

        <div>
          <Label>Logotipo</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && uploadLogo(e.target.files[0])}
          />
          {form.logoUrl && (
            <img src={form.logoUrl} className="h-16 mt-2" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Timezone</Label>
            <Select value={form.timezone} onValueChange={(v) => update('timezone', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Região</Label>
            <Select value={form.locale} onValueChange={(v) => update('locale', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Moeda</Label>
            <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>NIF / VAT</Label>
          <Input value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} />
        </div>
      </section>

      {/* Operational Rules */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Regras Operacionais</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            value={form.defaultMembershipDuration}
            onChange={(e) => update('defaultMembershipDuration', +e.target.value)}
            placeholder="Duração padrão (dias)"
          />
          <Input
            type="number"
            value={form.gracePeriodDays}
            onChange={(e) => update('gracePeriodDays', +e.target.value)}
            placeholder="Período de tolerância"
          />
        </div>

        <div className="flex items-center justify-between border p-4 rounded-lg">
          <span>Suspender automaticamente por falta de pagamento</span>
          <Switch
            checked={form.autoSuspendUnpaid}
            onCheckedChange={(v) => update('autoSuspendUnpaid', v)}
          />
        </div>
      </section>

      {/* Branding */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Branding</h2>

        <Input
          type="color"
          value={form.brandColor}
          onChange={(e) => update('brandColor', e.target.value)}
        />

        <Textarea
          placeholder="Texto do rodapé de faturas"
          value={form.invoiceFooter}
          onChange={(e) => update('invoiceFooter', e.target.value)}
        />
      </section>

      <Button onClick={save} disabled={loading}>
        Guardar alterações
      </Button>
    </div>
  );
}
