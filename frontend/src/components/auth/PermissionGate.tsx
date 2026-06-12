import { useAuthStore } from "@/store/authStore";

/**
 * Static fallback permission map matching the backend permission matrix.
 * Used when the user's permissions haven't been fetched yet or fetch fails.
 */
export const FALLBACK_PERMISSIONS: Record<string, string[]> = {
  "patient:register": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "COUNSELLOR", "BILLING", "RECEPTIONIST"],
  "patient:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "BILLING", "RECEPTIONIST", "VIEWER"],
  "patient:edit": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "COUNSELLOR", "BILLING", "RECEPTIONIST"],
  "medical-history:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR"],
  "medical-history:edit": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE"],
  "diagnosis:manage": ["ADMIN", "CONSULTANT", "SPECIALIST"],
  "couple:manage": ["ADMIN", "CONSULTANT", "SPECIALIST"],
  "cycle:create": ["ADMIN", "CONSULTANT", "SPECIALIST"],
  "cycle:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER"],
  "cycle:edit": ["ADMIN", "CONSULTANT", "SPECIALIST"],
  "follicle:record": ["ADMIN", "SPECIALIST", "SONOGRAPHER"],
  "follicle:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER"],
  "opu:record": ["ADMIN", "SPECIALIST", "NURSE", "EMBRYOLOGIST"],
  "opu:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER"],
  "semen:record": ["ADMIN", "SPECIALIST", "EMBRYOLOGIST", "LAB_TECH"],
  "semen:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "EMBRYOLOGIST", "LAB_TECH"],
  "embryology:record": ["ADMIN", "EMBRYOLOGIST"],
  "embryology:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "EMBRYOLOGIST"],
  "embryology:grade": ["ADMIN", "EMBRYOLOGIST"],
  "biopsy:manage": ["ADMIN", "EMBRYOLOGIST"],
  "biopsy:view": ["ADMIN", "CONSULTANT", "EMBRYOLOGIST"],
  "ngs:record": ["ADMIN", "EMBRYOLOGIST"],
  "ngs:view": ["ADMIN", "CONSULTANT", "EMBRYOLOGIST"],
  "et:manage": ["ADMIN", "SPECIALIST", "EMBRYOLOGIST"],
  "et:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER"],
  "pregnancy-test:record": ["ADMIN", "CONSULTANT"],
  "pregnancy-test:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER"],
  "pregnancy-outcome:record": ["ADMIN", "CONSULTANT"],
  "pregnancy-outcome:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER"],
  "cryo:manage": ["ADMIN", "EMBRYOLOGIST"],
  "cryo:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "EMBRYOLOGIST"],
  "cryo:discard": ["ADMIN", "EMBRYOLOGIST"],
  "tank:manage": ["ADMIN", "EMBRYOLOGIST"],
  "tank:view": ["ADMIN", "EMBRYOLOGIST"],
  "investigation:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "LAB_TECH"],
  "investigation:order": ["ADMIN", "CONSULTANT", "SPECIALIST"],
  "investigation:record-results": ["ADMIN", "EMBRYOLOGIST", "LAB_TECH"],
  "appointment:book": ["ADMIN", "RECEPTIONIST"],
  "appointment:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "RECEPTIONIST"],
  "appointment:edit": ["ADMIN", "RECEPTIONIST"],
  "invoice:create": ["ADMIN", "BILLING"],
  "invoice:view": ["ADMIN", "BILLING", "CONSULTANT", "SPECIALIST"],
  "invoice:cancel": ["ADMIN", "BILLING"],
  "payment:process": ["ADMIN", "BILLING"],
  "payment:view": ["ADMIN", "BILLING"],
  "report:kpi": ["ADMIN", "CONSULTANT", "SPECIALIST", "EMBRYOLOGIST", "BILLING"],
  "report:financial": ["ADMIN", "BILLING"],
  "report:export": ["ADMIN", "CONSULTANT", "SPECIALIST", "EMBRYOLOGIST", "BILLING"],
  "prescription:view": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "LAB_TECH"],
  "prescription:prescribe": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE"],
  "spouse:auto-detect": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "RECEPTIONIST"],

  "task:create": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "BILLING", "RECEPTIONIST"],
  "task:complete": ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "BILLING", "RECEPTIONIST"],
  "admin:users": ["ADMIN"],
  "admin:settings": ["ADMIN"],
  "admin:audit-logs": ["ADMIN"],
  "permissions:manage": ["ADMIN"],
};

// ── Hook ──────────────────────────────────────────────────────
export function usePermission(permission: string): boolean {
  const { user, permissions } = useAuthStore();

  if (!user) return false;

  // 1. Check dynamically fetched permissions first (from backend)
  if (permissions && permissions.length > 0) {
    return permissions.includes(permission);
  }

  // 2. Fallback to static permission map by role name
  const allowedRoles = FALLBACK_PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(user.role);
}

// ── Component ─────────────────────────────────────────────────
interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const hasAccess = usePermission(permission);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// ── HOC ───────────────────────────────────────────────────────
export function withPermission(
  Component: React.ComponentType,
  permission: string,
  fallback?: React.ReactNode,
) {
  return function PermissionedComponent(props: Record<string, unknown>) {
    return (
      <PermissionGate permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}
