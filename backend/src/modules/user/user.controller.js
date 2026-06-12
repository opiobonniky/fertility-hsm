import * as userService from "./user.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (_req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ success: true, data: users });
});

export const getById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, message: "User created", data: user });
});

export const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, message: "User updated", data: user });
});

export const deactivate = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  res.status(200).json({ success: true, message: "User deactivated", data: user });
});

export const getRoles = asyncHandler(async (_req, res) => {
  const roles = await userService.getRoles();
  res.status(200).json({ success: true, data: roles });
});

export const getPhysicians = asyncHandler(async (_req, res) => {
  const physicians = await userService.getPhysicians();
  res.status(200).json({ success: true, data: physicians });
});
