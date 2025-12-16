import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  gym: any;
  refreshGyms: () => void;
}

export default function SettingsGeneral({ gym, refreshGyms }: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: gym.name || '',
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

  const save = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('gyms')
      .update({
        name: form.name,
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

    if (!error) refreshGyms();
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Identity & Localisation */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identidade & Localização</h2>

        <div className="space-y-2">
          <Label>Nome do Ginásio</Label>
          <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Timezone</Label>
            <Input
              placeholder="Africa/Luanda"
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
            />
          </div>

          <div>
            <Label>Locale</Label>
            <Input
              placeholder="pt-PT"
              value={form.locale}
              onChange={(e) => update('locale', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Moeda</Label>
            <Input value={form.currency} disabled />
          </div>

          <div>
            <Label>NIF / VAT</Label>
            <Input
              placeholder="0000000000"
              value={form.vatNumber}
              onChange={(e) => update('vatNumber', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Operational Rules */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Regras Operacionais</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Duração padrão do plano (dias)</Label>
            <Input
              type="number"
              value={form.defaultMembershipDuration}
              onChange={(e) => update('defaultMembershipDuration', Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Período de tolerância (dias)</Label>
            <Input
              type="number"
              value={form.gracePeriodDays}
              onChange={(e) => update('gracePeriodDays', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">Suspensão automática por falta de pagamento</p>
            <p className="text-sm text-muted-foreground">
              Bloqueia acesso após o período de tolerância
            </p>
          </div>
          <Switch
            checked={form.autoSuspendUnpaid}
            onCheckedChange={(v) => update('autoSuspendUnpaid', v)}
          />
        </div>
      </section>

      {/* Branding */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Branding & Comunicação</h2>

        <div>
          <Label>Cor principal</Label>
          <Input
            type="color"
            value={form.brandColor}
            onChange={(e) => update('brandColor', e.target.value)}
            className="h-10 w-24 p-1"
          />
        </div>

        <div>
          <Label>Rodapé de faturas / recibos</Label>
          <Textarea
            placeholder="Obrigado pela sua preferência."
            value={form.invoiceFooter}
            onChange={(e) => update('invoiceFooter', e.target.value)}
          />
        </div>
      </section>

      <Button onClick={save} disabled={loading}>
        Guardar alterações
      </Button>
    </div>
  );
}
