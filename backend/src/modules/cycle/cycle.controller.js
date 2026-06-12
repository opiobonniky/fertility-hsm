import * as cycleService from "./cycle.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const data = await cycleService.getDashboardData();
  res.status(200).json({ success: true, data });
});

export const getAll = asyncHandler(async (req, res) => {
  const result = await cycleService.searchCycles(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getById = asyncHandler(async (req, res) => {
  const cycle = await cycleService.getCycleById(req.params.id);
  res.status(200).json({ success: true, data: cycle });
});

export const create = asyncHandler(async (req, res) => {
  const cycle = await cycleService.createCycle(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Cycle created", data: cycle });
});

export const update = asyncHandler(async (req, res) => {
  const cycle = await cycleService.updateCycle(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Cycle updated", data: cycle });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const cycle = await cycleService.updateCycleStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: "Cycle status updated", data: cycle });
});

// Sub-resources (follicle, OPU, semen, embryology, ET, pregnancy)
export const getFollicles = asyncHandler(async (req, res) => {
  const data = await cycleService.getFollicleTrackings(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createFollicle = asyncHandler(async (req, res) => {
  const data = await cycleService.createFollicleTracking(req.params.id, req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

export const getOpu = asyncHandler(async (req, res) => {
  const data = await cycleService.getOPURecord(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createOpu = asyncHandler(async (req, res) => {
  const data = await cycleService.createOPURecord(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateOpu = asyncHandler(async (req, res) => {
  const data = await cycleService.updateOPURecord(req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const getSemen = asyncHandler(async (req, res) => {
  const data = await cycleService.getSemenData(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createSemen = asyncHandler(async (req, res) => {
  const data = await cycleService.createSemenData(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getEmbryology = asyncHandler(async (req, res) => {
  const data = await cycleService.getEmbryologyRecords(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createEmbryology = asyncHandler(async (req, res) => {
  const data = await cycleService.createEmbryologyRecord(req.params.id, req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

export const getET = asyncHandler(async (req, res) => {
  const data = await cycleService.getETRecord(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createET = asyncHandler(async (req, res) => {
  const data = await cycleService.createETRecord(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getPregnancyTest = asyncHandler(async (req, res) => {
  const data = await cycleService.getPregnancyTest(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createPregnancyTest = asyncHandler(async (req, res) => {
  const data = await cycleService.createPregnancyTest(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

export const getPregnancyOutcome = asyncHandler(async (req, res) => {
  const data = await cycleService.getPregnancyOutcome(req.params.id);
  res.status(200).json({ success: true, data });
});

export const createPregnancyOutcome = asyncHandler(async (req, res) => {
  const data = await cycleService.createPregnancyOutcome(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});
