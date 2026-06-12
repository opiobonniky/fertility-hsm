import * as taskService from "./task.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getById = asyncHandler(async (req, res) => {
  const data = await taskService.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const getAll = asyncHandler(async (req, res) => {
  const result = await taskService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getMyTasks = asyncHandler(async (req, res) => {
  const data = await taskService.getMyTasks(req.user.id, req.query.status);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await taskService.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Task created", data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await taskService.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Task updated", data });
});

export const complete = asyncHandler(async (req, res) => {
  const data = await taskService.complete(req.params.id, req.user.id, req.body.notes);
  res.status(200).json({ success: true, message: "Task completed", data });
});
