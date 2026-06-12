import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
};

export const getAll = async (filters) => {
  const { patientId, status } = filters;
  const pageNum = Number(filters.page) || 1;
  const limitNum = Number(filters.limit) || 20;
  const where = {};
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        lineItems: true,
        payments: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.invoice.count({ where }),
  ]);

  return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

export const getById = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
      lineItems: true,
      payments: {
        include: { receivedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { paymentDate: "desc" },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!invoice) throw new AppError("Invoice not found", 404);
  return invoice;
};

export const create = async (data, userId) => {
  const invoiceNumber = await generateInvoiceNumber();

  // Calculate totals from line items
  const lineItems = data.lineItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice,
  }));
  const subTotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const vatAmount = subTotal * (data.vatRate || 0);
  const totalAmount = subTotal + vatAmount - (data.discountAmount || 0);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      patientId: data.patientId,
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      branch: data.branch,
      currency: data.currency || "AED",
      subTotal,
      vatRate: data.vatRate || 0,
      vatAmount,
      discountAmount: data.discountAmount || 0,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      insuranceClaim: data.insuranceClaim || false,
      notes: data.notes,
      createdById: userId,
      lineItems: { create: lineItems },
    },
    include: { lineItems: true, patient: true },
  });

  logger.info(`Invoice created: ${invoice.invoiceNumber} for AED ${totalAmount}`);
  return invoice;
};

export const addPayment = async (invoiceId, data, userId) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    throw new AppError("Cannot add payment to a paid or cancelled invoice", 400);
  }

  const payment = await prisma.payment.create({
    data: {
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      invoice: { connect: { id: invoiceId } },
      receivedBy: { connect: { id: userId } },
    },
  });

  // Update invoice totals
  const newPaidAmount = invoice.paidAmount + data.amount;
  const newBalanceAmount = invoice.totalAmount - newPaidAmount;
  const newStatus = newBalanceAmount <= 0 ? "PAID" : "PARTIALLY_PAID";

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount: newPaidAmount, balanceAmount: newBalanceAmount, status: newStatus },
  });

  logger.info(`Payment of AED ${data.amount} recorded for invoice ${invoice.invoiceNumber}`);
  return payment;
};

export const sendInvoice = async (id) => {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status !== "DRAFT") {
    throw new AppError("Only draft invoices can be sent", 400);
  }
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "SENT" },
  });
  logger.info(`Invoice sent: ${updated.invoiceNumber}`);
  return updated;
};

export const cancelInvoice = async (id) => {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  return prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
};

export const updateInvoice = async (id, data) => {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status !== "DRAFT" && invoice.status !== "SENT") {
    throw new AppError("Only draft or sent invoices can be edited", 400);
  }

  const updateData = {};
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
  if (data.branch !== undefined) updateData.branch = data.branch;
  if (data.currency) updateData.currency = data.currency;
  if (data.insuranceClaim !== undefined) updateData.insuranceClaim = data.insuranceClaim;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // If line items are provided, recalculate totals
  if (data.lineItems && data.lineItems.length > 0) {
    const lineItems = data.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));
    const subTotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatRate = data.vatRate ?? invoice.vatRate;
    const vatAmount = subTotal * vatRate;
    const discountAmount = data.discountAmount ?? invoice.discountAmount;
    const totalAmount = subTotal + vatAmount - discountAmount;

    updateData.subTotal = subTotal;
    updateData.vatRate = vatRate;
    updateData.vatAmount = vatAmount;
    updateData.discountAmount = discountAmount;
    updateData.totalAmount = totalAmount;
    updateData.balanceAmount = totalAmount - invoice.paidAmount;
    if (updateData.balanceAmount < 0) updateData.balanceAmount = 0;

    // Delete old line items and create new ones
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    updateData.lineItems = { create: lineItems };
  } else {
    // Update VAT/discount without changing line items
    if (data.vatRate !== undefined) {
      updateData.vatRate = data.vatRate;
      updateData.vatAmount = invoice.subTotal * data.vatRate;
    }
    if (data.discountAmount !== undefined) {
      updateData.discountAmount = data.discountAmount;
    }
    // Recalculate total if vat/discount changed
    if (data.vatRate !== undefined || data.discountAmount !== undefined) {
      const newVat = updateData.vatAmount ?? invoice.vatAmount;
      const newDiscount = updateData.discountAmount ?? invoice.discountAmount;
      updateData.totalAmount = invoice.subTotal + newVat - newDiscount;
      updateData.balanceAmount = updateData.totalAmount - invoice.paidAmount;
      if (updateData.balanceAmount < 0) updateData.balanceAmount = 0;
    }
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: { lineItems: true, patient: { select: { id: true, firstName: true, lastName: true, mrn: true } } },
  });

  logger.info(`Invoice updated: ${updated.invoiceNumber}`);
  return updated;
};

export const getPatientInvoices = async (patientId) => {
  return prisma.invoice.findMany({
    where: { patientId },
    include: { lineItems: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
};
