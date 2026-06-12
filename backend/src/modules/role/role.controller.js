import * as roleService from "./role.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (_req, res) => {
  const roles = await roleService.getAllRoles();
  res.status(200).json({ success: true, data: roles });
});

export const getById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  res.status(200).json({ success: true, data: role });
});

export const create = asyncHandler(async (req, res) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json({ success: true, message: "Role created", data: role });
});

export const update = asyncHandler(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Role updated", data: role });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await roleService.deleteRole(req.params.id);
  res.status(200).json({ success: true, message: result.message });
});
