import * as cryoService from "./cryo.service.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

export const getTanks = asyncHandler(async (_req, res) => {
  const data = await cryoService.getTanks();
  res.status(200).json({ success: true, data });
});

export const createTank = asyncHandler(async (req, res) => {
  const data = await cryoService.createTank(req.body);
  res.status(201).json({ success: true, data });
});

export const updateTank = asyncHandler(async (req, res) => {
  const data = await cryoService.updateTank(req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

export const getTankContents = asyncHandler(async (req, res) => {
  const data = await cryoService.getTankContents(req.params.id);
  res.status(200).json({ success: true, data });
});

export const getEmbryos = asyncHandler(async (req, res) => {
  const data = await cryoService.getEmbryoCryos(req.query);
  res.status(200).json({ success: true, data });
});

export const createEmbryoCryo = asyncHandler(async (req, res) => {
  const data = await cryoService.createEmbryoCryo(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

export const discardEmbryoCryo = asyncHandler(async (req, res) => {
  const data = await cryoService.discardEmbryoCryo(req.params.id, req.body.reason);
  res.status(200).json({ success: true, message: "Embryo cryo record discarded", data });
});

export const getSperm = asyncHandler(async (req, res) => {
  const data = await cryoService.getSpermCryos(req.query);
  res.status(200).json({ success: true, data });
});

export const createSpermCryo = asyncHandler(async (req, res) => {
  const data = await cryoService.createSpermCryo(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

export const getOocytes = asyncHandler(async (req, res) => {
  const data = await cryoService.getOocyteCryos(req.query);
  res.status(200).json({ success: true, data });
});

export const createOocyteCryo = asyncHandler(async (req, res) => {
  const data = await cryoService.createOocyteCryo(req.body, req.user.id);
  res.status(201).json({ success: true, data });
});

export const getExpiring = asyncHandler(async (_req, res) => {
  const data = await cryoService.getExpiring();
  res.status(200).json({ success: true, data });
});
