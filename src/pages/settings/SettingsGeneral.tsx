import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { Save, Upload, Loader2 } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  timezone?: string | null;
  locale?: string | null;
  currency?: string | null;
  vat_number?: string | null;
  logo_url?: string | null;
  default_membership_days?: number | null;
  grace_period_days?: number | null;
  auto_suspend_unpaid?: boolean | null;
  primary_color?: string | null;
  invoice_footer?: string | null;
}

interface SettingsGeneralProps {
  gym: Gym;
  refreshGyms: () => Promise<void>;
}

export default function SettingsGeneral({ gym, refreshGyms }: SettingsGeneralProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const canEdit = hasPermission('settings:update');

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
  const [defaultMembership, setDefaultMembership] = useState(
    gym.default_membership_days?.toString() || '30'
  );
  const [gracePeriod, setGracePeriod] = useState(
    gym.grace_period_days?.toString() || '3'
  );
  const [autoSuspend, setAutoSuspend] = useState(
    gym.auto_suspend_unpaid ?? false
  );

  // Branding
  const [primaryColor, setPrimaryColor] = useState(
    gym.primary_color || '#000000'
  );
  const [invoiceFooter, setInvoiceFooter] = useState(
    gym.invoice_footer || ''
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setAutoSuspend(gym.auto_suspend_unpaid ?? false);
    setPrimaryColor(gym.primary_color || '#000000');
    setInvoiceFooter(gym.invoice_footer || '');
    setHasChanges(false);
    setErrors({});
  }, [gym]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Gym name validation
    if (!gymName.trim()) {
      newErrors.gymName = 'Nome é obrigatório';
    } else if (gymName.trim().length < 2) {
      newErrors.gymName = 'Nome deve ter pelo menos 2 caracteres';
    } else if (gymName.trim().length > 100) {
      newErrors.gymName = 'Nome não pode exceder 100 caracteres';
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Phone validation
    if (phone && !/^\+?[\d\s\-()]{7,20}$/.test(phone)) {
      newErrors.phone = 'Formato de telefone inválido';
    }

    // VAT number validation (if provided)
    if (vatNumber && !/^[\dA-Z]{5,20}$/.test(vatNumber)) {
      newErrors.vatNumber = 'NIF deve conter 5-20 caracteres alfanuméricos';
    }

    // Default membership days validation
    const membershipDays = parseInt(defaultMembership, 10);
    if (isNaN(membershipDays) || membershipDays < 1 || membershipDays > 3650) {
      newErrors.defaultMembership = 'Deve estar entre 1 e 3650 dias';
    }

    // Grace period validation
    const graceDays = parseInt(gracePeriod, 10);
    if (isNaN(graceDays) || graceDays < 0 || graceDays > 90) {
      newErrors.gracePeriod = 'Deve estar entre 0 e 90 dias';
    }

    // Logo URL validation (basic)
    if (logoUrl && !/^https?:\/\/.+/.test(logoUrl)) {
      newErrors.logoUrl = 'URL deve começar com http:// ou https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const logAuditTrail = async (changes: any) => {
    try {
      await supabase.from('audit_logs').insert({
        gym_id: gym.id,
        user_id: user?.id,
        action: 'UPDATE_GYM_SETTINGS',
        resource_type: 'gym',
        resource_id: gym.id,
        changes: changes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log audit trail:', error);
      // Don't block the operation if audit logging fails
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast({
        title: 'Acesso Negado',
        description: 'Não tem permissão para editar definições.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor corrija os erros antes de guardar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const defaultMembershipDays = parseInt(defaultMembership, 10);
      const gracePeriodDays = parseInt(gracePeriod, 10);

      const updates = {
        name: gymName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        email: email.trim() || null,
        logo_url: logoUrl.trim() || null,
        timezone,
        locale,
        currency,
        vat_number: vatNumber.trim() || null,
        default_membership_days: defaultMembershipDays,
        grace_period_days: gracePeriodDays,
        auto_suspend_unpaid: autoSuspend,
        primary_color: primaryColor,
        invoice_footer: invoiceFooter.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gym.id);

      if (error) throw error;

      // Log audit trail
      await logAuditTrail(updates);

      await refreshGyms();
      setHasChanges(false);

      toast({
        title: 'Definições Guardadas',
        description: 'As definições do ginásio foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      console.error('Settings save failed:', error?.message);
      toast({
        title: 'Erro ao Guardar',
        description: 'Ocorreu um erro. Por favor tente novamente ou contacte o suporte.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markChanged = () => {
    if (canEdit) setHasChanges(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informação do Ginásio</CardTitle>
        <CardDescription>
          Atualize a informação básica, identidade e regras operacionais do ginásio
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Logótipo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
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
                placeholder="URL do Logótipo (https://...)"
                value={logoUrl}
                onChange={e => { setLogoUrl(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
              />
              {errors.logoUrl && (
                <p className="text-xs text-destructive mt-1">{errors.logoUrl}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Identity & localisation */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome do Ginásio *</Label>
            <Input 
              value={gymName} 
              onChange={e => { setGymName(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            {errors.gymName && (
              <p className="text-xs text-destructive">{errors.gymName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input 
              value={phone} 
              onChange={e => { setPhone(e.target.value); markChanged(); }}
              placeholder="+244 923 456 789"
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Morada</Label>
            <Input 
              value={address} 
              onChange={e => { setAddress(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select 
              value={timezone} 
              onValueChange={v => { setTimezone(v); markChanged(); }}
              disabled={!canEdit}
            >
              <SelectTrigger className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}>
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
            <Label>Locale</Label>
            <Select 
              value={locale} 
              onValueChange={v => { setLocale(v); markChanged(); }}
              disabled={!canEdit}
            >
              <SelectTrigger className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                <SelectItem value="pt-AO">Português (Angola)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Moeda</Label>
            <Select 
              value={currency} 
              onValueChange={v => { setCurrency(v); markChanged(); }}
              disabled={!canEdit}
            >
              <SelectTrigger className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AOA">AOA (Kwanza)</SelectItem>
                <SelectItem value="USD">USD (Dólar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="ZAR">ZAR (Rand)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>NIF / VAT</Label>
            <Input 
              value={vatNumber} 
              onChange={e => { setVatNumber(e.target.value); markChanged(); }}
              placeholder="Ex: 5123456789"
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            {errors.vatNumber && (
              <p className="text-xs text-destructive">{errors.vatNumber}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Operational rules */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Duração padrão da subscrição (dias)</Label>
            <Input
              type="number"
              min="1"
              max="3650"
              value={defaultMembership}
              onChange={e => { setDefaultMembership(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            {errors.defaultMembership && (
              <p className="text-xs text-destructive">{errors.defaultMembership}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Período de tolerância (dias)</Label>
            <Input
              type="number"
              min="0"
              max="90"
              value={gracePeriod}
              onChange={e => { setGracePeriod(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            {errors.gracePeriod && (
              <p className="text-xs text-destructive">{errors.gracePeriod}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="autoSuspend"
              checked={autoSuspend}
              onCheckedChange={checked => { setAutoSuspend(Boolean(checked)); markChanged(); }}
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
            <Label 
              htmlFor="autoSuspend"
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            >
              Suspender automaticamente pagamentos em atraso
            </Label>
          </div>
        </div>

        <Separator />

        {/* Branding */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Cor Principal</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={`w-20 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
              />
              <Input
                value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rodapé de faturas</Label>
            <Input
              value={invoiceFooter}
              onChange={e => { setInvoiceFooter(e.target.value); markChanged(); }}
              placeholder="Ex: Obrigado pela sua preferência"
              disabled={!canEdit}
              className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
            />
          </div>
        </div>

        {canEdit ? (
          <Button 
            onClick={handleSave} 
            disabled={loading || !hasChanges}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Alterações
              </>
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Não tem permissão para editar estas definições. Contacte um administrador.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
