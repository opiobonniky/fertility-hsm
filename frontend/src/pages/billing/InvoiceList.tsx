import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  Receipt, Search, CalendarDays, User, DollarSign,
  TrendingUp, Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  dueDate: string;
  currency: string;
  branch?: string | null;
  createdAt: string;
  patient?: { id: string; firstName: string; lastName: string; mrn: string };
  lineItems?: any[];
  payments?: any[];
}

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  PAID: "success",
  PARTIALLY_PAID: "warning",
  DRAFT: "neutral",
  SENT: "info",
  OVERDUE: "danger",
  CANCELLED: "danger",
};

export function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Invoice[]; total: number }>("/invoices");
      setInvoices(res.data || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statusCounts = invoices.reduce((acc: Record<string, number>, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== "PAID" && inv.status !== "CANCELLED")
    .reduce((sum, inv) => sum + inv.balanceAmount, 0);

  const filtered = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        `${inv.patient?.firstName} ${inv.patient?.lastName}`.toLowerCase().includes(q) ||
        inv.patient?.mrn?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {!loading && `${invoices.length} total`}
          </p>
        </div>
        <Button onClick={() => navigate("/billing/new")} icon={<Plus className="w-4 h-4" />}>
          Create Invoice
        </Button>
      </div>

      {/* Summary Bar */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{invoices.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Invoices</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {invoices.filter((inv) => inv.status === "PAID").length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Paid</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {invoices.filter((inv) => inv.status === "OVERDUE").length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">
                {totalOutstanding.toLocaleString()} AED
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice or patient..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setStatusFilter(""); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${!statusFilter ? "bg-primary-50 border-primary-200 text-primary-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              All ({invoices.length})
            </button>
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${statusFilter === status ? "bg-primary-50 border-primary-200 text-primary-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                {status.replace(/_/g, " ")} ({count})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? "Try a different search term" : "No invoices have been created yet"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => {
            const paymentRatio = inv.totalAmount > 0 ? inv.paidAmount / inv.totalAmount : 0;
            return (
              <Link key={inv.id} to={`/billing/${inv.id}`} className="block">
                <Card className="hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      inv.status === "PAID" ? "bg-emerald-50" :
                      inv.status === "OVERDUE" ? "bg-rose-50" :
                      inv.status === "CANCELLED" ? "bg-gray-50" :
                      "bg-blue-50"
                    }`}>
                      <Receipt className={`w-5 h-5 ${
                        inv.status === "PAID" ? "text-emerald-600" :
                        inv.status === "OVERDUE" ? "text-rose-600" :
                        "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</span>
                        <Badge variant={STATUS_VARIANTS[inv.status] || "neutral"} size="sm">
                          {inv.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {inv.patient && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {inv.patient.firstName} {inv.patient.lastName}
                          <span className="text-xs text-gray-400"> ({inv.patient.mrn})</span>
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {inv.currency} {inv.totalAmount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Paid: {inv.currency} {inv.paidAmount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                        {inv.branch && (
                          <span>{inv.branch}</span>
                        )}
                      </div>
                      {/* Payment progress bar */}
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            paymentRatio >= 1 ? "bg-emerald-500" :
                            paymentRatio > 0 ? "bg-amber-500" :
                            "bg-gray-200"
                          }`}
                          style={{ width: `${Math.min(paymentRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
