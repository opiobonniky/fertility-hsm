import { api } from "@/api/client";
import type { User } from "@/types";

// ── Response Types ────────────────────────────────────────────

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

export interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ── Role Types ────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  label?: string;
  description?: string;
  hierarchy: number;
  isActive: boolean;
  _count?: {
    users: number;
    permissions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  hierarchy?: number;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  hierarchy?: number;
}

// ── Permission Types ──────────────────────────────────────────

export interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  module: string;
}

export interface GroupedPermissions {
  module: string;
  permissions: Permission[];
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
  assignedAt: string;
}

// ── User Types ────────────────────────────────────────────────

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
  staffCode?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  phone?: string;
  isActive?: boolean;
}

// ── User Service ──────────────────────────────────────────────

export const userService = {
  getAll: () => api.get<ApiListResponse<User>>("/users"),

  getById: (id: string) => api.get<ApiSingleResponse<User>>(`/users/${id}`),

  getRoles: () => api.get<ApiListResponse<Role>>("/users/roles"),

  create: (data: CreateUserRequest) =>
    api.post<ApiSingleResponse<User>>("/users", data),

  update: (id: string, data: UpdateUserRequest) =>
    api.put<ApiSingleResponse<User>>(`/users/${id}`, data),

  deactivate: (id: string) =>
    api.patch<ApiSingleResponse<{ message: string }>>(`/users/${id}/deactivate`),
};

// ── Role Service ──────────────────────────────────────────────

export const roleService = {
  getAll: () => api.get<ApiListResponse<Role>>("/roles"),

  getById: (id: string) => api.get<ApiSingleResponse<Role>>(`/roles/${id}`),

  create: (data: CreateRoleRequest) =>
    api.post<ApiSingleResponse<Role>>("/roles", data),

  update: (id: string, data: UpdateRoleRequest) =>
    api.put<ApiSingleResponse<Role>>(`/roles/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiSingleResponse<{ message: string }>>(`/roles/${id}`),
};

// ── Permission Service ────────────────────────────────────────

export const permissionService = {
  getAll: () => api.get<ApiListResponse<Permission>>("/permissions"),

  getGrouped: () =>
    api.get<ApiSingleResponse<GroupedPermissions[]>>("/permissions/grouped"),

  getRolePermissions: (roleId: string) =>
    api.get<ApiListResponse<RolePermission>>(`/permissions/roles/${roleId}`),

  getAvailablePermissions: (roleId: string) =>
    api.get<ApiListResponse<Permission>>(
      `/permissions/roles/${roleId}/available`
    ),

  assign: (roleId: string, permissionId: string) =>
    api.post<ApiSingleResponse<RolePermission>>("/permissions/assign", {
      roleId,
      permissionId,
    }),

  remove: (roleId: string, permissionId: string) =>
    api.post<ApiSingleResponse<{ message: string }>>("/permissions/remove", {
      roleId,
      permissionId,
    }),
};
