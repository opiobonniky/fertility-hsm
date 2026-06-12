import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, FlaskConical, CalendarDays, User, FileText,
  AlertCircle, Stethoscope, ClipboardList, Dna,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface InvestigationDetail {
  id: string;
  patientId: string;
  type: string;
  date: string;
  results?: any;
  reportFile?: string | null;
  notes?: string | null;
  isAbnormal?: boolean | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
  };
  orderedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ── Helpers ────────────────────────────────────────────────────

const INVESTIGATION_LABELS: Record<string, string> = {
  SEMEN_ANALYSIS: "Semen Analysis",
  HORMONAL: "Hormonal Assay",
  INFECTION_SCREENING: "Infection Screening",
  GENETIC: "Genetic Test",
  LAPAROSCOPY: "Laparoscopy",
  HSG: "HSG (Hysterosalpingography)",
  ULTRASOUND: "Ultrasound",
  OTHER: "Other",
};

const INVESTIGATION_COLORS: Record<string, string> = {
  SEMEN_ANALYSIS: "bg-blue-500",
  HORMONAL: "bg-purple-500",
  INFECTION_SCREENING: "bg-rose-500",
  GENETIC: "bg-teal-500",
  LAPAROSCOPY: "bg-amber-500",
  HSG: "bg-indigo-500",
  ULTRASOUND: "bg-cyan-500",
  OTHER: "bg-gray-500",
};

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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

// ── Results Display ────────────────────────────────────────────

