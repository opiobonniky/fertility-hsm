import { prisma } from "../../config/db.js";

export const getAllClinics = async () => {
  return prisma.clinic.findMany({
    where: { isActive: true },
    select: { id: true, name: true, branch: true },
    orderBy: { name: "asc" },
  });
};
