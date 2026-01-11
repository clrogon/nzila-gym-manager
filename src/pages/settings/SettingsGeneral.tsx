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
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  Save, 
  Upload, 
  Loader2, 
  Building2, 
  Globe, 
  Settings2, 
  Palette,
  Sparkles
} from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface GymSettings {
  vat_number?: string | null;
  default_membership_days?: number | null;
  grace_period_days?: number | null;
  auto_suspend_unpaid?: boolean | null;
  primary_color?: string | null;
  invoice_footer?: string | null;
  locale?: string | null;
  [key: string]: Json | undefined;
}

interface Gym {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  timezone?: string | null;
  currency?: string | null;
  logo_url?: string | null;
  settings?: Json | null;
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

  const sanitizeLogoUrl = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed === '') {
      return '';
    }
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.toString();
      }
    } catch {
      // Invalid URL, return as-is to allow typing
    }
    return trimmed;
  };

  // Get settings from gym.settings JSON field
  const gymSettings = (typeof gym.settings === 'object' && gym.settings !== null ? gym.settings : {}) as GymSettings;

  // Basic info
  const [gymName, setGymName] = useState(gym.name);
  const [phone, setPhone] = useState(gym.phone || '');
  const [address, setAddress] = useState(gym.address || '');
  const [email, setEmail] = useState(gym.email || '');
  const [logoUrl, setLogoUrl] = useState(gym.logo_url || '');

  // Identity & localisation (stored in gyms table)
  const [timezone, setTimezone] = useState(gym.timezone || 'Africa/Luanda');
  const [currency, setCurrency] = useState(gym.currency || 'AOA');
  
  // Extended settings (stored in settings JSON)
  const [locale, setLocale] = useState(gymSettings.locale || 'pt-PT');
  const [vatNumber, setVatNumber] = useState(gymSettings.vat_number || '');

  // Operational rules (stored in settings JSON)
  const [defaultMembership, setDefaultMembership] = useState(
    gymSettings.default_membership_days?.toString() || '30'
  );
  const [gracePeriod, setGracePeriod] = useState(
    gymSettings.grace_period_days?.toString() || '3'
  );
  const [autoSuspend, setAutoSuspend] = useState(
    gymSettings.auto_suspend_unpaid ?? false
  );

  // Branding (stored in settings JSON)
  const [primaryColor, setPrimaryColor] = useState(
    gymSettings.primary_color || '#000000'
  );
  const [invoiceFooter, setInvoiceFooter] = useState(
    gymSettings.invoice_footer || ''
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const settings = (typeof gym.settings === 'object' && gym.settings !== null ? gym.settings : {}) as GymSettings;
    
    setGymName(gym.name);
    setPhone(gym.phone || '');
    setAddress(gym.address || '');
    setEmail(gym.email || '');
    setLogoUrl(gym.logo_url || '');
    setTimezone(gym.timezone || 'Africa/Luanda');
    setCurrency(gym.currency || 'AOA');
    
    // Load from settings JSON
    setLocale(settings.locale || 'pt-PT');
    setVatNumber(settings.vat_number || '');
    setDefaultMembership(settings.default_membership_days?.toString() || '30');
    setGracePeriod(settings.grace_period_days?.toString() || '3');
    setAutoSuspend(settings.auto_suspend_unpaid ?? false);
    setPrimaryColor(settings.primary_color || '#000000');
    setInvoiceFooter(settings.invoice_footer || '');
    
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

  const logAuditTrail = async (changes: Record<string, unknown>) => {
    try {
      await supabase.from('audit_logs').insert([{
        gym_id: gym.id,
        user_id: user?.id || null,
        action: 'UPDATE_GYM_SETTINGS',
        entity_type: 'gym',
        entity_id: gym.id,
        new_values: changes as Json,
      }]);
    } catch (error) {
      console.error('Failed to log audit trail:', error);
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

      // Prepare settings JSON with extended fields
      const currentSettings = (typeof gym.settings === 'object' && gym.settings !== null ? gym.settings : {}) as GymSettings;
      const newSettings = {
        ...currentSettings,
        vat_number: vatNumber.trim() || null,
        default_membership_days: defaultMembershipDays,
        grace_period_days: gracePeriodDays,
        auto_suspend_unpaid: autoSuspend,
        primary_color: primaryColor,
        invoice_footer: invoiceFooter.trim() || null,
        locale,
      } as Json;

      // Only update columns that exist in the gyms table
      const updates = {
        name: gymName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        email: email.trim() || null,
        logo_url: logoUrl.trim() || null,
        timezone,
        currency,
        settings: newSettings,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Settings save failed:', errorMessage);
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

  const SectionCard = ({ 
    children, 
    icon: Icon, 
    title, 
    description 
  }: { 
    children: React.ReactNode; 
    icon: React.ElementType; 
    title: string; 
    description: string;
  }) => (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg hover:shadow-xl transition-all duration-500 group">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 group-hover:glow-gold transition-all duration-300">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-display">{title}</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {children}
      </CardContent>
    </Card>
  );

  const inputClassName = `bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`;

  return (
    <div className="space-y-6">
      {/* Logo & Identity Section */}
      <SectionCard 
        icon={Building2} 
        title="Identidade do Ginásio" 
        description="Logótipo e informações básicas de contacto"
      >
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-start gap-6">
            <div className="relative group/logo">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/30 overflow-hidden transition-all duration-300 group-hover/logo:border-primary/40 group-hover/logo:bg-muted/50">
                {logoUrl && /^https?:\/\/.+/.test(logoUrl) ? (
                  <img
                    src={logoUrl}
                    alt="Logótipo do ginásio"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground/60" />
                )}
              </div>
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl glow-gold opacity-0 group-hover/logo:opacity-50 transition-opacity duration-300 pointer-events-none" />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">URL do Logótipo</Label>
              <Input
                placeholder="https://..."
                value={logoUrl}
                onChange={e => {
                  setLogoUrl(e.target.value);
                  markChanged();
                }}
                disabled={!canEdit}
                className={inputClassName}
              />
              {errors.logoUrl && (
                <p className="text-xs text-destructive">{errors.logoUrl}</p>
              )}
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome do Ginásio *</Label>
              <Input 
                value={gymName} 
                onChange={e => { setGymName(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={inputClassName}
              />
              {errors.gymName && (
                <p className="text-xs text-destructive">{errors.gymName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={inputClassName}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Telefone</Label>
              <Input 
                value={phone} 
                onChange={e => { setPhone(e.target.value); markChanged(); }}
                placeholder="+244 923 456 789"
                disabled={!canEdit}
                className={inputClassName}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Morada</Label>
              <Input 
                value={address} 
                onChange={e => { setAddress(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">NIF / VAT</Label>
              <Input 
                value={vatNumber} 
                onChange={e => { setVatNumber(e.target.value); markChanged(); }}
                placeholder="Ex: 5123456789"
                disabled={!canEdit}
                className={inputClassName}
              />
              {errors.vatNumber && (
                <p className="text-xs text-destructive">{errors.vatNumber}</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Regional Settings */}
      <SectionCard 
        icon={Globe} 
        title="Configurações Regionais" 
        description="Fuso horário, moeda e preferências de idioma"
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fuso Horário</Label>
            <Select 
              value={timezone} 
              onValueChange={v => { setTimezone(v); markChanged(); }}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputClassName}>
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
            <Label className="text-sm font-medium">Locale</Label>
            <Select 
              value={locale} 
              onValueChange={v => { setLocale(v); markChanged(); }}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputClassName}>
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
            <Label className="text-sm font-medium">Moeda</Label>
            <Select 
              value={currency} 
              onValueChange={v => { setCurrency(v); markChanged(); }}
              disabled={!canEdit}
            >
              <SelectTrigger className={inputClassName}>
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
        </div>
      </SectionCard>

      {/* Operational Rules */}
      <SectionCard 
        icon={Settings2} 
        title="Regras Operacionais" 
        description="Configure as políticas de subscrição e pagamento"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Duração padrão da subscrição (dias)</Label>
            <Input
              type="number"
              min="1"
              max="3650"
              value={defaultMembership}
              onChange={e => { setDefaultMembership(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={inputClassName}
            />
            {errors.defaultMembership && (
              <p className="text-xs text-destructive">{errors.defaultMembership}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Período de tolerância (dias)</Label>
            <Input
              type="number"
              min="0"
              max="90"
              value={gracePeriod}
              onChange={e => { setGracePeriod(e.target.value); markChanged(); }}
              disabled={!canEdit}
              className={inputClassName}
            />
            {errors.gracePeriod && (
              <p className="text-xs text-destructive">{errors.gracePeriod}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
              <Checkbox
                id="autoSuspend"
                checked={autoSuspend}
                onCheckedChange={checked => { setAutoSuspend(Boolean(checked)); markChanged(); }}
                disabled={!canEdit}
                className={!canEdit ? 'cursor-not-allowed opacity-60' : ''}
              />
              <Label 
                htmlFor="autoSuspend"
                className={`text-sm ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                Suspender automaticamente membros com pagamentos em atraso
              </Label>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Branding */}
      <SectionCard 
        icon={Palette} 
        title="Marca & Personalização" 
        description="Cores e textos personalizados para faturas"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor Principal</Label>
            <div className="flex gap-3">
              <div className="relative">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={e => { setPrimaryColor(e.target.value); markChanged(); }}
                  disabled={!canEdit}
                  className={`w-14 h-10 p-1 cursor-pointer rounded-lg border-2 border-border/50 ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                />
              </div>
              <Input
                value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); markChanged(); }}
                disabled={!canEdit}
                className={`flex-1 ${inputClassName}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Rodapé de faturas</Label>
            <Input
              value={invoiceFooter}
              onChange={e => { setInvoiceFooter(e.target.value); markChanged(); }}
              placeholder="Ex: Obrigado pela sua preferência"
              disabled={!canEdit}
              className={inputClassName}
            />
          </div>
        </div>
      </SectionCard>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {canEdit ? (
          <Button 
            onClick={handleSave} 
            disabled={loading || !hasChanges}
            size="lg"
            className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:glow-gold transition-all duration-300 font-medium"
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
            <Sparkles className="w-4 h-4" />
            Não tem permissão para editar estas definições.
          </div>
        )}
        
        {hasChanges && (
          <span className="text-sm text-primary animate-pulse">
            Alterações não guardadas
          </span>
        )}
      </div>
    </div>
  );
}
