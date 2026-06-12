import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  Microscope, Search, FlaskConical,
  CalendarDays, User, AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Investigation {
  id: string;
  patientId: string;
  type: string;
  date: string;
  results?: any;
  reportFile?: string | null;
  notes?: string | null;
  isAbnormal?: boolean | null;
  createdAt: string;
  patient?: { id: string; firstName: string; lastName: string; mrn: string };
  orderedBy?: { id: string; firstName: string; lastName: string };
}

const INVESTIGATION_COLORS: Record<string, string> = {
  SEMEN_ANALYSIS: "bg-blue-100 text-blue-700",
  HORMONAL: "bg-purple-100 text-purple-700",
  INFECTION_SCREENING: "bg-rose-100 text-rose-700",
  GENETIC: "bg-teal-100 text-teal-700",
  LAPAROSCOPY: "bg-amber-100 text-amber-700",
  HSG: "bg-indigo-100 text-indigo-700",
  ULTRASOUND: "bg-cyan-100 text-cyan-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const INVESTIGATION_LABELS: Record<string, string> = {
  SEMEN_ANALYSIS: "Semen Analysis",
  HORMONAL: "Hormonal Assay",
  INFECTION_SCREENING: "Infection Screening",
  GENETIC: "Genetic Test",
  LAPAROSCOPY: "Laparoscopy",
  HSG: "HSG",
  ULTRASOUND: "Ultrasound",
  OTHER: "Other",
};

export function InvestigationList() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Investigation[] }>("/investigations");
      setInvestigations(res.data || []);
    } catch (err) {
      console.error("Failed to load investigations:", err);
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const types = [...new Set(investigations.map((inv) => inv.type))];

  const filtered = searchQuery
    ? investigations.filter((inv) => {
        const q = searchQuery.toLowerCase();
        return (
          `${inv.patient?.firstName} ${inv.patient?.lastName}`.toLowerCase().includes(q) ||
          inv.patient?.mrn?.toLowerCase().includes(q) ||
          INVESTIGATION_LABELS[inv.type]?.toLowerCase().includes(q) ||
          inv.notes?.toLowerCase().includes(q)
        );
      })
    : typeFilter
      ? investigations.filter((inv) => inv.type === typeFilter)
      : investigations;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investigations & Lab Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            {!loading && `${investigations.length} total`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient or type..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setTypeFilter(""); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${!typeFilter ? "bg-primary-50 border-primary-200 text-primary-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => { setTypeFilter(type); setSearchQuery(""); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${typeFilter === type ? "bg-primary-50 border-primary-200 text-primary-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                {INVESTIGATION_LABELS[type] || type.replace(/_/g, " ")}
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
            <Microscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No investigations found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? "Try a different search term" : "No lab results have been recorded yet"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <Link
              key={inv.id}
              to={`/investigations/${inv.id}`}
              className="block"
            >
              <Card className="hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${INVESTIGATION_COLORS[inv.type] || "bg-gray-100 text-gray-600"}`}>
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {INVESTIGATION_LABELS[inv.type] || inv.type.replace(/_/g, " ")}
                      </span>
                      {inv.isAbnormal != null && (
                        <Badge variant={inv.isAbnormal ? "danger" : "success"} size="sm">
                          {inv.isAbnormal ? "Abnormal" : "Normal"}
                        </Badge>
                      )}
                    </div>
                    {inv.patient && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {inv.patient.firstName} {inv.patient.lastName}
                        <span className="text-xs text-gray-400"> ({inv.patient.mrn})</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(inv.date).toLocaleDateString()}
                      </span>
                      {inv.orderedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Ordered by {inv.orderedBy.firstName} {inv.orderedBy.lastName}
                        </span>
                      )}
                    </div>
                    {inv.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{inv.notes}</p>
                    )}
                  </div>
                  {inv.results && <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
