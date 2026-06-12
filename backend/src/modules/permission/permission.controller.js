import * as permissionService from "./permission.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (req, res) => {
  const data = await permissionService.getAllPermissions();
  res.status(200).json({ success: true, data });
});

export const getGrouped = asyncHandler(async (req, res) => {
  const data = await permissionService.getPermissionsGrouped();
  res.status(200).json({ success: true, data });
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  const data = await permissionService.getPermissionsForRole(req.params.roleId);
  res.status(200).json({ success: true, data });
});

export const getAvailablePermissions = asyncHandler(async (req, res) => {
  const data = await permissionService.getAvailablePermissionsForRole(req.params.roleId);
  res.status(200).json({ success: true, data });
});

export const assign = asyncHandler(async (req, res) => {
  const { roleId, permissionId } = req.body;
  const data = await permissionService.assignPermissionToRole(roleId, permissionId, req.user.id);
  res.status(201).json({ success: true, message: "Permission assigned to role", data });
});

export const remove = asyncHandler(async (req, res) => {
  const { roleId, permissionId } = req.body;
  const data = await permissionService.removePermissionFromRole(roleId, permissionId);
  res.status(200).json({ success: true, message: data.message });
});
