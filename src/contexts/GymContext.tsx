import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface Gym {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  currency: string;
  subscription_status: string;
  settings: Json;
}

interface UserRole {
  gym_id: string;
  role: string;
  is_trainer: boolean;
}

interface GymContextType {
  currentGym: Gym | null;
  gyms: Gym[];
  userRoles: UserRole[];
  loading: boolean;
  setCurrentGym: (gym: Gym) => void;
  hasRole: (roles: string[]) => boolean;
  refreshGyms: () => Promise<void>;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentGym, setCurrentGym] = useState<Gym | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGyms = async () => {
    if (!user) {
      setGyms([]);
      setUserRoles([]);
      setCurrentGym(null);
      setLoading(false);
      return;
    }

    try {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('gym_id, role, is_trainer')
        .eq('user_id', user.id);

      if (rolesData && rolesData.length > 0) {
        setUserRoles(rolesData);

        // Filter out null gym_ids (super_admin entries have null gym_id)
        const gymIds = rolesData
          .map(r => r.gym_id)
          .filter((id): id is string => id !== null);

        // Check if user is super_admin (has role with null gym_id)
        const isSuperAdmin = rolesData.some(r => r.role === 'super_admin' && r.gym_id === null);

        let gymsData;
        if (isSuperAdmin) {
          // Super admins can see all gyms
          const { data } = await supabase.from('gyms').select('*').order('name');
          gymsData = data;
        } else if (gymIds.length > 0) {
          // Regular users see only their assigned gyms
          const { data } = await supabase.from('gyms').select('*').in('id', gymIds);
          gymsData = data;
        }

        if (gymsData) {
          setGyms(gymsData);
          if (!currentGym && gymsData.length > 0) {
            setCurrentGym(gymsData[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, [user]);

  const hasRole = (roles: string[]) => {
    if (!currentGym) return false;
    return userRoles.some(
      r => r.gym_id === currentGym.id && roles.includes(r.role)
    );
  };

  return (
    <GymContext.Provider value={{ 
      currentGym, 
      gyms, 
      userRoles, 
      loading, 
      setCurrentGym, 
      hasRole,
      refreshGyms: fetchGyms 
    }}>
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};