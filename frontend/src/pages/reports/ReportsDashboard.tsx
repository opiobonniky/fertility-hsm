import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { usePermission } from "@/components/auth/PermissionGate";
import { api } from "@/api/client";
import {
  BarChart3, TrendingUp, Activity, DollarSign,
  Syringe, Heart, ChevronDown, ChevronUp,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────
interface KPIData {
  totalCycles: number;
  completedCycles: number;
  pregnancies: number;
  totalOPU: number;
  cancelledCycles: number;
  successRate: number;
}

interface FertilizationData {
  totalCycles: number;
  totalOocytes: number;
  totalMII: number;
  maturityRate: number;
}

interface CycleOutcome {
  id: string;
  outcome: string;
  deliveryDate?: string;
  weight?: number;
  height?: number;
  notes?: string;
  cycle?: {
    id: string;
    cycleNumber: number;
    artType: string;
    couple?: {
      wifePatient?: { firstName: string; lastName: string; mrn: string };
    };
  };
  createdAt: string;
}

interface FinancialData {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  collectionRate: number;
  paymentsByMethod: Record<string, number>;
  invoiceCount: number;
}

// ── Helpers ────────────────────────────────────────────────────
function formatCurrency(amount: number, currency = "AED") {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getQuarterDates() {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) * 3;
  return {
    startDate: new Date(year, quarter, 1).toISOString(),
    endDate: now.toISOString(),
  };
}

function getYearDates() {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
    endDate: now.toISOString(),
  };
}

