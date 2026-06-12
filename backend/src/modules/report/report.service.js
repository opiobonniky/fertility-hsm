import { prisma } from "../../config/db.js";

export const getKPI = async (filters) => {
  const { startDate, endDate } = filters;
  const dateFilter = startDate && endDate
    ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
    : {};

  const totalCycles = await prisma.cycle.count({ where: dateFilter });
  const completedCycles = await prisma.cycle.count({ where: { ...dateFilter, status: "CYCLE_COMPLETED" } });
  const pregnancies = await prisma.pregnancyTest.count({
    where: { ...dateFilter, bhcgLevel: { gt: 0 } },
  });
  const totalOPU = await prisma.oPURecord.count({ where: dateFilter });
  const cancelledCycles = await prisma.cycle.count({ where: { ...dateFilter, status: "CYCLE_CANCELLED" } });

  return {
    totalCycles,
    completedCycles,
    pregnancies,
    totalOPU,
    cancelledCycles,
    successRate: totalCycles > 0 ? Math.round((pregnancies / completedCycles) * 100) : 0,
  };
};

export const getFertilizationRates = async (filters) => {
  const { startDate, endDate } = filters;
  const dateFilter = startDate && endDate
    ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
    : {};

  const cycles = await prisma.cycle.findMany({
    where: { ...dateFilter },
    include: {
      opuRecord: true,
    },
  });

  const totalOocytes = cycles.reduce((sum, c) => sum + (c.opuRecord?.oocyteCount || 0), 0);
  const totalMII = cycles.reduce((sum, c) => sum + (c.opuRecord?.miiOocyteCount || 0), 0);

  return {
    totalCycles: cycles.length,
    totalOocytes,
    totalMII,
    maturityRate: totalOocytes > 0 ? Math.round((totalMII / totalOocytes) * 100) : 0,
  };
};

export const getCycleOutcomes = async (filters) => {
  const { startDate, endDate } = filters;
  const dateFilter = startDate && endDate
    ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
    : {};

  const outcomes = await prisma.pregnancyOutcome.findMany({
    where: dateFilter,
    include: {
      cycle: {
        include: {
          couple: {
            include: {
              wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return outcomes;
};

export const getFinancialReport = async (filters) => {
  const { startDate, endDate } = filters;
  const dateFilter = startDate && endDate
    ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
    : {};

  const invoices = await prisma.invoice.findMany({
    where: { ...dateFilter, status: { not: "CANCELLED" } },
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

  // Payments by method
  const payments = await prisma.payment.findMany({
    where: dateFilter,
  });
  const paymentsByMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  return {
    totalBilled,
    totalPaid,
    totalOutstanding,
    collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0,
    paymentsByMethod,
    invoiceCount: invoices.length,
  };
};
