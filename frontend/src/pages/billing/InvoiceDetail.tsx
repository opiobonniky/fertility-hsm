import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Receipt, CalendarDays, User, DollarSign,
  FileText, AlertCircle, Building2, Clock, TrendingUp,
  XCircle, Banknote, CreditCard, Plus, Save, X, Printer,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference?: string | null;
  paymentDate: string;
  notes?: string | null;
  receivedBy?: { id: string; firstName: string; lastName: string };
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  patientId: string;
  dueDate: string;
  branch?: string | null;
  currency: string;
  subTotal: number;
  vatRate: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  insuranceClaim?: boolean | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { id: string; firstName: string; lastName: string; mrn: string; phone: string };
  lineItems: LineItem[];
  payments: Payment[];
  createdBy?: { id: string; firstName: string; lastName: string };
}

// ── Helpers ────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  PAID: "success",
  PARTIALLY_PAID: "warning",
  DRAFT: "neutral",
  SENT: "info",
  OVERDUE: "danger",
  CANCELLED: "danger",
};

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="w-4 h-4" />,
  CREDIT_CARD: <CreditCard className="w-4 h-4" />,
  WIRE_TRANSFER: <DollarSign className="w-4 h-4" />,
  CHEQUE: <FileText className="w-4 h-4" />,
  INSURANCE: <Building2 className="w-4 h-4" />,
};

const PAYMENT_METHODS = ["CASH", "CREDIT_CARD", "WIRE_TRANSFER", "CHEQUE", "INSURANCE"];

// ── Sub-components ─────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-1.5 rounded-md bg-white text-gray-500 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

// ── Cancel Dialog ──────────────────────────────────────────────

