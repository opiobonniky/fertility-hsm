import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import { Syringe, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import type { Cycle } from "@/types";

const ART_TYPES = ["ALL", "ICSI", "IVF", "IUI", "FET", "NATURAL"];
const CYCLE_STATUSES = [
  "ALL", "UNDER_STIMULATION", "OPU_SCHEDULED", "OPU_COMPLETED",
  "ET_SCHEDULED", "ET_COMPLETED", "PREGNANCY_TEST", "PREGNANCY_CONFIRMED",
  "CYCLE_CANCELLED", "CYCLE_COMPLETED",
];

interface CycleWithPatient extends Cycle {
  couple?: {
    wifePatient?: { firstName: string; lastName: string; mrn: string };
    husbandPatient?: { firstName: string; lastName: string; mrn: string };
  };
}

export function CycleList() {
  const [cycles, setCycles] = useState<CycleWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [artType, setArtType] = useState("");
  const [status, setStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadCycles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (artType) params.artType = artType;
      if (status) params.status = status;

      const res = await api.get<{ success: boolean; data: CycleWithPatient[]; total: number; totalPages: number }>("/cycles", params);
      setCycles(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load cycles:", err);
      setCycles([]);
    } finally {
      setLoading(false);
    }
  }, [page, artType, status]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const filteredCycles = searchQuery
    ? cycles.filter((c) => {
        const q = searchQuery.toLowerCase();
        const wife = c.couple?.wifePatient;
        const husband = c.couple?.husbandPatient;
        return (
          `${wife?.firstName} ${wife?.lastName}`.toLowerCase().includes(q) ||
          `${husband?.firstName} ${husband?.lastName}`.toLowerCase().includes(q) ||
          wife?.mrn?.toLowerCase().includes(q)
        );
      })
    : cycles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Cycles</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage ART treatment cycles {total > 0 && `(${total} total)`}</p>
        </div>
        <Link to="/cycles/new">
          <Button icon={<Plus className="w-4 h-4" />}>New Cycle</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={artType}
            onChange={(e) => { setArtType(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All ART Types</option>
            {ART_TYPES.slice(1).map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {CYCLE_STATUSES.slice(1).map((s) => (<option key={s} value={s}>{s.replace(/_/g, " ")}</option>))}
          </select>
        </div>
      </Card>

      {/* Cycle Cards */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : filteredCycles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No treatment cycles found</p>
            <p className="text-sm text-gray-400 mt-1">Create a new cycle to get started</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCycles.map((cycle) => {
            const wife = cycle.couple?.wifePatient;
            const husband = cycle.couple?.husbandPatient;
            return (
              <Link key={cycle.id} to={`/cycles/${cycle.id}`} className="block">
                <Card className="hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Syringe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">Cycle #{cycle.cycleNumber}</h3>
                          <Badge variant="purple" size="sm">{cycle.artType}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {wife ? `${wife.firstName} ${wife.lastName}` : "—"}
                          {husband ? ` & ${husband.firstName} ${husband.lastName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={cycle.status} />
                      <span className="text-xs text-gray-400">{new Date(cycle.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
