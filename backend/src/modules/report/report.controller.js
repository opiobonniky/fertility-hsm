import * as reportService from "./report.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getKPI = asyncHandler(async (req, res) => {
  const data = await reportService.getKPI(req.query);
  res.status(200).json({ success: true, data });
});

export const getFertilizationRates = asyncHandler(async (req, res) => {
  const data = await reportService.getFertilizationRates(req.query);
  res.status(200).json({ success: true, data });
});

export const getCycleOutcomes = asyncHandler(async (req, res) => {
  const data = await reportService.getCycleOutcomes(req.query);
  res.status(200).json({ success: true, data });
});

export const getFinancialReport = asyncHandler(async (req, res) => {
  const data = await reportService.getFinancialReport(req.query);
  res.status(200).json({ success: true, data });
});
