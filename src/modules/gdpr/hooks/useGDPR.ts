import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Consent {
  type: string;
  label: string;
  description: string;
  required: boolean;
  given: boolean;
  date?: string;
}

export interface GDPRRequest {
  id: string;
  type: 'export' | 'deletion' | 'rectification';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  exportUrl?: string;
}

export function useGDPR(memberId: string) {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const CONSENT_TYPES: Omit<Consent, 'given' | 'date'>[] = [
    {
      type: 'data_processing',
      label: 'Data Processing',
      description: 'Allow us to process your personal data',
      required: true,
    },
    {
      type: 'marketing',
      label: 'Marketing',
      description: 'Receive promotional emails',
      required: false,
    },
    {
      type: 'analytics',
      label: 'Analytics',
      description: 'Help us improve with usage analytics',
      required: false,
    },
  ];

  useEffect(() => {
    if (memberId) {
      loadConsents();
      loadRequests();
    }
  }, [memberId]);

  const loadConsents = async () => {
    try {
      const { data, error } = await supabase
        .from('member_consents')
        .select('*')
        .eq('member_id', memberId);

      if (error) throw error;

      const consentMap = new Map(data?.map(d => [d.consent_type, d]) || []);
      
      setConsents(CONSENT_TYPES.map(ct => ({
        ...ct,
        given: consentMap.get(ct.type)?.consent_given ?? ct.required,
        date: consentMap.get(ct.type)?.consent_date,
      })));
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data?.map(r => ({
        id: r.id,
        type: r.request_type as any,
        status: r.status as any,
        requestedAt: r.requested_at,
        completedAt: r.completed_at || undefined,
        exportUrl: r.export_file_url || undefined,
      })) || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const updateConsent = async (consentType: string, given: boolean) => {
    try {
      const { error } = await supabase
        .from('member_consents')
        .upsert({
          member_id: memberId,
          consent_type: consentType,
          consent_given: given,
          consent_date: given ? new Date().toISOString() : null,
          withdrawn_date: !given ? new Date().toISOString() : null,
          version: '1.0',
        }, { onConflict: 'member_id,consent_type' });

      if (error) throw error;
      await loadConsents();
      return { success: true };
    } catch (error) {
      console.error('Error updating consent:', error);
      return { success: false, error };
    }
  };

  const requestDataExport = async () => {
    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          member_id: memberId,
          request_type: 'export',
          status: 'pending',
        });

      if (error) throw error;
      await loadRequests();
      return { success: true };
    } catch (error) {
      console.error('Error requesting export:', error);
      return { success: false, error };
    }
  };

  const requestDataDeletion = async () => {
    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          member_id: memberId,
          request_type: 'deletion',
          status: 'pending',
        });

      if (error) throw error;
      await loadRequests();
      return { success: true };
    } catch (error) {
      console.error('Error requesting deletion:', error);
      return { success: false, error };
    }
  };

  return {
    consents,
    requests,
    loading,
    updateConsent,
    requestDataExport,
    requestDataDeletion,
    refresh: () => {
      loadConsents();
      loadRequests();
    },
  };
}
