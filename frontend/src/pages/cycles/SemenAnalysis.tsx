import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, FlaskConical, Save, X, Plus, Activity,
  Calendar, Beaker, Droplets,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface SemenDatum {
  id: string;
  cycleId: string;
  patientId?: string | null;
  specimenType?: string | null;
  processingMethod?: string | null;
  collectionDate?: string | null;
  abstinenceDays?: number | null;
  preVolume?: number | null;
  preConcentration?: number | null;
  preTotalCount?: number | null;
  preMotility?: number | null;
  preProgressiveMotility?: number | null;
  preMorphology?: number | null;
  preViscosity?: string | null;
  preColor?: string | null;
  prePH?: number | null;
  postVolume?: number | null;
  postConcentration?: number | null;
  postTotalCount?: number | null;
  postMotility?: number | null;
  postProgressiveMotility?: number | null;
  postMorphology?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface CycleInfo {
  id: string;
  cycleNumber: number;
  artType: string;
  status: string;
  pgdType?: string;
  couple?: {
    wifePatient?: { firstName: string; lastName: string };
    husbandPatient?: { firstName: string; lastName: string };
  };
}

// ── Constants ──────────────────────────────────────────────────

const SPECIMEN_TYPES = [
  "Fresh Ejaculate",
  "Post-Coital",
  "Percutaneous Epididymal Sperm Aspiration (PESA)",
  "Testicular Sperm Aspiration (TESA)",
  "Testicular Sperm Extraction (TESE)",
  "Microdissection TESE (Micro-TESE)",
  "Frozen / Thawed",
  "Donor",
  "Other",
];

const PROCESSING_METHODS = [
  "Density Gradient",
  "Swim-Up",
  "Simple Wash",
  "Microfluidic Sperm Sorting",
  "Other",
];

const WHO_REFERENCE_VALUES: Record<string, { low: number; high: number; unit: string }> = {
  preVolume: { low: 1.5, high: 5, unit: "mL" },
  preConcentration: { low: 15, high: 200, unit: "M/mL" },
  preTotalCount: { low: 39, high: 500, unit: "M" },
  preMotility: { low: 40, high: 80, unit: "%" },
  preProgressiveMotility: { low: 32, high: 80, unit: "%" },
  preMorphology: { low: 4, high: 30, unit: "% (normal forms)" },
  postVolume: { low: 0.5, high: 3, unit: "mL" },
  postConcentration: { low: 10, high: 200, unit: "M/mL" },
  postTotalCount: { low: 5, high: 200, unit: "M" },
  postMotility: { low: 50, high: 90, unit: "%" },
  postProgressiveMotility: { low: 40, high: 80, unit: "%" },
  postMorphology: { low: 4, high: 30, unit: "% (normal forms)" },
};

// ── Info Helpers ───────────────────────────────────────────────

function LabelledValue({ label, value, unit, normal }: { label: string; value: string | number | null | undefined; unit?: string; normal?: boolean }) {
  const display = value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—";
  const isAbnormal = value != null && normal != null && !normal;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${isAbnormal ? "text-rose-600" : "text-gray-900"}`}>
        {display}
        {isAbnormal && <span className="ml-1.5 text-xs text-rose-400">↓</span>}
      </span>
    </div>
  );
}

function ParameterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1 rounded-md bg-gray-100 text-gray-500">{icon}</div>
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// ── Normal Range Check ─────────────────────────────────────────

function isNormal(field: string, value: number | null | undefined): boolean | undefined {
  if (value == null) return undefined;
  const ref = WHO_REFERENCE_VALUES[field];
  if (!ref) return undefined;
  return value >= ref.low && value <= ref.high;
}

// ── Main Component ─────────────────────────────────────────────

export function SemenAnalysis() {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const [records, setRecords] = useState<SemenDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [specimenType, setSpecimenType] = useState("");
  const [processingMethod, setProcessingMethod] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [abstinenceDays, setAbstinenceDays] = useState("");
  // Pre-wash
  const [preVolume, setPreVolume] = useState("");
  const [preConcentration, setPreConcentration] = useState("");
  const [preTotalCount, setPreTotalCount] = useState("");
  const [preMotility, setPreMotility] = useState("");
  const [preProgressiveMotility, setPreProgressiveMotility] = useState("");
  const [preMorphology, setPreMorphology] = useState("");
  const [preViscosity, setPreViscosity] = useState("");
  const [preColor, setPreColor] = useState("");
  const [prePH, setPrePH] = useState("");
  // Post-wash
  const [postVolume, setPostVolume] = useState("");
  const [postConcentration, setPostConcentration] = useState("");
  const [postTotalCount, setPostTotalCount] = useState("");
  const [postMotility, setPostMotility] = useState("");
  const [postProgressiveMotility, setPostProgressiveMotility] = useState("");
  const [postMorphology, setPostMorphology] = useState("");

  // Reset form
  const resetForm = () => {
    setSpecimenType("");
    setProcessingMethod("");
    setCollectionDate("");
    setAbstinenceDays("");
    setPreVolume("");
    setPreConcentration("");
    setPreTotalCount("");
    setPreMotility("");
    setPreProgressiveMotility("");
    setPreMorphology("");
    setPreViscosity("");
    setPreColor("");
    setPrePH("");
    setPostVolume("");
    setPostConcentration("");
    setPostTotalCount("");
    setPostMotility("");
    setPostProgressiveMotility("");
    setPostMorphology("");
  };

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    setError(null);
    try {
      const [cycleRes, semenRes] = await Promise.all([
        api.get<{ success: boolean; data: CycleInfo }>(`/cycles/${cycleId}`),
        api.get<{ success: boolean; data: SemenDatum[] }>(`/cycles/${cycleId}/semen`),
      ]);
      setCycle(cycleRes.data);
      setRecords(semenRes.data || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: Record<string, unknown> = {};
      if (specimenType) payload.specimenType = specimenType;
      if (processingMethod) payload.processingMethod = processingMethod;
      if (collectionDate) payload.collectionDate = new Date(collectionDate + "T00:00:00").toISOString();
      if (abstinenceDays) payload.abstinenceDays = parseInt(abstinenceDays);
      if (preVolume) payload.preVolume = parseFloat(preVolume);
      if (preConcentration) payload.preConcentration = parseFloat(preConcentration);
      if (preTotalCount) payload.preTotalCount = parseFloat(preTotalCount);
      if (preMotility) payload.preMotility = parseFloat(preMotility);
      if (preProgressiveMotility) payload.preProgressiveMotility = parseFloat(preProgressiveMotility);
      if (preMorphology) payload.preMorphology = parseFloat(preMorphology);
      if (preViscosity) payload.preViscosity = preViscosity;
      if (preColor) payload.preColor = preColor;
      if (prePH) payload.prePH = parseFloat(prePH);
      if (postVolume) payload.postVolume = parseFloat(postVolume);
      if (postConcentration) payload.postConcentration = parseFloat(postConcentration);
      if (postTotalCount) payload.postTotalCount = parseFloat(postTotalCount);
      if (postMotility) payload.postMotility = parseFloat(postMotility);
      if (postProgressiveMotility) payload.postProgressiveMotility = parseFloat(postProgressiveMotility);
      if (postMorphology) payload.postMorphology = parseFloat(postMorphology);

      await api.post(`/cycles/${cycleId}/semen`, payload);
      setSuccessMsg("Semen analysis recorded successfully");
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading && !cycle) return <PageLoader />;

  const wife = cycle?.couple?.wifePatient;
  const husband = cycle?.couple?.husbandPatient;
  const hasRecords = records.length > 0;
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to={`/cycles/${cycleId}`}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Semen Analysis</h1>
            {cycle && <Badge variant="purple" size="sm">{cycle.artType}</Badge>}
            {cycle && <StatusBadge status={cycle.status} />}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Cycle #{cycle?.cycleNumber} — {wife ? `${wife.firstName} ${wife.lastName}` : "—"}
            {husband ? ` & ${husband.firstName} ${husband.lastName}` : ""}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            New Analysis
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{successMsg}</div>
      )}

      {/* ── Summary Stats ───────────────────────────────────── */}
      {hasRecords && !showForm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{records.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Analyses</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{latestRecord?.preConcentration ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Latest Concentration</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{latestRecord?.preProgressiveMotility != null ? `${latestRecord.preProgressiveMotility}%` : "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Progressive Motility</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-600">{latestRecord?.preMorphology != null ? `${latestRecord.preMorphology}%` : "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Normal Morphology</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────── */}
      {!hasRecords && !showForm && (
        <Card>
          <div className="text-center py-10">
            <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No semen analysis data</p>
            <p className="text-sm text-gray-400 mt-1">Click "New Analysis" to record semen parameters</p>
          </div>
        </Card>
      )}

      {/* ── Existing Records View ────────────────────────────── */}
      {hasRecords && !showForm && (
        <div className="space-y-6">
          {[...records].reverse().map((record, idx) => (
            <Card key={record.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">#{records.length - idx}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {record.specimenType || "Semen Analysis"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {record.collectionDate ? new Date(record.collectionDate).toLocaleDateString() : "—"}
                      {record.abstinenceDays != null && ` · ${record.abstinenceDays}d abstinence`}
                    </p>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  {record.processingMethod || "Not specified"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pre-Wash */}
                <ParameterSection title="Pre-Wash Parameters" icon={<Beaker className="w-4 h-4" />}>
                  <LabelledValue label="Volume" value={record.preVolume} unit="mL" normal={isNormal("preVolume", record.preVolume)} />
                  <LabelledValue label="Concentration" value={record.preConcentration} unit="M/mL" normal={isNormal("preConcentration", record.preConcentration)} />
                  <LabelledValue label="Total Count" value={record.preTotalCount} unit="M" normal={isNormal("preTotalCount", record.preTotalCount)} />
                  <LabelledValue label="Motility" value={record.preMotility != null ? `${record.preMotility}%` : undefined} normal={isNormal("preMotility", record.preMotility)} />
                  <LabelledValue label="Progressive Motility" value={record.preProgressiveMotility != null ? `${record.preProgressiveMotility}%` : undefined} normal={isNormal("preProgressiveMotility", record.preProgressiveMotility)} />
                  <LabelledValue label="Normal Morphology" value={record.preMorphology != null ? `${record.preMorphology}%` : undefined} normal={isNormal("preMorphology", record.preMorphology)} />
                  {record.preViscosity && <LabelledValue label="Viscosity" value={record.preViscosity} />}
                  {record.preColor && <LabelledValue label="Color" value={record.preColor} />}
                  {record.prePH != null && <LabelledValue label="pH" value={record.prePH} />}
                </ParameterSection>

                {/* Post-Wash */}
                <ParameterSection title="Post-Wash Parameters" icon={<Droplets className="w-4 h-4" />}>
                  <LabelledValue label="Volume" value={record.postVolume} unit="mL" normal={isNormal("postVolume", record.postVolume)} />
                  <LabelledValue label="Concentration" value={record.postConcentration} unit="M/mL" normal={isNormal("postConcentration", record.postConcentration)} />
                  <LabelledValue label="Total Count" value={record.postTotalCount} unit="M" normal={isNormal("postTotalCount", record.postTotalCount)} />
                  <LabelledValue label="Motility" value={record.postMotility != null ? `${record.postMotility}%` : undefined} normal={isNormal("postMotility", record.postMotility)} />
                  <LabelledValue label="Progressive Motility" value={record.postProgressiveMotility != null ? `${record.postProgressiveMotility}%` : undefined} normal={isNormal("postProgressiveMotility", record.postProgressiveMotility)} />
                  <LabelledValue label="Normal Morphology" value={record.postMorphology != null ? `${record.postMorphology}%` : undefined} normal={isNormal("postMorphology", record.postMorphology)} />
                </ParameterSection>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create Form ──────────────────────────────────────── */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="New Semen Analysis" subtitle="Record semen parameters" />
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Specimen Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specimen Type</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIMEN_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSpecimenType(type)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        specimenType === type
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Method</label>
                <div className="flex flex-wrap gap-2">
                  {PROCESSING_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setProcessingMethod(method)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        processingMethod === method
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Collection Date"
                type="date"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
              />
              <Input
                label="Abstinence (days)"
                type="number"
                min="1"
                max="21"
                value={abstinenceDays}
                onChange={(e) => setAbstinenceDays(e.target.value)}
                placeholder="e.g., 3"
                icon={<Activity className="w-4 h-4 text-gray-400" />}
              />
            </div>

            {/* Pre-Wash Parameters */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Beaker className="w-4 h-4 text-blue-500" />
                Pre-Wash Parameters
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Volume (mL)" type="number" step="0.1" min="0" value={preVolume} onChange={(e) => setPreVolume(e.target.value)} placeholder="e.g., 3.0" />
                <Input label="Concentration (M/mL)" type="number" step="0.1" min="0" value={preConcentration} onChange={(e) => setPreConcentration(e.target.value)} placeholder="e.g., 50" />
                <Input label="Total Count (M)" type="number" step="0.1" min="0" value={preTotalCount} onChange={(e) => setPreTotalCount(e.target.value)} placeholder="e.g., 150" />
                <Input label="Motility (%)" type="number" min="0" max="100" value={preMotility} onChange={(e) => setPreMotility(e.target.value)} placeholder="e.g., 60" />
                <Input label="Progressive Motility (%)" type="number" min="0" max="100" value={preProgressiveMotility} onChange={(e) => setPreProgressiveMotility(e.target.value)} placeholder="e.g., 45" />
                <Input label="Normal Morphology (%)" type="number" min="0" max="100" value={preMorphology} onChange={(e) => setPreMorphology(e.target.value)} placeholder="e.g., 8" />
                <Input label="Viscosity" value={preViscosity} onChange={(e) => setPreViscosity(e.target.value)} placeholder="e.g., Normal, High" />
                <Input label="Color" value={preColor} onChange={(e) => setPreColor(e.target.value)} placeholder="e.g., Grey-white" />
                <Input label="pH" type="number" step="0.1" min="0" value={prePH} onChange={(e) => setPrePH(e.target.value)} placeholder="e.g., 7.4" />
              </div>
            </div>

            {/* Post-Wash Parameters */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-indigo-500" />
                Post-Wash Parameters
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Volume (mL)" type="number" step="0.1" min="0" value={postVolume} onChange={(e) => setPostVolume(e.target.value)} placeholder="e.g., 0.5" />
                <Input label="Concentration (M/mL)" type="number" step="0.1" min="0" value={postConcentration} onChange={(e) => setPostConcentration(e.target.value)} placeholder="e.g., 30" />
                <Input label="Total Count (M)" type="number" step="0.1" min="0" value={postTotalCount} onChange={(e) => setPostTotalCount(e.target.value)} placeholder="e.g., 15" />
                <Input label="Motility (%)" type="number" min="0" max="100" value={postMotility} onChange={(e) => setPostMotility(e.target.value)} placeholder="e.g., 70" />
                <Input label="Progressive Motility (%)" type="number" min="0" max="100" value={postProgressiveMotility} onChange={(e) => setPostProgressiveMotility(e.target.value)} placeholder="e.g., 55" />
                <Input label="Normal Morphology (%)" type="number" min="0" max="100" value={postMorphology} onChange={(e) => setPostMorphology(e.target.value)} placeholder="e.g., 10" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? "Saving..." : "Save Analysis"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
