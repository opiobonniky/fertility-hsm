import * as clinicService from "./clinic.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getAll = asyncHandler(async (_req, res) => {
  const data = await clinicService.getAllClinics();
  res.status(200).json({ success: true, data });
});
