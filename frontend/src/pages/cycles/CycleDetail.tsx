import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Syringe, Users, Calendar, Activity, FlaskConical,
  Microscope, ThermometerSnowflake, Heart, Stethoscope, Beaker,
  Dna, Baby, ClipboardCheck, AlertTriangle, Clock, ChevronRight,
  Eye, Droplets,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type CycleTab = "overview" | "follicles" | "opu" | "semen" | "embryology" | "et" | "pregnancy" | "cryo";

const CYCLE_TABS: { id: CycleTab; label: string; icon: React.ReactNode; route?: string }[] = [
  { id: "overview", label: "Overview", icon: <Eye className="w-4 h-4" /> },
  { id: "follicles", label: "Follicles", icon: <Activity className="w-4 h-4" />, route: "follicles" },
  { id: "opu", label: "OPU", icon: <Droplets className="w-4 h-4" />, route: "opu" },
  { id: "semen", label: "Semen", icon: <Beaker className="w-4 h-4" />, route: "semen" },
  { id: "embryology", label: "Embryology", icon: <FlaskConical className="w-4 h-4" />, route: "embryology" },
  { id: "et", label: "ET", icon: <Baby className="w-4 h-4" />, route: "et" },
  { id: "pregnancy", label: "Pregnancy", icon: <Heart className="w-4 h-4" />, route: "pregnancy" },
  { id: "cryo", label: "Cryo", icon: <ThermometerSnowflake className="w-4 h-4" />, route: "cryo" },
];

// ── Status Flow ────────────────────────────────────────────────

const STATUS_FLOW: { status: string; label: string; icon: React.ReactNode }[] = [
  { status: "UNDER_STIMULATION", label: "Stimulation", icon: <Activity className="w-4 h-4" /> },
  { status: "OPU_SCHEDULED", label: "OPU Scheduled", icon: <Calendar className="w-4 h-4" /> },
  { status: "OPU_COMPLETED", label: "OPU Done", icon: <Droplets className="w-4 h-4" /> },
  { status: "ET_SCHEDULED", label: "ET Scheduled", icon: <Calendar className="w-4 h-4" /> },
  { status: "ET_COMPLETED", label: "ET Done", icon: <Baby className="w-4 h-4" /> },
  { status: "PREGNANCY_TEST", label: "Pregnancy Test", icon: <ClipboardCheck className="w-4 h-4" /> },
  { status: "PREGNANCY_CONFIRMED", label: "Pregnant", icon: <Heart className="w-4 h-4" /> },
  { status: "CYCLE_COMPLETED", label: "Completed", icon: <Syringe className="w-4 h-4" /> },
];

const STATUS_INDEX = Object.fromEntries(STATUS_FLOW.map((s, i) => [s.status, i]));

