import * as selectionOptionService from "./selectionOption.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getByCategory = asyncHandler(async (req, res) => {
  const data = await selectionOptionService.getByCategory(req.params.category);
  res.status(200).json({ success: true, data });
});

export const getAllGrouped = asyncHandler(async (_req, res) => {
  const data = await selectionOptionService.getAllGrouped();
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const option = await selectionOptionService.create(req.body);
  res.status(201).json({ success: true, message: "Option created", data: option });
});

export const update = asyncHandler(async (req, res) => {
  const option = await selectionOptionService.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Option updated", data: option });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await selectionOptionService.remove(req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

export const reorder = asyncHandler(async (req, res) => {
  const result = await selectionOptionService.reorder(req.body.items);
  res.status(200).json({ success: true, message: result.message });
});
