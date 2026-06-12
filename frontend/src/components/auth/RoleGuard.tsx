import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  if (!roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function withRoleGuard(
  Component: React.ComponentType,
  roles: Role[],
  fallback?: React.ReactNode
) {
  return function GuardedComponent(props: Record<string, unknown>) {
    return (
      <RoleGuard roles={roles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
