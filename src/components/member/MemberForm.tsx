import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  status: string;
  is_dependent: boolean;
  notes: string;
}

interface MemberFormProps {
  memberData?: MemberFormData;
  onCancel: () => void;
  onSave: (data: MemberFormData) => Promise<void>;
  isEditing?: boolean;
}

const defaultFormData: MemberFormData = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  address: '',
  status: 'active',
  is_dependent: false,
  notes: '',
};

/**
 * Member Form Component
 * Handles member data input with proper typing and error handling
 */
export function MemberForm({ memberData, onCancel, onSave, isEditing }: MemberFormProps) {
  const [formData, setFormData] = useState<MemberFormData>(() => memberData || defaultFormData);
  const { toast } = useToast();

  useEffect(() => {
    if (memberData) {
      setFormData(memberData);
    } else {
      setFormData(defaultFormData);
    }
  }, [memberData]);

  const updateField = <K extends keyof MemberFormData>(key: K, value: MemberFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save member data',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+244 123 456 789"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => updateField('date_of_birth', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="123 Main St, Luanda"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_dependent">Is Dependent</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="is_dependent"
              checked={formData.is_dependent}
              onCheckedChange={(checked) => updateField('is_dependent', checked)}
            />
            <span className="text-sm text-muted-foreground">
              {formData.is_dependent ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isEditing ? 'Update Member' : 'Create Member'}
        </button>
      </div>
    </form>
  );
}