function ResultsTable({ results }: { results: Record<string, any> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
            {Object.values(results).some((v) => v?.range) && (
              <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
            )}
            <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Object.entries(results).map(([key, val]) => (
            <tr key={key} className="hover:bg-gray-50 transition-colors">
              <td className="py-2.5 px-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </td>
              <td className="py-2.5 px-3">
                {isLabValue(val) ? (
                  <LabValueDisplay value={val} />
                ) : (
                  <ResultValue val={val} />
                )}
              </td>
              {Object.values(results).some((v) => v?.range) && (
                <td className="py-2.5 px-3 text-sm text-gray-400">
                  {val?.range || "—"}
                </td>
              )}
              <td className="py-2.5 px-3">
                {isLabValue(val) && val.flag ? (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    val.flag === "HIGH" ? "text-rose-600 bg-rose-50" :
                    val.flag === "LOW" ? "text-amber-600 bg-amber-50" :
                    "text-gray-500 bg-gray-50"
                  }`}>
                    {val.flag}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function displayKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, " ");
}

function isLabValue(val: any): boolean {
  return val && typeof val === "object" && !Array.isArray(val) && "value" in val;
}

function ResultValue({ val }: { val: any }) {
  if (val === null || val === undefined) return <span className="text-sm text-gray-400">—</span>;
  if (typeof val === "boolean") return <span className="text-sm text-gray-900">{val ? "Yes" : "No"}</span>;
  if (typeof val === "string" || typeof val === "number") return <span className="text-sm font-medium text-gray-900">{String(val)}</span>;
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-sm text-gray-400">None</span>;
    return (
      <div className="space-y-1">
        {val.map((item: any, i: number) => (
          <div key={i} className="text-sm text-gray-900">
            {typeof item === "object" ? <ResultValue val={item} /> : String(item)}
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-sm text-gray-900">{String(val)}</span>;
}

function LabValueDisplay({ value }: { value: { value: number | string; unit?: string; range?: string; flag?: string } }) {
  const isFlagged = value.flag === "HIGH" || value.flag === "LOW";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-sm font-semibold ${isFlagged ? "text-rose-600" : "text-gray-900"}`}>
        {value.value}
      </span>
      {value.unit && <span className="text-xs text-gray-400">{value.unit}</span>}
      {value.range && (
        <span className="text-xs text-gray-400">
          (ref: {value.range})
        </span>
      )}
      {value.flag === "HIGH" && (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          HIGH
        </span>
      )}
      {value.flag === "LOW" && (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          LOW
        </span>
      )}
    </div>
  );
}

function hasLabValues(results: Record<string, any>): boolean {
  return Object.values(results).some((v) => isLabValue(v));
}

function hasNestedObjects(results: Record<string, any>): boolean {
  return Object.values(results).some(
    (v) => v && typeof v === "object" && !Array.isArray(v) && !isLabValue(v)
  );
}

function NestedResults({ results }: { results: Record<string, any> }) {
  return (
    <div className="space-y-6">
      {Object.entries(results).map(([sectionKey, sectionVal]) => {
        if (!sectionVal || typeof sectionVal !== "object") {
          return (
            <div key={sectionKey} className="flex items-center gap-3 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500 uppercase w-1/3 shrink-0">{displayKey(sectionKey)}</span>
              <ResultValue val={sectionVal} />
            </div>
          );
        }

        return (
          <div key={sectionKey}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-primary-400" />
              {displayKey(sectionKey)}
            </h4>
            <div className="bg-gray-50 rounded-lg p-3">
              {Array.isArray(sectionVal) ? (
                <div className="space-y-1">
                  {sectionVal.map((item: any, i: number) => (
                    <div key={i} className="text-sm text-gray-900">
                      {typeof item === "object" ? (
                        <ResultValue val={item} />
                      ) : (
                        <span className="px-2 py-0.5 bg-white rounded border border-gray-200 text-xs">{String(item)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <ResultsTable results={sectionVal} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultsDisplay({ results }: { results: any }) {
  if (!results) return <p className="text-sm text-gray-500 italic">No results recorded</p>;

  if (Array.isArray(results)) {
    if (results.length === 0) return <p className="text-sm text-gray-500 italic">No results recorded</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {Object.keys(results[0] || {}).map((key) => (
                <th key={key} className="text-left py-2.5 px-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {displayKey(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                {Object.keys(results[0]).map((key) => (
                  <td key={key} className="py-2.5 px-3 text-sm text-gray-900">
                    <ResultValue val={row[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (typeof results === "object") {
    // Check if this is a flat object of lab values (like hormonal profile)
    if (hasLabValues(results) && !hasNestedObjects(results)) {
      return <ResultsTable results={results} />;
    }
    // Check if it has nested sections (like semen analysis with macroscopic/microscopic)
    if (hasNestedObjects(results)) {
      return <NestedResults results={results} />;
    }
    // Simple flat object
    return (
      <div className="space-y-2">
        {Object.entries(results).map(([key, val]) => (
          <div key={key} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs text-gray-500 uppercase w-1/3 shrink-0">{displayKey(key)}</span>
            <ResultValue val={val} />
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-gray-900">{String(results)}</p>;
}

// ── Main Component ─────────────────────────────────────────────

export function InvestigationDetail() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<InvestigationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: InvestigationDetail }>(`/investigations/${id}`);
      setInv(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load investigation");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <PageLoader />;

  if (error && !inv) return (
    <div className="text-center py-16">
      <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{error}</p>
      <Link to="/investigations" className="text-primary-600 text-sm mt-2 inline-block">Back to investigations</Link>
    </div>
  );

  if (!inv) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Investigation not found</p>
      <Link to="/investigations" className="text-primary-600 text-sm mt-2 inline-block">Back to investigations</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/investigations"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${INVESTIGATION_COLORS[inv.type] || "bg-gray-400"}`} />
            <h1 className="text-2xl font-bold text-gray-900">
              {INVESTIGATION_LABELS[inv.type] || inv.type.replace(/_/g, " ")}
            </h1>
            {inv.isAbnormal != null && (
              <Badge variant={inv.isAbnormal ? "danger" : "success"} size="sm">
                {inv.isAbnormal ? "Abnormal" : "Normal"}
              </Badge>
            )}
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
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investigation Details */}
        <SectionCard title="Investigation Details">
          <InfoRow
            icon={<FlaskConical className="w-4 h-4" />}
            label="Type"
            value={INVESTIGATION_LABELS[inv.type] || inv.type.replace(/_/g, " ")}
          />
          <InfoRow
            icon={<CalendarDays className="w-4 h-4" />}
            label="Date Performed"
            value={new Date(inv.date).toLocaleDateString(undefined, {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          />
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-1.5 rounded-md bg-white text-gray-500 shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              {inv.isAbnormal != null ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${inv.isAbnormal ? "bg-rose-500" : "bg-emerald-500"}`} />
                  <span className={`text-sm font-medium ${inv.isAbnormal ? "text-rose-700" : "text-emerald-700"}`}>
                    {inv.isAbnormal ? "Abnormal" : "Normal"}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Pending Review</span>
              )}
            </div>
          </div>
          {inv.reportFile && (
            <InfoRow icon={<FileText className="w-4 h-4" />} label="Report File" value={inv.reportFile} />
          )}
        </SectionCard>

        {/* Patient & Orderer */}
        <SectionCard title="Patient & Ordering">
          {inv.patient ? (
            <>
              <InfoRow
                icon={<User className="w-4 h-4" />}
                label="Patient"
                value={`${inv.patient.firstName} ${inv.patient.lastName}`}
              />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="MRN" value={inv.patient.mrn} />
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
          {inv.orderedBy && (
            <InfoRow
              icon={<Stethoscope className="w-4 h-4" />}
              label="Ordered By"
              value={`Dr. ${inv.orderedBy.firstName} ${inv.orderedBy.lastName}`}
            />
          )}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Record Keeping</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-gray-400">Created:</span>
              {new Date(inv.createdAt).toLocaleDateString()}
              {inv.updatedAt !== inv.createdAt && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400">Updated:</span>
                  {new Date(inv.updatedAt).toLocaleDateString()}
                </>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Results ─────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Results"
          subtitle="Laboratory results and findings"
        />
        {inv.results ? (              <ResultsDisplay results={inv.results} />
        ) : (
          <div className="text-center py-8">
            <Dna className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No results have been recorded yet</p>
          </div>
        )}
      </Card>

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
