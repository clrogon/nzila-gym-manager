export interface GymChain {
  id: string;
  name: string;
  owner_id: string;
  settings: Record<string, any>;
  branding: {
    logo_url?: string;
    primary_color?: string;
  };
  gyms: Gym[];
  created_at: string;
  updated_at: string;
}

export interface GymWithChain {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  currency: string;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  subscription_ends_at: string | null;
  chain_id: string | null;
  settings: Record<string, any>;
  vat_number: string | null;
  default_membership_days: number;
  grace_period_days: number;
  auto_suspend_unpaid: boolean;
  primary_color: string | null;
  invoice_footer: string | null;
  member_count?: number;
  chain?: GymChain;
}

export interface UserRoleInGym {
  id: string;
  user_id: string;
  gym_id: string;
  role: 'super_admin' | 'gym_owner' | 'manager' | 'admin' | 'coach' | 'trainer' | 'instructor' | 'physiotherapist' | 'nutritionist' | 'receptionist' | 'staff';
  relationship_type: 'owner' | 'manager' | 'staff' | 'member';
  is_primary: boolean;
  is_trainer: boolean;
  is_active: boolean;
  joined_at: string;
}

export interface MemberGymAccess {
  id: string;
  member_id: string;
  gym_id: string;
  access_type: 'full' | 'limited' | 'day_pass';
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StaffGymAssignment {
  id: string;
  user_id: string;
  gym_id: string;
  is_primary: boolean;
  is_active: boolean;
  assigned_at: string;
  assigned_by: string;
}

export interface CreateGymParams {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  vat_number?: string;
  default_membership_days?: number;
  grace_period_days?: number;
  auto_suspend_unpaid?: boolean;
  primary_color?: string;
  invoice_footer?: string;
}

export interface CreateChainParams {
  name: string;
  settings?: Record<string, any>;
  branding?: {
    logo_url?: string;
    primary_color?: string;
  };
}

export interface UserGymSummary {
  chain: GymChain | null;
  gyms: GymWithChain[];
  currentGym: string;
  canCreateGym: boolean;
  subscriptionStatus: 'can_create' | 'subscription_limit' | 'plan_limit';
}
