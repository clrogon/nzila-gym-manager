import { useState, useCallback, useMemo } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { AppError, handleError, logError, getUserErrorMessage } from '@/types/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * Member type with all fields
 */
export interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  photo_url: string | null;
  notes: string | null;
  membership_plan_id: string | null;
  membership_start_date: string | null;
  membership_end_date: string | null;
  created_at: string;
  is_dependent: boolean | null;
  tutor_id: string | null;
  gym_id: string;
}

/**
 * Member sensitive data type
 */
export interface MemberSensitiveData {
  id: string;
  member_id: string;
  health_conditions: string | null;
  medical_notes: string | null;
  allergies: string | null;
}

/**
 * Membership plan type
 */
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

/**
 * Valid member status values
 */
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * Member form data type (basic info only)
 */
export interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  status: MemberStatus;
  membership_plan_id: string;
  notes: string;
  is_dependent: boolean;
  tutor_id: string;
  photo_url: string;
}

/**
 * Member filter options
 */
export interface MemberFilters {
  searchQuery: string;
  statusFilter: string;
}

/**
 * Custom hook for member form state management
 */
export function useMemberForm(initialMember?: Member) {
  const getStatusValue = (status: string | null | undefined): MemberStatus => {
    const validStatuses: MemberStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    return validStatuses.includes(status as MemberStatus) ? (status as MemberStatus) : 'active';
  };

  const [formData, setFormData] = useState<MemberFormData>(
    initialMember ? {
      full_name: initialMember.full_name || '',
      email: initialMember.email || '',
      phone: initialMember.phone || '',
      date_of_birth: initialMember.date_of_birth || '',
      address: initialMember.address || '',
      status: getStatusValue(initialMember.status),
      membership_plan_id: initialMember.membership_plan_id || '',
      notes: initialMember.notes || '',
      is_dependent: initialMember.is_dependent || false,
      tutor_id: initialMember.tutor_id || '',
      photo_url: initialMember.photo_url || ''
    } : {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address: '',
      status: 'active',
      membership_plan_id: '',
      notes: '',
      is_dependent: false,
      tutor_id: '',
      photo_url: ''
    }
  );

  const updateField = useCallback((field: keyof MemberFormData, value: MemberFormData[keyof MemberFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address: '',
      status: 'active',
      membership_plan_id: '',
      notes: '',
      is_dependent: false,
      tutor_id: '',
      photo_url: ''
    });
  }, []);

  const populateFromMember = useCallback((member: Member) => {
    const getStatusValue = (status: string | null | undefined): MemberStatus => {
      const validStatuses: MemberStatus[] = ['active', 'inactive', 'pending', 'suspended'];
      return validStatuses.includes(status as MemberStatus) ? (status as MemberStatus) : 'active';
    };

    setFormData({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
      address: member.address || '',
      status: getStatusValue(member.status),
      membership_plan_id: member.membership_plan_id || '',
      notes: member.notes || '',
      is_dependent: member.is_dependent || false,
      tutor_id: member.tutor_id || '',
      photo_url: member.photo_url || ''
    });
  }, []);

  return {
    formData,
    updateField,
    resetForm,
    populateFromMember
  };
}

/**
 * Custom hook for member data operations
 */
export function useMembersData(gymId: string | undefined) {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [sensitiveDataMap, setSensitiveDataMap] = useState<Record<string, MemberSensitiveData>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Memoize fetch functions to prevent recreation
  const fetchMembers = useCallback(async () => {
    if (!gymId) return;

    try {
      setLoading(true);

      // Fetch members and membership plans in parallel
      const [membersResult, plansResult] = await Promise.all([
        supabase
          .from('members')
          .select('*')
          .eq('gym_id', gymId)
          .order('created_at', { ascending: false }),
        supabase
          .from('membership_plans')
          .select('id, name, price, duration_days')
          .eq('gym_id', gymId)
          .eq('is_active', true)
          .order('price')
      ]);

      if (membersResult.error) throw membersResult.error;
      if (plansResult.error) throw plansResult.error;

      const membersData = membersResult.data || [];
      const plansData = plansResult.data || [];
      
      setMembers(membersData);
      setPlans(plansData);

      // Fetch sensitive data for all members (only if admin)
      if (membersData.length > 0) {
        const memberIds = membersData.map(m => m.id);
        const { data: sensitiveData, error: sensitiveError } = await supabase
          .from('member_sensitive_data')
          .select('*')
          .in('member_id', memberIds);

        if (sensitiveError) throw sensitiveError;

        if (sensitiveData && sensitiveData.length > 0) {
          const dataMap: Record<string, MemberSensitiveData> = {};
          sensitiveData.forEach((sd: MemberSensitiveData) => {
            dataMap[sd.member_id] = sd;
          });
          setSensitiveDataMap(dataMap);
        }
      }
    } catch (error) {
      const appError = handleError(error, 'useMembersData.fetchMembers');
      logError(appError);
      
      toast({
        title: 'Error Loading Members',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [gymId, toast]);

  const createMember = useCallback(async (memberData: MemberFormData) => {
    if (!gymId) {
      toast({
        title: 'Error',
        description: 'Please create a gym first.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .insert([{
          ...memberData,
          gym_id: gymId
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member created successfully',
      });

      await fetchMembers();
      return data as Member;
    } catch (error) {
      const appError = handleError(error, 'useMembersData.createMember');
      logError(appError);
      
      toast({
        title: 'Error Creating Member',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
      return null;
    }
  }, [gymId, toast, fetchMembers]);

  const updateMember = useCallback(async (id: string, memberData: Partial<MemberFormData>) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update(memberData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member updated successfully',
      });

      await fetchMembers();
      return data as Member;
    } catch (error) {
      const appError = handleError(error, 'useMembersData.updateMember');
      logError(appError);
      
      toast({
        title: 'Error Updating Member',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchMembers, toast]);

  const deleteMember = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member deleted successfully',
      });

      await fetchMembers();
    } catch (error) {
      const appError = handleError(error, 'useMembersData.deleteMember');
      logError(appError);
      
      toast({
        title: 'Error Deleting Member',
        description: getUserErrorMessage(appError),
        variant: 'destructive'
      });
    }
  }, [fetchMembers, toast]);

  return {
    members,
    plans,
    sensitiveDataMap,
    loading,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember
  };
}

/**
 * Custom hook for member filtering
 */
export function useMemberFilters(members: Member[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Memoize filtered members to prevent unnecessary recalculations
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Status filter
      if (statusFilter !== 'all' && member.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.full_name?.toLowerCase().includes(query);
        const matchesEmail = member.email?.toLowerCase().includes(query);
        const matchesPhone = member.phone?.toLowerCase().includes(query);
        
        return matchesName || matchesEmail || matchesPhone;
      }

      return true;
    });
  }, [members, statusFilter, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredMembers
  };
}
