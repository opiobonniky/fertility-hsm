import * as embryologyService from "./embryology.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

// ── Embryology Records (Daily Grading) ─────────────────────────
export const getEmbryologyRecords = asyncHandler(async (req, res) => {
  const data = await embryologyService.getEmbryologyRecords(req.params.cycleId);
  res.status(200).json({ success: true, data });
});

export const createEmbryologyRecord = asyncHandler(async (req, res) => {
  const data = await embryologyService.createEmbryologyRecord(req.params.cycleId, req.body, req.user.id);
  res.status(201).json({ success: true, message: "Embryology record created", data });
});

export const updateEmbryologyRecord = asyncHandler(async (req, res) => {
  const data = await embryologyService.updateEmbryologyRecord(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: "Embryology record updated", data });
});

// ── Biopsy ──────────────────────────────────────────────────────
export const getBiopsies = asyncHandler(async (req, res) => {
  const data = await embryologyService.getBiopsies(req.params.cycleId);
  res.status(200).json({ success: true, data });
});

export const createBiopsy = asyncHandler(async (req, res) => {
  const data = await embryologyService.createBiopsy(req.params.cycleId, req.body, req.user.id);
  res.status(201).json({ success: true, message: "Biopsy recorded", data });
});

export const getNGSResults = asyncHandler(async (req, res) => {
  const data = await embryologyService.getNGSResults(req.params.cycleId);
  res.status(200).json({ success: true, data });
});

export const createNGSResult = asyncHandler(async (req, res) => {
  const data = await embryologyService.createNGSResult(req.params.biopsyId, req.body, req.user.id);
  res.status(201).json({ success: true, message: "NGS result recorded", data });
});
