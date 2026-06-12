import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

// ── Tanks ──────────────────────────────────────────────────────
export const getTanks = () =>
  prisma.cryoTank.findMany({ orderBy: { name: "asc" } });

export const createTank = (data) =>
  prisma.cryoTank.create({ data });

export const updateTank = async (id, data) => {
  const tank = await prisma.cryoTank.findUnique({ where: { id } });
  if (!tank) throw new AppError("Tank not found", 404);
  return prisma.cryoTank.update({ where: { id }, data });
};

export const getTankContents = async (id) => {
  const [embryos, sperm, oocytes] = await Promise.all([
    prisma.embryoCryo.findMany({ where: { tankId: id }, include: { cycle: { include: { couple: { include: { wifePatient: { select: { firstName: true, lastName: true, mrn: true } } } } } } } }),
    prisma.spermCryo.findMany({ where: { tankId: id }, include: { patient: { select: { firstName: true, lastName: true, mrn: true } } } }),
    prisma.oocyteCryo.findMany({ where: { tankId: id }, include: { patient: { select: { firstName: true, lastName: true, mrn: true } } } }),
  ]);
  return { embryos, sperm, oocytes };
};

// ── Embryo Cryo ────────────────────────────────────────────────
export const getEmbryoCryos = (filters) =>
  prisma.embryoCryo.findMany({
    where: filters,
    include: { cycle: { include: { couple: true } }, tank: true },
    orderBy: { createdAt: "desc" },
  });

export const createEmbryoCryo = (data, userId) =>
  prisma.embryoCryo.create({ data: { ...data, createdById: userId } });

export const discardEmbryoCryo = async (id, reason) => {
  const record = await prisma.embryoCryo.findUnique({ where: { id } });
  if (!record) throw new AppError("Record not found", 404);
  return prisma.embryoCryo.update({
    where: { id },
    data: { status: "DISCARDED", discardedAt: new Date(), discardedReason: reason },
  });
};

// ── Sperm/Oocyte Cryo ──────────────────────────────────────────
export const getSpermCryos = (filters) =>
  prisma.spermCryo.findMany({ where: filters, include: { patient: true, tank: true }, orderBy: { createdAt: "desc" } });

export const createSpermCryo = (data, userId) =>
  prisma.spermCryo.create({ data: { ...data, createdById: userId } });

export const getOocyteCryos = (filters) =>
  prisma.oocyteCryo.findMany({ where: filters, include: { patient: true, tank: true }, orderBy: { createdAt: "desc" } });

export const createOocyteCryo = (data, userId) =>
  prisma.oocyteCryo.create({ data: { ...data, createdById: userId } });

// ── Expiring ───────────────────────────────────────────────────
export const getExpiring = async () => {
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const [embryos, sperm, oocytes] = await Promise.all([
    prisma.embryoCryo.findMany({ where: { renewalDate: { lte: thirtyDays }, status: "STORED" }, include: { cycle: { include: { couple: true } }, tank: true } }),
    prisma.spermCryo.findMany({ where: { renewalDate: { lte: thirtyDays }, status: "STORED" }, include: { patient: true, tank: true } }),
    prisma.oocyteCryo.findMany({ where: { renewalDate: { lte: thirtyDays }, status: "STORED" }, include: { patient: true, tank: true } }),
  ]);
  return { embryos, sperm, oocytes };
};
