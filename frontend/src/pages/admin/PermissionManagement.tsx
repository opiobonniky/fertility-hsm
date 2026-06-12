import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import {
  permissionService,
  roleService,
  type Role,
  type Permission,
} from "@/services/adminService";
import {
  Shield,
  KeyRound,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  Info,
  Users,
  RefreshCw,
  Save,
} from "lucide-react";

// ── Toggle Confirmation Dialog ────────────────────────────────

interface ConfirmToggleDialogProps {
  permission: Permission;
  role: Role;
  action: "assign" | "remove";
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ConfirmToggleDialog({
  permission,
  role,
  action,
  onClose,
  onConfirm,
  loading,
}: ConfirmToggleDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div
            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              action === "assign"
                ? "bg-emerald-100"
                : "bg-amber-100"
            }`}
          >
            {action === "assign" ? (
              <Unlock className="w-6 h-6 text-emerald-600" />
            ) : (
              <Lock className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {action === "assign" ? "Assign Permission" : "Revoke Permission"}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {action === "assign"
              ? `Grant the permission "${permission.name}" to role "${role.name?.replace(/_/g, " ")}"?`
              : `Remove the permission "${permission.name}" from role "${role.name?.replace(/_/g, " ")}"?`}
          </p>
          {action === "remove" && (
            <p className="mt-2 text-xs text-amber-600">
              Users with this role will lose access to this feature.
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={action === "assign" ? "primary" : "danger"}
            onClick={onConfirm}
            isLoading={loading}
            icon={
              action === "assign" ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )
            }
          >
            {action === "assign" ? "Assign" : "Revoke"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Role Permission Summary ───────────────────────────────────

function RolePermissionSummary({
  role,
  assignedCount,
  totalCount,
  isSelected,
  onSelect,
}: {
  role: Role;
  assignedCount: number;
  totalCount: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const percentage = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-primary-300 bg-primary-50 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-lg ${
            isSelected ? "bg-primary-100" : "bg-gray-100"
          }`}
        >
          <Shield
            className={`w-4 h-4 ${
              isSelected ? "text-primary-600" : "text-gray-500"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {role.name?.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-gray-500">
            {assignedCount} / {totalCount} permissions
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-xs font-semibold ${
              percentage >= 80
                ? "text-emerald-600"
                : percentage >= 50
                ? "text-amber-600"
                : "text-gray-500"
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percentage >= 80
              ? "bg-emerald-500"
              : percentage >= 50
              ? "bg-amber-500"
              : "bg-gray-300"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}

// ── Permission Checkbox ───────────────────────────────────────

function PermissionCheckbox({
  permission,
  isAssigned,
  onToggle,
  disabled,
}: {
  permission: Permission;
  isAssigned: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : isAssigned
          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      <div
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isAssigned
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 bg-white"
        }`}
      >
        {isAssigned && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{permission.name}</p>
        <p className="text-xs text-gray-500 truncate">
          <code className="text-gray-400">{permission.key}</code>
        </p>
      </div>
    </button>
  );
}

// ── Permission Management Page ────────────────────────────────

