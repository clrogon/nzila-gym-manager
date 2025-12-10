import { ReactNode } from 'react';
import { useRBAC, AppRole } from '@/hooks/useRBAC';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RequirePermissionProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  roles?: AppRole[];
  minimumRole?: AppRole;
  fallback?: ReactNode;
  showAlert?: boolean;
}

export function RequirePermission({
  children,
  permission,
  permissions,
  requireAll = false,
  roles,
  minimumRole,
  fallback,
  showAlert = false,
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasMinimumRole, loading } = useRBAC();

  if (loading) {
    return null;
  }

  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Check multiple permissions
  else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }
  // Check roles
  else if (roles) {
    hasAccess = hasRole(roles);
  }
  // Check minimum role
  else if (minimumRole) {
    hasAccess = hasMinimumRole(minimumRole);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAlert) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
