import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';

// International standard gym roles (IHRSA, ACE, NASM compliant)
export type AppRole = 
  | 'super_admin' 
  | 'gym_owner' 
  | 'manager'
  | 'admin' 
  | 'coach'
  | 'trainer'
  | 'instructor'
  | 'physiotherapist'
  | 'nutritionist'
  | 'receptionist'
  | 'staff' 
  | 'member';

// Permission definitions for each role
const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: [
    'platform:manage',
    'gyms:create', 'gyms:read', 'gyms:update', 'gyms:delete',
    'members:create', 'members:read', 'members:update', 'members:delete',
    'checkins:create', 'checkins:read', 'checkins:update', 'checkins:delete',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'training:create', 'training:read', 'training:update', 'training:delete',
    'finance:create', 'finance:read', 'finance:update', 'finance:delete',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'locations:create', 'locations:read', 'locations:update', 'locations:delete',
    'settings:read', 'settings:update',
    'reports:read',
    'audit:read',
  ],
  gym_owner: [
    'members:create', 'members:read', 'members:update', 'members:delete',
    'checkins:create', 'checkins:read', 'checkins:update', 'checkins:delete',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'training:create', 'training:read', 'training:update', 'training:delete',
    'finance:create', 'finance:read', 'finance:update', 'finance:delete',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'locations:create', 'locations:read', 'locations:update', 'locations:delete',
    'settings:read', 'settings:update',
    'reports:read',
    'audit:read',
  ],
  manager: [
    'members:create', 'members:read', 'members:update', 'members:delete',
    'checkins:create', 'checkins:read', 'checkins:update', 'checkins:delete',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'training:create', 'training:read', 'training:update',
    'finance:create', 'finance:read', 'finance:update',
    'staff:create', 'staff:read', 'staff:update',
    'locations:create', 'locations:read', 'locations:update',
    'settings:read', 'settings:update',
    'reports:read',
    'audit:read',
  ],
  admin: [
    'members:create', 'members:read', 'members:update', 'members:delete',
    'checkins:create', 'checkins:read', 'checkins:update', 'checkins:delete',
    'payments:create', 'payments:read', 'payments:update',
    'classes:create', 'classes:read', 'classes:update',
    'training:create', 'training:read', 'training:update',
    'finance:read', 'finance:update',
    'staff:read',
    'locations:create', 'locations:read', 'locations:update',
    'settings:read',
    'reports:read',
    'audit:read',
  ],
  coach: [
    'members:read',
    'checkins:create', 'checkins:read', 'checkins:update',
    'classes:create', 'classes:read', 'classes:update',
    'training:create', 'training:read', 'training:update',
    'locations:read',
  ],
  trainer: [
    'members:read',
    'checkins:create', 'checkins:read', 'checkins:update',
    'classes:read', 'classes:update',
    'training:create', 'training:read', 'training:update',
    'locations:read',
  ],
  instructor: [
    'members:read',
    'checkins:create', 'checkins:read',
    'classes:read', 'classes:update',
    'training:read',
    'locations:read',
  ],
  physiotherapist: [
    'members:read',
    'checkins:read',
    'training:read', 'training:update',
    'locations:read',
  ],
  nutritionist: [
    'members:read',
    'checkins:read',
    'training:read',
    'locations:read',
  ],
  receptionist: [
    'members:create', 'members:read', 'members:update',
    'checkins:create', 'checkins:read', 'checkins:update',
    'payments:create', 'payments:read',
    'classes:read',
    'locations:read',
  ],
  staff: [
    'members:read',
    'checkins:create', 'checkins:read', 'checkins:update',
    'payments:read',
    'classes:read', 'classes:update',
    'training:read',
    'finance:read',
    'locations:read',
  ],
  member: [
    'checkins:read:own',
    'payments:read:own',
    'classes:read',
    'training:read:own',
  ],
};

// Trainer-specific permissions (added when is_trainer flag is true)
const TRAINER_PERMISSIONS: string[] = [
  'classes:create', 'classes:update',
  'training:create', 'training:update',
  'members:read',
  'checkins:create', 'checkins:update',
];

// Role hierarchy (higher index = more permissions) - International standard
const ROLE_HIERARCHY: AppRole[] = [
  'member', 
  'receptionist',
  'nutritionist',
  'physiotherapist',
  'instructor',
  'trainer',
  'coach',
  'staff', 
  'admin', 
  'manager',
  'gym_owner', 
  'super_admin'
];

interface UseRBACReturn {
  // Role checks
  isSuperAdmin: boolean;
  isGymOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isTrainer: boolean;
  currentRole: AppRole | null;
  allRoles: { gymId: string | null; role: AppRole; isTrainer: boolean }[];
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Role checks
  hasRole: (roles: AppRole[]) => boolean;
  hasMinimumRole: (minimumRole: AppRole) => boolean;
  
  // Loading state
  loading: boolean;
}

export function useRBAC(): UseRBACReturn {
  const { user } = useAuth();
  const { currentGym, userRoles } = useGym();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check super admin status
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .is('gym_id', null)
        .maybeSingle();

      setIsSuperAdmin(!!data);
      setLoading(false);
    };

    checkSuperAdmin();
  }, [user]);

  // Get all roles for this user
  const allRoles = useMemo(() => {
    if (!userRoles) return [];
    return userRoles.map(r => ({
      gymId: r.gym_id,
      role: r.role as AppRole,
      isTrainer: r.is_trainer || false,
    }));
  }, [userRoles]);

  // Get current role for selected gym
  const currentRole = useMemo((): AppRole | null => {
    if (isSuperAdmin) return 'super_admin';
    if (!currentGym || !userRoles) return null;
    
    const gymRole = userRoles.find(r => r.gym_id === currentGym.id);
    return gymRole?.role as AppRole || null;
  }, [isSuperAdmin, currentGym, userRoles]);

  // Check if user is a trainer for current gym
  const isTrainer = useMemo(() => {
    if (!currentGym || !userRoles) return false;
    const gymRole = userRoles.find(r => r.gym_id === currentGym.id);
    return gymRole?.is_trainer || false;
  }, [currentGym, userRoles]);

  // Role-specific booleans
  const isGymOwner = currentRole === 'gym_owner' || isSuperAdmin;
  const isAdmin = ['admin', 'gym_owner'].includes(currentRole || '') || isSuperAdmin;
  const isStaff = ['staff', 'admin', 'gym_owner'].includes(currentRole || '') || isSuperAdmin;

  // Check if user has specific role
  const hasRole = (roles: AppRole[]): boolean => {
    if (isSuperAdmin) return true;
    return currentRole !== null && roles.includes(currentRole);
  };

  // Check if user has minimum role level
  const hasMinimumRole = (minimumRole: AppRole): boolean => {
    if (!currentRole) return false;
    const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
    const minimumIndex = ROLE_HIERARCHY.indexOf(minimumRole);
    return currentIndex >= minimumIndex;
  };

  // Permission check - includes trainer permissions if is_trainer is true
  const hasPermission = (permission: string): boolean => {
    if (!currentRole) return false;
    const rolePermissions = ROLE_PERMISSIONS[currentRole] || [];
    
    // If user is a trainer, add trainer permissions
    if (isTrainer && TRAINER_PERMISSIONS.includes(permission)) {
      return true;
    }
    
    return rolePermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return {
    isSuperAdmin,
    isGymOwner,
    isAdmin,
    isStaff,
    isTrainer,
    currentRole,
    allRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinimumRole,
    loading,
  };
}