export function PermissionManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmToggle, setConfirmToggle] = useState<{
    permission: Permission;
    action: "assign" | "remove";
  } | null>(null);
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getAll(),
        permissionService.getGrouped(),
      ]);
      setRoles(rolesRes.data || []);

      // Transform grouped data from backend format
      const groupedData = permsRes.data || {};
      // groupedData is an object: { moduleName: [{ id, key, name, assignedRoles }] }
      // Or it could be an array: [{ module, permissions: [...] }]
      const grouped: Record<string, Permission[]> = {};
      if (Array.isArray(groupedData)) {
        // Array format: [{ module: "Patient Management", permissions: [...] }]
        for (const g of groupedData) {
          grouped[g.module] = g.permissions;
        }
      } else {
        // Object format: { "Patient Management": [...], "Admin": [...] }
        Object.assign(grouped, groupedData);
      }
      setPermissions(grouped);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load permissions for selected role
  useEffect(() => {
    if (!selectedRoleId) {
      setRolePermissions(new Set());
      return;
    }

    const loadRolePerms = async () => {
      setLoadingRoleId(selectedRoleId);
      try {
        const res = await permissionService.getRolePermissions(selectedRoleId);
        const permKeys = new Set(
          (res.data || []).map((rp: any) =>
            typeof rp === "string" ? rp : rp.key || rp.permission?.key
          )
        );
        setRolePermissions(permKeys);
      } catch (err) {
        console.error("Failed to load role permissions:", err);
        setRolePermissions(new Set());
      } finally {
        setLoadingRoleId(null);
      }
    };
    loadRolePerms();
  }, [selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleToggle = async (permission: Permission) => {
    if (!selectedRoleId) return;

    const isAssigned = rolePermissions.has(permission.key);
    const action = isAssigned ? "remove" : "assign";

    // Use confirmation dialog
    setConfirmToggle({ permission, action });
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggle || !selectedRoleId) return;

    const { permission, action } = confirmToggle;
    setSaving(true);
    try {
      if (action === "assign") {
        await permissionService.assign(selectedRoleId, permission.id);
      } else {
        await permissionService.remove(selectedRoleId, permission.id);
      }

      // Update local state optimistically
      setRolePermissions((prev) => {
        const next = new Set(prev);
        if (action === "assign") {
          next.add(permission.key);
        } else {
          next.delete(permission.key);
        }
        return next;
      });
    } catch (err: any) {
      console.error("Failed to toggle permission:", err);
      alert(err?.response?.data?.message || "Failed to update permission");
    } finally {
      setSaving(false);
      setConfirmToggle(null);
    }
  };

  // Get all permission keys for progress calculation
  const allPermissionKeys = new Set<string>();
  for (const modulePerms of Object.values(permissions)) {
    for (const p of modulePerms) {
      allPermissionKeys.add(p.key);
    }
  }
  const totalPermissions = allPermissionKeys.size;

  // Filter permissions by search
  const filteredPermissions: Record<string, Permission[]> = {};
  const searchLower = search.toLowerCase();
  for (const [module, perms] of Object.entries(permissions)) {
    const filtered = perms.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.key.toLowerCase().includes(searchLower) ||
        module.toLowerCase().includes(searchLower)
    );
    if (filtered.length > 0) {
      filteredPermissions[module] = filtered;
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Permission Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign and revoke granular permissions for each role
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* ── Left Sidebar: Role List ───────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Roles
            </h2>
            <span className="text-xs text-gray-400">{roles.length}</span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {roles.map((role) => {
              const permCount = role._count?.permissions ?? 0;
              return (
                <RolePermissionSummary
                  key={role.id}
                  role={role}
                  assignedCount={permCount}
                  totalCount={totalPermissions}
                  isSelected={selectedRoleId === role.id}
                  onSelect={() =>
                    setSelectedRoleId(
                      selectedRoleId === role.id ? null : role.id
                    )
                  }
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5">
            <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              About Permissions
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Permissions follow a hierarchy — roles inherit permissions from
              roles with a lower or equal hierarchy level.
            </p>
          </div>
        </div>

        {/* ── Right Content: Permission Grid ────────────────── */}
        <div className="space-y-4">
          {!selectedRole ? (
            <Card>
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <KeyRound className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Select a Role
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Choose a role from the left panel to view and manage its
                  assigned permissions.
                </p>
              </div>
            </Card>
          ) : loadingRoleId ? (
            <Card>
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                  <span className="text-sm">
                    Loading permissions for {selectedRole.name?.replace(/_/g, " ")}...
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Selected Role Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedRole.name?.replace(/_/g, " ")}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedRole.description || "No description"}
                      {" · "}Hierarchy Lv.{selectedRole.hierarchy}
                    </p>
                  </div>
                </div>
                <Badge variant="purple" size="sm">
                  {rolePermissions.size} / {totalPermissions} permissions
                </Badge>
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search permissions by name or key..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Permission Groups */}
              <div className="space-y-4">
                {Object.entries(filteredPermissions).length === 0 ? (
                  <Card>
                    <div className="text-center py-8 text-gray-500">
                      {search
                        ? "No permissions match your search"
                        : "No permissions available"}
                    </div>
                  </Card>
                ) : (
                  Object.entries(filteredPermissions).map(
                    ([module, perms]) => (
                      <Card key={module} padding="sm">
                        <CardHeader
                          title={module}
                          subtitle={`${perms.length} permission${perms.length !== 1 ? "s" : ""}`}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((permission) => (
                            <PermissionCheckbox
                              key={permission.id}
                              permission={permission}
                              isAssigned={rolePermissions.has(permission.key)}
                              onToggle={() => handleToggle(permission)}
                              disabled={saving}
                            />
                          ))}
                        </div>
                      </Card>
                    )
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm Toggle Dialog */}
      {confirmToggle && selectedRole && (
        <ConfirmToggleDialog
          permission={confirmToggle.permission}
          role={selectedRole}
          action={confirmToggle.action}
          onClose={() => setConfirmToggle(null)}
          onConfirm={handleConfirmToggle}
          loading={saving}
        />
      )}
    </div>
  );
}