// ── Mini Sparkline Bar ─────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ReportsDashboard() {
  const { user } = useAuthStore();
  const canViewKPI = usePermission("report:kpi");
  const canViewFinancial = usePermission("report:financial");
  const canViewOutcomes = usePermission("report:cycle-outcomes");

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"quarter" | "year" | "all">("year");

  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [fert, setFert] = useState<FertilizationData | null>(null);
  const [outcomes, setOutcomes] = useState<CycleOutcome[]>([]);
  const [financial, setFinancial] = useState<FinancialData | null>(null);

  const [expandedOutcome, setExpandedOutcome] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const dates = dateRange === "year" ? getYearDates()
      : dateRange === "quarter" ? getQuarterDates()
      : {};

    const params = dates.startDate ? { startDate: dates.startDate, endDate: dates.endDate } : {};

    try {
      const results = await Promise.allSettled([
        canViewKPI ? api.get<{ success: boolean; data: KPIData }>("/reports/kpi", params) : Promise.resolve(null),
        canViewKPI ? api.get<{ success: boolean; data: FertilizationData }>("/reports/kpi/fertilization", params) : Promise.resolve(null),
        canViewOutcomes ? api.get<{ success: boolean; data: CycleOutcome[] }>("/reports/cycle-outcomes", params) : Promise.resolve(null),
        canViewFinancial ? api.get<{ success: boolean; data: FinancialData }>("/reports/financial", params) : Promise.resolve(null),
      ]);

      if (results[0]?.status === "fulfilled" && results[0].value) setKpi(results[0].value.data);
      if (results[1]?.status === "fulfilled" && results[1].value) setFert(results[1].value.data);
      if (results[2]?.status === "fulfilled" && results[2].value) setOutcomes(results[2].value.data || []);
      if (results[3]?.status === "fulfilled" && results[3].value) setFinancial(results[3].value.data);
    } finally {
      setLoading(false);
    }
  }, [dateRange, canViewKPI, canViewFinancial, canViewOutcomes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & KPIs</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics, key performance indicators, and data exports</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(["quarter", "year", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  dateRange === range
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {range === "quarter" ? "This Quarter" : range === "year" ? "This Year" : "All Time"}
              </button>
            ))}
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
      </div>

      {loading && !kpi ? (
        <PageLoader />
      ) : (
        <>
          {/* ── KPI Overview ─────────────────────────────────── */}
          {canViewKPI && kpi && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Cycles</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.totalCycles}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white">
                    <Syringe className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-medium text-gray-700">{kpi.completedCycles}</span>
                  </div>
                  <MiniBar value={kpi.completedCycles} max={kpi.totalCycles} color="bg-purple-500" />
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Cancelled</span>
                    <span className="font-medium text-rose-600">{kpi.cancelledCycles}</span>
                  </div>
                  <MiniBar value={kpi.cancelledCycles} max={kpi.totalCycles} color="bg-rose-400" />
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {Number.isFinite(kpi.successRate) ? `${kpi.successRate}%` : "N/A"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {kpi.pregnancies} pregnancies from {kpi.completedCycles} completed cycles
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                    kpi.successRate >= 40                        ? "bg-green-500" : kpi.successRate >= 25 ? "bg-amber-500" : "bg-rose-500"
                      }`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <MiniBar value={Number.isFinite(kpi.successRate) ? kpi.successRate : 0} max={100} color={
                    Number.isFinite(kpi.successRate) && kpi.successRate >= 40 ? "bg-green-500" : Number.isFinite(kpi.successRate) && kpi.successRate >= 25 ? "bg-amber-500" : "bg-gray-300"
                  } />
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">OPU Procedures</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.totalOPU}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {kpi.totalCycles > 0
                        ? `${Math.round((kpi.totalOPU / kpi.totalCycles) * 100)}% of cycles had OPU`
                        : "No cycles yet"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </Card>

              {/* Fertilization Rate */}
              {fert && (
                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Oocyte Maturity Rate</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{fert.maturityRate}%</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fert.totalMII} MII of {fert.totalOocytes} oocytes
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                      <Heart className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">Total Oocytes</span>
                      <p className="font-semibold text-gray-900">{fert.totalOocytes}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">Mature (MII)</span>
                      <p className="font-semibold text-gray-900">{fert.totalMII}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── Cycle Outcomes ───────────────────────────────── */}
          {canViewOutcomes && outcomes.length > 0 && (
            <Card>
              <CardHeader
                title="Cycle Outcomes"
                subtitle={`${outcomes.length} outcome(s) recorded`}
              />
              <div className="space-y-2">
                {outcomes.map((o) => (
                  <div key={o.id} className="bg-gray-50 rounded-lg">
                    <button
                      onClick={() => setExpandedOutcome(expandedOutcome === o.id ? null : o.id)}
                      className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-green-100">
                          <Heart className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {o.cycle?.couple?.wifePatient?.firstName} {o.cycle?.couple?.wifePatient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Cycle #{o.cycle?.cycleNumber} ({o.cycle?.artType}) — {o.outcome}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : new Date(o.createdAt).toLocaleDateString()}
                        </span>
                        {expandedOutcome === o.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedOutcome === o.id && (
                      <div className="px-3 pb-3 text-xs text-gray-600 space-y-1 border-t border-gray-200 pt-2 ml-11">
                        <p><span className="font-medium text-gray-700">Outcome:</span> {o.outcome}</p>
                        {o.deliveryDate && <p><span className="font-medium text-gray-700">Delivery Date:</span> {new Date(o.deliveryDate).toLocaleDateString()}</p>}
                        {o.weight && <p><span className="font-medium text-gray-700">Weight:</span> {o.weight} kg</p>}
                        {o.height && <p><span className="font-medium text-gray-700">Height:</span> {o.height} cm</p>}
                        {o.notes && <p><span className="font-medium text-gray-700">Notes:</span> {o.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── No outcomes ─────────────────────────────────── */}
          {canViewOutcomes && outcomes.length === 0 && !loading && (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p>No cycle outcomes recorded yet</p>
              </div>
            </Card>
          )}

          {/* ── Financial Report ─────────────────────────────── */}
          {canViewFinancial && financial && (
            <Card>
              <CardHeader
                title="Financial Summary"
                subtitle={`${financial.invoiceCount} invoices`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Billed</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(financial.totalBilled)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600">Total Collected</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(financial.totalPaid)}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600">Outstanding</p>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(financial.totalOutstanding)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Collection Rate</p>
                  <p className="text-lg font-bold text-blue-700">{financial.collectionRate}%</p>
                </div>
              </div>

              {Object.keys(financial.paymentsByMethod).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payments by Method</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(financial.paymentsByMethod).map(([method, amount]) => (
                      <div key={method} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        <span className="text-gray-500">{method.replace(/_/g, " ")}:</span>
                        <span className="font-semibold text-gray-900 ml-1">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ── No permissions message ──────────────────────── */}
          {!canViewKPI && !canViewFinancial && !canViewOutcomes && (
            <Card>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">No report access</p>
                <p className="text-sm mt-1">Your role does not have permission to view reports.</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
