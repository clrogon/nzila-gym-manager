import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'gym_owner' | 'admin' | 'staff' | 'member';

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
    'settings:read',
    'reports:read',
    'audit:read',
  ],
  staff: [
    'members:read',
    'checkins:create', 'checkins:read', 'checkins:update',
    'payments:read',
    'classes:read', 'classes:update',
    'training:read',
    'finance:read',
  ],
  member: [
    'checkins:read:own',
    'payments:read:own',
    'classes:read',
    'training:read:own',
  ],
};

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: AppRole[] = ['member', 'staff', 'admin', 'gym_owner', 'super_admin'];

interface UseRBACReturn {
  // Role checks
  isSuperAdmin: boolean;
  isGymOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  currentRole: AppRole | null;
  allRoles: { gymId: string | null; role: AppRole }[];
  
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
    }));
  }, [userRoles]);

  // Get current role for selected gym
  const currentRole = useMemo((): AppRole | null => {
    if (isSuperAdmin) return 'super_admin';
    if (!currentGym || !userRoles) return null;
    
    const gymRole = userRoles.find(r => r.gym_id === currentGym.id);
    return gymRole?.role as AppRole || null;
  }, [isSuperAdmin, currentGym, userRoles]);

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

  // Permission check
  const hasPermission = (permission: string): boolean => {
    if (!currentRole) return false;
    const permissions = ROLE_PERMISSIONS[currentRole] || [];
    return permissions.includes(permission);
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
