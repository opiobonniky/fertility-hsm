import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import {
  Users,
  Shield,
  KeyRound,
  ArrowRight,
  UserPlus,
  Settings,
  UserCheck,
  UserX,
} from "lucide-react";
import { userService, roleService } from "@/services/adminService";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  roleBreakdown: { name: string; label: string; count: number }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          userService.getAll(),
          roleService.getAll(),
        ]);
        const users = usersRes.data || [];
        const roles = rolesRes.data || [];

        // Build role breakdown
        const roleMap = new Map<string, { name: string; label: string; count: number }>();
        for (const role of roles) {
          roleMap.set(role.id, { name: role.name, label: role.label || role.name, count: 0 });
        }
        for (const user of users) {
          const entry = roleMap.get(user.roleId);
          if (entry) entry.count++;
        }

        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.isActive).length,
          inactiveUsers: users.filter((u) => !u.isActive).length,
          totalRoles: roles.length,
          roleBreakdown: Array.from(roleMap.values()).sort((a, b) => b.count - a.count),
        });
      } catch (err) {
        setError("Failed to load admin dashboard stats");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Total Staff",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      color: "text-blue-600 bg-blue-50",
      link: "/admin/staff",
    },
    {
      label: "Active",
      value: stats?.activeUsers ?? "—",
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50",
      link: "/admin/staff",
    },
    {
      label: "Inactive",
      value: stats?.inactiveUsers ?? "—",
      icon: UserX,
      color: stats && stats.inactiveUsers > 0 ? "text-rose-600 bg-rose-50" : "text-gray-600 bg-gray-50",
      link: "/admin/staff",
    },
    {
      label: "Roles",
      value: stats?.totalRoles ?? "—",
      icon: Shield,
      color: "text-purple-600 bg-purple-50",
      link: "/admin/roles",
    },
  ];

  const quickActions = [
    {
      label: "Register Staff",
      description: "Create a new staff account (auto-generates staff code)",
      icon: UserPlus,
      color: "text-primary-600 bg-primary-50",
      link: "/admin/staff",
    },
    {
      label: "Manage Roles",
      description: "Create and configure roles with hierarchy levels",
      icon: Shield,
      color: "text-purple-600 bg-purple-50",
      link: "/admin/roles",
    },
    {
      label: "Manage Permissions",
      description: "Assign or revoke granular permissions per role",
      icon: KeyRound,
      color: "text-amber-600 bg-amber-50",
      link: "/admin/permissions",
    },
    {
      label: "System Settings",
      description: "Configure system-wide settings",
      icon: Settings,
      color: "text-gray-600 bg-gray-50",
      link: "/admin",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          System administration, user management, and configuration
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-8 text-rose-600">{error}</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} to={stat.link}>
                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" subtitle="Common administration tasks" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.link}
                className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
              >
                <div className={`p-2.5 rounded-lg w-fit ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {action.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Role Breakdown */}
      {stats && stats.roleBreakdown.length > 0 && (
        <Card>
          <CardHeader
            title="Staff by Role"
            subtitle="Distribution of staff across roles"
          />
          <div className="space-y-3">
            {stats.roleBreakdown.map((role) => {
              const maxCount = Math.max(...stats.roleBreakdown.map((r) => r.count));
              const percentage = maxCount > 0 ? (role.count / maxCount) * 100 : 0;
              return (
                <div key={role.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 truncate" title={role.label}>
                    {role.label}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, role.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 min-w-[2ch] text-right">
                    {role.count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* System Info */}
      <Card padding="sm">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>System: Life's Spring Women Center</span>
            <span>Version: 1.0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-400">All systems operational</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
