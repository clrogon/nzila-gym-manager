import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Mail, Loader2 } from 'lucide-react';

interface PreRegistrationFormData {
  email: string;
  fullName: string;
  gymName: string;
  phone: string;
  message: string;
}

const initialFormData: PreRegistrationFormData = {
  email: '',
  fullName: '',
  gymName: '',
  phone: '',
  message: '',
};

export function GymOwnerPreRegistration() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PreRegistrationFormData>(initialFormData);

  const updateField = (field: keyof PreRegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.fullName || !formData.gymName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('pre-register-gym-owner', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          gymName: formData.gymName,
          phone: formData.phone || null,
          message: formData.message || null,
        },
      });

      if (error) throw error;

      toast({
        title: 'Invitation Sent',
        description: `An invitation email has been sent to ${formData.email}.`,
      });

      setFormData(initialFormData);
      setOpen(false);
    } catch (error: any) {
      console.error('Pre-registration error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Gym Owner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pre-Register Gym Owner
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a new gym owner. They will receive instructions to complete their registration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="owner@gym.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gymName">Gym Name *</Label>
            <Input
              id="gymName"
              value={formData.gymName}
              onChange={(e) => updateField('gymName', e.target.value)}
              placeholder="FitZone Gym"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+244 923 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Welcome Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Add a personalized welcome message..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