// ── Helpers ────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-md bg-gray-100 text-gray-500 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "blue" }: { label: string; value: string | number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <Card padding="sm" className="text-center">
      <p className={`text-2xl font-bold ${(colorMap[color] || colorMap.blue).split(" ")[1]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CycleTab>("overview");

  const loadCycle = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: any }>(`/cycles/${id}`);
      setCycle(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load cycle");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadCycle(); }, [loadCycle]);

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="text-center py-16">
      <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{error}</p>
      <Link to="/cycles" className="text-primary-600 text-sm mt-2 inline-block">Back to cycles</Link>
    </div>
  );
  if (!cycle) return null;

  const c = cycle;
  const wife = c.couple?.wifePatient;
  const husband = c.couple?.husbandPatient;
  const currentIdx = STATUS_INDEX[c.status] ?? -1;
  const isCancelled = c.status === "CYCLE_CANCELLED";

  // Sub-resource helper
  const hasFollicles = c.follicleTrackings?.length > 0;
  const hasOPU = !!c.opuRecord;
  const hasSemen = c.semenData?.length > 0;
  const hasEmbryology = c.embryologyRecords?.length > 0;
  const hasET = !!c.etRecord;
  const hasPregnancyTest = !!c.pregnancyTest;
  const hasPregnancyOutcome = !!c.pregnancyOutcome;
  const hasCryo = c.embryoCryos?.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link to="/cycles" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Cycle #{c.cycleNumber}</h1>
            <Badge variant="purple" size="sm">{c.artType}</Badge>
            <StatusBadge status={c.status} />
            {c.pgdType && c.pgdType !== "NONE" && (
              <Badge variant="info" size="sm">PGD: {c.pgdType}</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {wife ? `${wife.firstName} ${wife.lastName}` : "—"}
            {husband ? ` & ${husband.firstName} ${husband.lastName}` : ""}
            {c.treatingPhysician && ` — Dr. ${c.treatingPhysician.firstName} ${c.treatingPhysician.lastName}`}
          </p>
        </div>
      </div>

      {/* ── Warnings ────────────────────────────────────────── */}
      {c.cycleWarnings && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">{c.cycleWarnings}</p>
        </div>
      )}

      {/* ── Status Timeline ─────────────────────────────────── */}
      <Card padding="lg">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FLOW.map((step, i) => {
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            const isCancelledStep = isCancelled && i === currentIdx;
            const statusColor = isCancelledStep ? "bg-rose-500" : isDone ? "bg-green-500" : isActive ? "bg-primary-500" : "bg-gray-200";
            const textColor = isDone || isActive ? "text-gray-900" : "text-gray-400";

            return (
              <div key={step.status} className="flex items-center gap-1 flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${statusColor}`}>
                    {isDone ? <span className="text-xs font-bold">✓</span> : step.icon}
                  </div>
                  <span className={`text-[10px] mt-0.5 whitespace-nowrap ${textColor}`}>{step.label}</span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`w-6 h-px mx-0.5 mb-4 ${i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Key Dates ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">LMP</p>
              <p className="text-sm font-medium text-gray-900">{c.lmp ? new Date(c.lmp).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">HCG Trigger</p>
              <p className="text-sm font-medium text-gray-900">{c.hcgDate ? new Date(c.hcgDate).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">OPU Date</p>
              <p className="text-sm font-medium text-gray-900">{c.opuDate ? new Date(c.opuDate).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">ET Date</p>
              <p className="text-sm font-medium text-gray-900">{c.etDate ? new Date(c.etDate).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Follicle Days" value={c.follicleTrackings?.length || 0} color="blue" />
        <StatCard label="Oocytes" value={c.opuRecord?.oocyteCount || "—"} color="indigo" />
        <StatCard label="MII Oocytes" value={c.opuRecord?.miiOocyteCount || "—"} color="violet" />
        <StatCard label="Embryos" value={c.embryologyRecords?.[c.embryologyRecords.length - 1]?.embryoCount || "—"} color="rose" />
        <StatCard label="Cryo" value={c.embryoCryos?.length || 0} color="amber" />
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0.5 overflow-x-auto">
          {CYCLE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.route && tab.id !== "overview") {
                  navigate(`/cycles/${id}/${tab.route}`);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.route && tab.id !== "overview" && (
                <ChevronRight className="w-3 h-3 text-gray-300" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Content ─────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Cycle Info */}
          <Card>
            <CardHeader title="Cycle Details" subtitle="Configured parameters" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem icon={<Syringe />} label="ART Type" value={c.artType} />
              <InfoItem icon={<ClipboardCheck />} label="Protocol" value={c.stimulationProtocol || "—"} />
              <InfoItem icon={<Users />} label="Stim. Drugs" value={c.stimulationDrugs?.length ? `${c.stimulationDrugs.length} drug(s)` : "—"} />
              <InfoItem icon={<Stethoscope />} label="Physician" value={
                c.treatingPhysician ? `Dr. ${c.treatingPhysician.firstName} ${c.treatingPhysician.lastName}` : "—"
              } />
              <InfoItem icon={<Activity />} label="BMI" value={c.bmi ? `${c.bmi} kg/m²` : "—"} />
              <InfoItem icon={<Clock />} label="Created" value={new Date(c.createdAt).toLocaleDateString()} />
            </div>
          </Card>

          {/* PGD/PGS Info */}
          {c.pgdType && c.pgdType !== "NONE" && (
            <Card>
              <CardHeader title="PGD / PGS Details" subtitle="Preimplantation genetic testing" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem icon={<Dna />} label="Type" value={c.pgdType} />
                {c.pgdGene && <InfoItem icon={<Dna />} label="Gene" value={c.pgdGene} />}
                {c.pgdMutation && <InfoItem icon={<Dna />} label="Mutation" value={c.pgdMutation} />}
                {c.pgdInheritanceMode && <InfoItem icon={<Dna />} label="Inheritance" value={c.pgdInheritanceMode} />}
                {c.pgdTestMethod && <InfoItem icon={<Microscope />} label="Test Method" value={c.pgdTestMethod} />}
                {c.pgdFemaleDiagnosis && <InfoItem icon={<Heart />} label="Female Diagnosis" value={c.pgdFemaleDiagnosis} />}
                {c.pgdMaleDiagnosis && <InfoItem icon={<Heart />} label="Male Diagnosis" value={c.pgdMaleDiagnosis} />}
              </div>
            </Card>
          )}

          {/* Sub-resource Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Follicles */}
            <Link to={`/cycles/${id}/follicles`} className="block">
              <Card className="hover:shadow-md hover:border-primary-200 transition-all cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasFollicles ? "bg-blue-50" : "bg-gray-50"}`}>
                    <Activity className={`w-5 h-5 ${hasFollicles ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Follicle Tracking</p>
                    <p className="text-xs text-gray-500">{hasFollicles ? `${c.follicleTrackings.length} day(s)` : "Not started"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                </div>
              </Card>
            </Link>

            {/* OPU */}
            <div className="block">
              <Card className={`h-full ${hasOPU ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasOPU ? "bg-indigo-50" : "bg-gray-50"}`}>
                    <Droplets className={`w-5 h-5 ${hasOPU ? "text-indigo-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">OPU</p>
                    <p className="text-xs text-gray-500">{hasOPU ? `${c.opuRecord.oocyteCount} oocytes` : "Pending"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Embryology */}
            <div className="block">
              <Card className={`h-full ${hasEmbryology ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasEmbryology ? "bg-violet-50" : "bg-gray-50"}`}>
                    <FlaskConical className={`w-5 h-5 ${hasEmbryology ? "text-violet-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Embryology</p>
                    <p className="text-xs text-gray-500">{hasEmbryology ? `${c.embryologyRecords.length} day(s)` : "Pending"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* ET */}
            <div className="block">
              <Card className={`h-full ${hasET ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasET ? "bg-rose-50" : "bg-gray-50"}`}>
                    <Baby className={`w-5 h-5 ${hasET ? "text-rose-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Embryo Transfer</p>
                    <p className="text-xs text-gray-500">{hasET ? new Date(c.etRecord.etDate).toLocaleDateString() : "Pending"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Semen */}
            <div className="block">
              <Card className={`h-full ${hasSemen ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasSemen ? "bg-amber-50" : "bg-gray-50"}`}>
                    <Beaker className={`w-5 h-5 ${hasSemen ? "text-amber-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Semen</p>
                    <p className="text-xs text-gray-500">{hasSemen ? `${c.semenData.length} sample(s)` : "Pending"}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Pregnancy */}
            <div className="block">
              <Card className={`h-full ${hasPregnancyTest ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasPregnancyTest ? "bg-green-50" : "bg-gray-50"}`}>
                    <Heart className={`w-5 h-5 ${hasPregnancyTest ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Pregnancy</p>
                    <p className="text-xs text-gray-500">
                      {hasPregnancyOutcome ? c.pregnancyOutcome.outcome
                        : hasPregnancyTest ? `${c.pregnancyTest.bhcgLevel} mIU/mL`
                        : "Pending"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Cryo */}
            <div className="block">
              <Card className={`h-full ${hasCryo ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasCryo ? "bg-cyan-50" : "bg-gray-50"}`}>
                    <ThermometerSnowflake className={`w-5 h-5 ${hasCryo ? "text-cyan-600" : "text-gray-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Cryo</p>
                    <p className="text-xs text-gray-500">{hasCryo ? `${c.embryoCryos.length} stored` : "None"}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Notes */}
          {c.notes && (
            <Card>
              <CardHeader title="Notes" />
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.notes}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
