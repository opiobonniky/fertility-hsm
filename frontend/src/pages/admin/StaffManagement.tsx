import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  userService,
  roleService,
  type Role,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "@/services/adminService";
import type { User } from "@/types";
import {
  Search,
  UserPlus,
  X,
  XCircle,
  Mail,
  Phone,
  Shield,
  Edit,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// ── Create/Edit Staff Modal ───────────────────────────────────

interface StaffFormModalProps {
  mode: "create" | "edit";
  user?: User | null;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}

function StaffFormModal({ mode, user, roles, onClose, onSuccess }: StaffFormModalProps) {
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    roleId: user?.roleId || "",
    phone: user?.phone || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  const checkStrength = (pw: string) => {
    if (pw.length < 6) return null;
    if (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return "strong";
    if (pw.length >= 6 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return "medium";
    return "weak";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.roleId) {
      setError("Please fill in all required fields");
      return;
    }

    if (mode === "create") {
      if (!form.password) {
        setError("Password is required");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const payload: CreateUserRequest = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          roleId: form.roleId,
          phone: form.phone.trim() || undefined,
        };
        await userService.create(payload);
      } else if (user) {
        const payload: UpdateUserRequest = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          roleId: form.roleId,
          phone: form.phone.trim() || undefined,
        };
        await userService.update(user.id, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save staff account");
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === form.roleId);
  const strengthColors = { weak: "text-rose-500", medium: "text-amber-500", strong: "text-emerald-500" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "create" ? "Register New Staff" : "Edit Staff Account"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "create"
                ? "Staff code will be auto-generated based on role"
                : `Editing ${user?.firstName} ${user?.lastName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "create" && (
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
              <p className="text-xs text-primary-700 flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                Staff code will be auto-generated based on the selected role
                (e.g. <code className="bg-primary-100 px-1 rounded font-mono">DOC-001</code>).
                A welcome email with login credentials will be sent.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="John"
              required
            />
            <Input
              label="Last Name *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>

          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john.doe@clinic.com"
            icon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />

          <SearchableSelect
            label="Role / Position"
            options={roles.map((r) => ({
              value: r.id,
              label: r.label || r.name.replace(/_/g, " "),
              subtitle: `Code prefix: ${r.name.slice(0, 3)} · Level ${r.hierarchy}`,
            }))}
            value={form.roleId}
            onChange={(val) => setForm({ ...form, roleId: val })}
            placeholder="Search for a role..."
            required
          />
          {selectedRole && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <Badge variant="purple" size="sm">
                {selectedRole.name}
              </Badge>
              <span>
                Code prefix: <strong className="font-mono">{selectedRole.name.slice(0, 3)}</strong>
                {" · "}Lv.{selectedRole.hierarchy}
              </span>
            </div>
          )}

          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+256 700 123 456"
            icon={<Phone className="w-4 h-4 text-gray-400" />}
          />

          {mode === "create" && (
            <>
              <div>
                <Input
                  label="Password *"
                  type="password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setPasswordStrength(checkStrength(e.target.value));
                  }}
                  placeholder="Min. 6 characters"
                  required
                />
                {passwordStrength && (
                  <p className={`mt-1 text-xs ${strengthColors[passwordStrength]} flex items-center gap-1`}>
                    <Shield className="w-3 h-3" />
                    Password strength: {passwordStrength}
                  </p>
                )}
              </div>
              <Input
                label="Confirm Password *"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                required
              />
            </>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              icon={mode === "create" ? <UserPlus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            >
              {mode === "create" ? "Register Staff" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Deactivate Confirm Dialog ─────────────────────────────────

function DeactivateDialog({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Deactivate Staff Account</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to deactivate{" "}
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            ? They will immediately lose access to the system.
          </p>
          {user.lastLogin && (
            <p className="mt-2 text-xs text-amber-600 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Last login: {new Date(user.lastLogin).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={loading}>
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Staff Management Page ─────────────────────────────────────

export function StaffManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const { user: currentUser } = useAuthStore();

  const loadData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getAll(),
        roleService.getAll(),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.staffCode.toLowerCase().includes(query);

    const matchesRole = !roleFilter || u.roleId === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await userService.deactivate(deactivateTarget.id);
      await loadData();
    } catch (err) {
      console.error("Failed to deactivate user:", err);
    } finally {
      setDeactivating(false);
      setDeactivateTarget(null);
    }
  };

  const roleMap = new Map(roles.map((r) => [r.id, r]));
  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register and manage clinic staff accounts
          </p>
        </div>
        <Button
          onClick={() => setShowModal("create")}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Register Staff
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500">Total Staff</p>
          <p className="text-xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-600">Active</p>
          <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
          <p className="text-xs text-rose-600">Inactive</p>
          <p className="text-xl font-bold text-rose-700">{inactiveCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or staff code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label || role.name.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      {filteredUsers.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            {search || roleFilter || statusFilter !== "all"
              ? "No staff match your filters"
              : "No staff registered yet"}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Staff Code
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Phone
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => {
                  const userRole = roleMap.get(u.roleId);
                  const roleName = userRole?.name || u.role;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        !u.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {u.staffCode}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            !u.isActive ? "bg-gray-100" : "bg-primary-100"
                          }`}>
                            <span className={`text-xs font-semibold ${
                              !u.isActive ? "text-gray-400" : "text-primary-700"
                            }`}>
                              {u.firstName[0]}
                              {u.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              Joined{" "}
                              {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={roleName as any} />
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-0.5 inline" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            <XCircle className="w-3 h-3 mr-0.5 inline" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {u.phone || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowModal("edit");
                            }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors cursor-pointer"
                            title="Edit staff"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {u.isActive && u.id !== currentUser?.id && (
                            <button
                              onClick={() => setDeactivateTarget(u)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Deactivate staff"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <StaffFormModal
          mode={showModal}
          user={selectedUser}
          roles={roles}
          onClose={() => {
            setShowModal(null);
            setSelectedUser(null);
          }}
          onSuccess={() => loadData()}
        />
      )}

      {/* Deactivate Dialog */}
      {deactivateTarget && (
        <DeactivateDialog
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleDeactivate}
          loading={deactivating}
        />
      )}
    </div>
  );
}
