import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import {
  roleService,
  type Role,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from "@/services/adminService";
import {
  Shield,
  Plus,
  X,
  Edit,
  Trash2,
  Users,
  KeyRound,
} from "lucide-react";

// ── Role Form Modal ───────────────────────────────────────────

interface RoleFormModalProps {
  mode: "create" | "edit";
  role?: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RoleFormModal({ mode, role, onClose, onSuccess }: RoleFormModalProps) {
  const [form, setForm] = useState({
    name: role?.name || "",
    description: role?.description || "",
    hierarchy: role?.hierarchy ?? 50,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Role name is required");
      return;
    }

    // Format name: uppercase, replace spaces with underscores
    const formattedName = form.name.trim().toUpperCase().replace(/\s+/g, "_");

    setSaving(true);
    try {
      if (mode === "create") {
        const payload: CreateRoleRequest = {
          name: formattedName,
          description: form.description.trim() || undefined,
          hierarchy: form.hierarchy,
        };
        await roleService.create(payload);
      } else if (role) {
        const payload: UpdateRoleRequest = {
          name: formattedName,
          description: form.description.trim() || undefined,
          hierarchy: form.hierarchy,
        };
        await roleService.update(role.id, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "create" ? "Create New Role" : "Edit Role"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "create"
                ? "Define a new role for staff members"
                : `Editing ${role?.name?.replace(/_/g, " ")}`}
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
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Role name will be formatted to uppercase with underscores
              (e.g., "Lab Technician" → <code className="bg-amber-100 px-1 rounded">LAB_TECHNICIAN</code>).
              This is used as the staff code prefix.
            </p>
          </div>

          <Input
            label="Role Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Lab Technician, Fertility Specialist"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this role's responsibilities"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hierarchy Level
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="100"
                value={form.hierarchy}
                onChange={(e) => setForm({ ...form, hierarchy: Number(e.target.value) })}
                className="flex-1 accent-primary-600"
              />
              <span className="text-sm font-mono text-gray-600 min-w-[3ch] text-center">
                {form.hierarchy}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Lower number = higher privilege (Admin = 1, Viewer = 100)
            </p>
          </div>

          {/* Preview */}
          {form.name.trim() && (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1.5">Preview:</p>
              <div className="flex items-center gap-2">
                <Badge variant="purple">
                  {form.name.trim().toUpperCase().replace(/\s+/g, "_")}
                </Badge>
                <span className="text-xs text-gray-400">
                  Code prefix: <strong>{form.name.trim().toUpperCase().slice(0, 3)}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} icon={<Shield className="w-4 h-4" />}>
              {mode === "create" ? "Create Role" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Role Confirm Dialog ────────────────────────────────

function DeleteRoleDialog({
  role,
  userCount,
  onClose,
  onConfirm,
  loading,
}: {
  role: Role;
  userCount: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Role</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete{" "}
            <strong>{role.name?.replace(/_/g, " ")}</strong>?
          </p>
          {userCount > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <strong>{userCount} user(s)</strong> are currently assigned to this role.
              They will need to be reassigned before deletion.
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={loading}>
            Delete Role
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Role Management Page ─────────────────────────────────────

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<"create" | "edit" | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await roleService.getAll();
      setRoles(res.data || []);
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roleService.delete(deleteTarget.id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete role:", err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Sort by hierarchy (ascending)
  const sortedRoles = [...roles].sort((a, b) => a.hierarchy - b.hierarchy);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define roles and their hierarchy ({roles.length} total)
          </p>
        </div>
        <Button
          onClick={() => setShowModal("create")}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Role
        </Button>
      </div>

      {/* Roles Grid */}
      {sortedRoles.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            No roles defined yet. Create your first role to get started.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRoles.map((role) => {
            const userCount = role._count?.users ?? 0;
            const permCount = role._count?.permissions ?? 0;

            return (
              <Card
                key={role.id}
                className="hover:shadow-md transition-shadow duration-200"
              >
                <div className="space-y-4">
                  {/* Role Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {role.name?.replace(/_/g, " ")}
                        </h3>
                        {role.description && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      Lv.{role.hierarchy}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {userCount} user{userCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      {permCount} permission{permCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowModal("edit");
                      }}
                      icon={<Edit className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(role)}
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <RoleFormModal
          mode={showModal}
          role={selectedRole}
          onClose={() => {
            setShowModal(null);
            setSelectedRole(null);
          }}
          onSuccess={() => loadData()}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteRoleDialog
          role={deleteTarget}
          userCount={deleteTarget._count?.users ?? 0}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
