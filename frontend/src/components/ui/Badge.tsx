import type { Role } from "@/types";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-800",
  purple: "bg-purple-100 text-purple-800",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// ── Role Badge ─────────────────────────────────────────────────
const roleVariants: Record<Role, BadgeVariant> = {
  ADMIN: "danger",
  CONSULTANT: "purple",
  SPECIALIST: "purple",
  NURSE: "info",
  EMBRYOLOGIST: "success",
  COUNSELLOR: "neutral",
  SONOGRAPHER: "info",
  LAB_TECH: "warning",
  BILLING: "neutral",
  RECEPTIONIST: "neutral",
  VIEWER: "neutral",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={roleVariants[role]}>{role}</Badge>;
}

// ── Status Badge ───────────────────────────────────────────────
const cycleStatusVariants: Record<string, BadgeVariant> = {
  UNDER_STIMULATION: "info",
  OPU_SCHEDULED: "warning",
  OPU_COMPLETED: "success",
  ET_SCHEDULED: "warning",
  ET_COMPLETED: "success",
  PREGNANCY_TEST: "purple",
  PREGNANCY_CONFIRMED: "success",
  CYCLE_CANCELLED: "danger",
  CYCLE_COMPLETED: "neutral",
};

export function StatusBadge({
  status,
  variant,
}: {
  status: string;
  variant?: BadgeVariant;
}) {
  const v = variant || cycleStatusVariants[status] || "neutral";
  return (
    <Badge variant={v}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