function CancelDialog({
  invoiceNumber,
  onClose,
  onConfirm,
  loading,
}: {
  invoiceNumber: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Cancel Invoice</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to cancel <strong>{invoiceNumber}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Invoice
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={loading}>
            Cancel Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Receipt Preview ────────────────────────────────────────────

function ReceiptPreview({ inv, onClose }: { inv: InvoiceDetail; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const clinicName = "Life Sciences Women's Health";
  const paymentRatio = inv.totalAmount > 0 ? inv.paidAmount / inv.totalAmount : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 p-4 overflow-y-auto print:bg-white print:p-0">
      {/* ── Print Controls ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 print:hidden max-w-[210mm] mx-auto w-full">
        <h2 className="text-lg font-semibold text-white">Receipt Preview</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Print Receipt
          </Button>
          <Button variant="outline" onClick={onClose} className="!text-white !border-white/30 !hover:bg-white/10">
            Close
          </Button>
        </div>
      </div>

      {/* ── Receipt Content ─────────────────────────────────── */}
      <div
        className="receipt-content mx-auto w-full max-w-[210mm] bg-white rounded-xl shadow-2xl p-8 print:rounded-none print:shadow-none print:p-6"
        style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-200 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{clinicName}</h1>
          <p className="text-sm text-gray-500 mt-1">Fertility &amp; IVF Center</p>
          <p className="text-xs text-gray-400 mt-1">Receipt — {inv.invoiceNumber}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Patient Details */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patient</h3>
            {inv.patient ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  {inv.patient.firstName} {inv.patient.lastName}
                </p>
                <p className="text-xs text-gray-500">MRN: {inv.patient.mrn}</p>
                <p className="text-xs text-gray-500">Phone: {inv.patient.phone}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}
          </div>
          {/* Invoice Details */}
          <div className="text-right">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invoice Info</h3>
            <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
            <p className="text-xs text-gray-500">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
            {inv.branch && <p className="text-xs text-gray-500">{inv.branch}</p>}
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Description</th>
              <th className="text-right py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Qty</th>
              <th className="text-right py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Unit Price</th>
              <th className="text-right py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {inv.lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">No line items</td>
              </tr>
            ) : (
              inv.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-900">{item.description}</td>
                  <td className="py-2.5 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-2.5 text-right text-gray-900">
                    {inv.currency} {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    {inv.currency} {item.totalPrice.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-gray-200 pt-3 mb-6">
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm text-gray-900">{inv.currency} {inv.subTotal.toLocaleString()}</span>
          </div>
          {inv.vatRate > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-600">VAT ({(inv.vatRate * 100).toFixed(1)}%)</span>
              <span className="text-sm text-gray-900">{inv.currency} {inv.vatAmount.toLocaleString()}</span>
            </div>
          )}
          {inv.discountAmount > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-600">Discount</span>
              <span className="text-sm text-rose-600">-{inv.currency} {inv.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-200 mt-1">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-base font-bold text-gray-900">{inv.currency} {inv.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payments */}
        {inv.payments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Payment History ({inv.payments.length})
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Method</th>
                  <th className="text-left py-1.5 text-xs text-gray-500 font-medium">Reference</th>
                  <th className="text-right py-1.5 text-xs text-gray-500 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="py-1.5 text-gray-900">{payment.method.replace(/_/g, " ")}</td>
                    <td className="py-1.5 text-gray-500">{payment.reference || "—"}</td>
                    <td className="py-1.5 text-right text-emerald-700">
                      +{inv.currency} {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Paid Amount</span>
            <span className="font-medium text-emerald-700">
              {inv.currency} {inv.paidAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Balance Due</span>
            <span className={`font-medium ${inv.balanceAmount > 0 ? "text-amber-700" : "text-gray-900"}`}>
              {inv.currency} {inv.balanceAmount.toLocaleString()}
            </span>
          </div>
          {inv.paidAmount > 0 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${paymentRatio >= 1 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(paymentRatio * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">
            This is a computer-generated receipt. No signature required.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Generated on {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .receipt-content { box-shadow: none !important; border-radius: 0 !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inv, setInv] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [sending, setSending] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: InvoiceDetail }>(`/invoices/${id}`);
      setInv(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setPaymentNotes("");
    setShowPaymentForm(false);
    setError(null);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inv) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    if (amount > inv.balanceAmount && !confirm(`The payment amount (${inv.currency} ${amount.toLocaleString()}) exceeds the remaining balance (${inv.currency} ${inv.balanceAmount.toLocaleString()}). Continue?`)) {
      return;
    }
    setProcessingPayment(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        amount,
        method: paymentMethod,
      };
      if (paymentReference) payload.reference = paymentReference;
      if (paymentNotes) payload.notes = paymentNotes;

      await api.post(`/invoices/${id}/payments`, payload);
      resetPaymentForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSend = async () => {
    if (!id) return;
    setSending(true);
    try {
      await api.patch(`/invoices/${id}/send`);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await api.patch(`/invoices/${id}/cancel`);
      setShowCancelDialog(false);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to cancel invoice");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader />;

  if (error && !inv) return (
    <div className="text-center py-16">
      <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{error}</p>
      <Link to="/billing" className="text-primary-600 text-sm mt-2 inline-block">Back to billing</Link>
    </div>
  );

  if (!inv) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Invoice not found</p>
      <Link to="/billing" className="text-primary-600 text-sm mt-2 inline-block">Back to billing</Link>
    </div>
  );

  const canSend = inv.status === "DRAFT";
  const isEditable = inv.status === "DRAFT" || inv.status === "SENT";
  const isCancellable = inv.status === "DRAFT" || inv.status === "SENT" || inv.status === "PARTIALLY_PAID";
  const canAcceptPayment = inv.status !== "PAID" && inv.status !== "CANCELLED";
  const paymentRatio = inv.totalAmount > 0 ? inv.paidAmount / inv.totalAmount : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/billing"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{inv.invoiceNumber}</h1>
            <Badge variant={STATUS_VARIANTS[inv.status] || "neutral"} size="sm">
              {inv.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {inv.patient
              ? `${inv.patient.firstName} ${inv.patient.lastName}`
              : "Unknown patient"}
            {inv.patient?.mrn && (
              <> · <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{inv.patient.mrn}</code></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSend && (
            <Button
              variant="primary"
              onClick={handleSend}
              isLoading={sending}
              icon={<TrendingUp className="w-4 h-4" />}
            >
              {sending ? "Sending..." : "Mark as Sent"}
            </Button>
          )}
          {isEditable && (
            <Button
              variant="outline"
              onClick={() => navigate(`/billing/${id}/edit`)}
              icon={<FileText className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowReceipt(true)}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Receipt
          </Button>
          {canAcceptPayment && !showPaymentForm && (
            <Button
              variant="primary"
              onClick={() => setShowPaymentForm(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Record Payment
            </Button>
          )}
          {isCancellable && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              icon={<XCircle className="w-4 h-4" />}
            >
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Cancel Dialog ───────────────────────────────────── */}
      {showCancelDialog && (
        <CancelDialog
          invoiceNumber={inv.invoiceNumber}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancel}
          loading={cancelling}
        />
      )}

      {/* ── Receipt Preview ──────────────────────────────────── */}
      {showReceipt && (
        <ReceiptPreview inv={inv} onClose={() => setShowReceipt(false)} />
      )}

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{inv.currency} {inv.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Amount</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{inv.currency} {inv.paidAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Paid</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{inv.currency} {inv.balanceAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Balance</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{new Date(inv.dueDate).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Due Date</p>
          </div>
        </Card>
      </div>

      {/* Payment Progress */}
      {inv.status !== "CANCELLED" && inv.totalAmount > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Payment Progress</span>
            <span className="text-xs text-gray-500">{Math.round(paymentRatio * 100)}% paid</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                paymentRatio >= 1 ? "bg-emerald-500" :
                paymentRatio >= 0.5 ? "bg-amber-500" :
                "bg-rose-500"
              }`}
              style={{ width: `${Math.min(paymentRatio * 100, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Details */}
        <SectionCard title="Invoice Details">
          <InfoRow icon={<Receipt className="w-4 h-4" />} label="Invoice Number" value={inv.invoiceNumber} />
          <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Due Date" value={new Date(inv.dueDate).toLocaleDateString()} />
          {inv.branch && <InfoRow icon={<Building2 className="w-4 h-4" />} label="Branch" value={inv.branch} />}
          <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Currency" value={inv.currency} />
          <InfoRow icon={<TrendingUp className="w-4 h-4" />} label="Insurance Claim" value={inv.insuranceClaim ? "Yes" : "No"} />
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Created / Updated</p>
            <p className="text-xs text-gray-600">
              {new Date(inv.createdAt).toLocaleDateString()}
              {inv.updatedAt !== inv.createdAt && ` · Updated ${new Date(inv.updatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </SectionCard>

        {/* Patient Info */}
        <SectionCard title="Patient Information">
          {inv.patient ? (
            <>
              <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={`${inv.patient.firstName} ${inv.patient.lastName}`} />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="MRN" value={inv.patient.mrn} />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Phone" value={inv.patient.phone} />
              <Link
                to={`/patients/${inv.patient.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-1"
              >
                <User className="w-3.5 h-3.5" /> View Full Profile
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">Patient information not available</p>
          )}
          {inv.createdBy && (
            <InfoRow icon={<User className="w-4 h-4" />} label="Created By" value={`${inv.createdBy.firstName} ${inv.createdBy.lastName}`} />
          )}
        </SectionCard>
      </div>

      {/* ── Payment Form ────────────────────────────────────── */}
      {showPaymentForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="Record Payment" subtitle="Enter payment details" />
            <Button type="button" variant="ghost" size="sm" onClick={resetPaymentForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Payment Amount *"
                type="number"
                step="0.01"
                min="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Amount in ${inv.currency}`}
                icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                helperText={`Balance: ${inv.currency} ${inv.balanceAmount.toLocaleString()}`}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === method
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {PAYMENT_METHOD_ICONS[method]}
                      {method.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction/cheque/receipt number"
                icon={<FileText className="w-4 h-4 text-gray-400" />}
              />
              <Input
                label="Notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" size="sm" onClick={resetPaymentForm}>
                Cancel
              </Button>
              <Button type="submit" isLoading={processingPayment} icon={<Save className="w-4 h-4" />}>
                {processingPayment ? "Recording..." : `Record Payment`}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Line Items ──────────────────────────────────────── */}
      <Card>
        <CardHeader title="Line Items" subtitle={`${inv.lineItems.length} item(s)`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium uppercase">Description</th>
                <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium uppercase">Qty</th>
                <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium uppercase">Unit Price</th>
                <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-900">{item.description}</td>
                  <td className="py-3 px-3 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-gray-900">{inv.currency} {item.unitPrice.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-medium text-gray-900">{inv.currency} {item.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-2 px-3 text-right text-sm text-gray-500">Subtotal</td>
                <td className="py-2 px-3 text-right text-sm text-gray-900">{inv.currency} {inv.subTotal.toLocaleString()}</td>
              </tr>
              {inv.vatRate > 0 && (
                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right text-sm text-gray-500">VAT ({inv.vatRate * 100}%)</td>
                  <td className="py-2 px-3 text-right text-sm text-gray-900">{inv.currency} {inv.vatAmount.toLocaleString()}</td>
                </tr>
              )}
              {inv.discountAmount > 0 && (
                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right text-sm text-gray-500">Discount</td>
                  <td className="py-2 px-3 text-right text-sm text-rose-600">-{inv.currency} {inv.discountAmount.toLocaleString()}</td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="py-3 px-3 text-right font-semibold text-gray-900">Total</td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">{inv.currency} {inv.totalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ── Payments ────────────────────────────────────────── */}
      {inv.payments.length > 0 && (
        <Card>
          <CardHeader title="Payment History" subtitle={`${inv.payments.length} payment(s)`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium uppercase">Date</th>
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium uppercase">Method</th>
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium uppercase">Reference</th>
                  <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium uppercase">Received By</th>
                  <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {PAYMENT_METHOD_ICONS[payment.method] || <DollarSign className="w-4 h-4 text-gray-400" />}
                        <span className="text-gray-900">{payment.method.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{payment.reference || "—"}</td>
                    <td className="py-3 px-3 text-gray-900">
                      {payment.receivedBy ? `Dr. ${payment.receivedBy.firstName} ${payment.receivedBy.lastName}` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-600">+{inv.currency} {payment.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Notes ────────────────────────────────────────────── */}
      {inv.notes && (
        <Card>
          <CardHeader title="Notes" />
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inv.notes}</p>
        </Card>
      )}
    </div>
  );
}
