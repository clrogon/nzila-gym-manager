import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Clock, CreditCard, MapPin, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllDisciplines } from '@/lib/seedData';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'details', title: 'Gym Details', description: 'Basic information about your gym', icon: <Building2 className="w-5 h-5" /> },
  { id: 'hours', title: 'Hours & Contact', description: 'Operating hours and contact info', icon: <Clock className="w-5 h-5" /> },
  { id: 'subscription', title: 'Subscription', description: 'Choose your plan', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'location', title: 'Initial Location', description: 'Set up your first branch', icon: <MapPin className="w-5 h-5" /> },
];

interface FormData {
  // Step 1: Gym Details
  gymName: string;
  address: string;
  timezone: string;
  currency: string;
  // Step 2: Hours & Contact
  phone: string;
  email: string;
  weekdayHours: string;
  weekendHours: string;
  // Step 3: Subscription
  subscriptionPlan: string;
  // Step 4: Location
  locationName: string;
  locationAddress: string;
  locationCapacity: string;
}

const initialFormData: FormData = {
  gymName: '',
  address: '',
  timezone: 'Africa/Luanda',
  currency: 'AOA',
  phone: '',
  email: '',
  weekdayHours: '06:00 - 22:00',
  weekendHours: '08:00 - 18:00',
  subscriptionPlan: 'trial',
  locationName: 'Main Branch',
  locationAddress: '',
  locationCapacity: '100',
};

export function GymSetupWizard() {
  const { user } = useAuth();
  const { refreshGyms } = useGym();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return formData.gymName.trim().length >= 2;
      case 1:
        return true; // Optional fields
      case 2:
        return !!formData.subscriptionPlan;
      case 3:
        return formData.locationName.trim().length >= 2;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    } else {
      toast({ title: 'Validation Error', description: 'Please fill in required fields.', variant: 'destructive' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateStep(currentStep)) {
      toast({ title: 'Validation Error', description: 'Please fill in required fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Create the gym with settings
      const gymSettings = {
        weekday_hours: formData.weekdayHours,
        weekend_hours: formData.weekendHours,
      };

      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .insert({
          name: formData.gymName,
          slug: generateSlug(formData.gymName),
          phone: formData.phone || null,
          address: formData.address || null,
          email: formData.email || user.email,
          timezone: formData.timezone,
          currency: formData.currency,
          subscription_status: formData.subscriptionPlan as 'trial' | 'active',
          settings: gymSettings,
        })
        .select()
        .single();

      if (gymError) {
        if (gymError.code === '42501') {
          throw new Error('Unauthorized. Contact your administrator to be assigned as a Gym Owner.');
        }
        throw gymError;
      }

      // The trigger automatically assigns gym_owner role, so we don't need to do it manually
      // But let's create the initial location
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          gym_id: gym.id,
          name: formData.locationName,
          address: formData.locationAddress || formData.address || null,
          capacity: parseInt(formData.locationCapacity) || 100,
          is_active: true,
        });

      if (locationError) {
        console.error('Error creating location:', locationError);
        // Non-fatal, continue
      }

      // Seed default disciplines for the gym
      const disciplines = getAllDisciplines();
      const disciplineInserts = disciplines.map(d => ({
        gym_id: gym.id,
        name: d.name,
        description: d.description,
        category: d.category,
        is_active: true,
      }));

      const { error: disciplineError } = await supabase
        .from('disciplines')
        .insert(disciplineInserts);

      if (disciplineError) {
        console.error('Error seeding disciplines:', disciplineError);
        // Non-fatal, continue
      }

      await refreshGyms();
      toast({ title: 'Gym Created!', description: `Welcome to Nzila! ${formData.gymName} is ready.` });
      navigate('/dashboard');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error creating gym:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create gym. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gymName">Gym Name *</Label>
              <Input
                id="gymName"
                placeholder="FitZone Gym"
                value={formData.gymName}
                onChange={(e) => updateField('gymName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Rua da Samba 123, Luanda, Angola"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(v) => updateField('timezone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Luanda">Africa/Luanda (WAT)</SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                    <SelectItem value="Europe/Lisbon">Europe/Lisbon (WET)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOA">AOA (Kwanza)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+244 923 456 789"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@gym.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekdayHours">Weekday Hours</Label>
                <Input
                  id="weekdayHours"
                  placeholder="06:00 - 22:00"
                  value={formData.weekdayHours}
                  onChange={(e) => updateField('weekdayHours', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekendHours">Weekend Hours</Label>
                <Input
                  id="weekendHours"
                  placeholder="08:00 - 18:00"
                  value={formData.weekendHours}
                  onChange={(e) => updateField('weekendHours', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              {[
                { value: 'trial', name: 'Trial', price: 'Free for 14 days', features: ['Up to 50 members', 'Basic reports', 'Email support'] },
                { value: 'active', name: 'Pro', price: 'Contact for pricing', features: ['Unlimited members', 'Advanced reports', 'Priority support', 'Multi-location'] },
              ].map((plan) => (
                <div
                  key={plan.value}
                  onClick={() => updateField('subscriptionPlan', plan.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    formData.subscriptionPlan === plan.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    <span className="text-sm text-muted-foreground">{plan.price}</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                placeholder="Main Branch"
                value={formData.locationName}
                onChange={(e) => updateField('locationName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">Location Address</Label>
              <Textarea
                id="locationAddress"
                placeholder="Same as gym address or different"
                value={formData.locationAddress}
                onChange={(e) => updateField('locationAddress', e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Leave empty to use gym address</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationCapacity">Max Capacity</Label>
              <Input
                id="locationCapacity"
                type="number"
                placeholder="100"
                value={formData.locationCapacity}
                onChange={(e) => updateField('locationCapacity', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl relative animate-fade-in glass">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Set Up Your Gym</CardTitle>
            <CardDescription>Complete the setup wizard to get started</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      index < currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : index === currentStep
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStep ? <Check className="w-5 h-5" /> : step.icon}
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={cn(
                      'flex-1 h-1 mx-2',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )} />
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-2 text-center hidden sm:block',
                  index === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[280px]">
            <h3 className="text-lg font-semibold mb-1">{WIZARD_STEPS[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{WIZARD_STEPS[currentStep].description}</p>
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleNext} className="gradient-primary">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="gradient-primary">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Gym
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
