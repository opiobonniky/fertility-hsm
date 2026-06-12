import * as appointmentService from "./appointment.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getById = asyncHandler(async (req, res) => {
  const data = await appointmentService.getById(req.params.id);
  res.status(200).json({ success: true, data });
});

export const getAll = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getCalendar = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: "startDate and endDate are required" });
  }
  const data = await appointmentService.getCalendar(startDate, endDate);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await appointmentService.create(req.body, req.user.id);
  res.status(201).json({ success: true, message: "Appointment created", data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await appointmentService.update(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Appointment updated", data });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await appointmentService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: "Appointment status updated", data });
});
