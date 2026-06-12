import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Droplets, Save, Edit3, X, Calendar, Stethoscope,
  AlertTriangle, FileText, Activity, Syringe,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface OPURecord {
  id?: string;
  cycleId?: string;
  anaesthesiaType?: string | null;
  follicleCount?: number | null;
  oocyteCount?: number | null;
  miiOocyteCount?: number | null;
  operationNotes?: string | null;
  complications?: string | null;
  postOpPlan?: string | null;
  performedById?: string;
  performedBy?: { id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

interface CycleInfo {
  id: string;
  cycleNumber: number;
  artType: string;
  status: string;
  couple?: {
    wifePatient?: { firstName: string; lastName: string };
    husbandPatient?: { firstName: string; lastName: string };
  };
}

interface PhysicianResult {
  id: string;
  firstName: string;
  lastName: string;
  staffCode: string;
  role?: { name: string; label: string };
}

const ANAESTHESIA_OPTIONS = ["IV Sedation", "General Anaesthesia", "Local Anaesthesia", "None", "Other"];

// ── Main Component ─────────────────────────────────────────────

export function OPUForm() {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const [record, setRecord] = useState<OPURecord | null>(null);
  const [physicians, setPhysicians] = useState<PhysicianResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [anaesthesiaType, setAnaesthesiaType] = useState("");
  const [follicleCount, setFollicleCount] = useState("");
  const [oocyteCount, setOocyteCount] = useState("");
  const [miiOocyteCount, setMiiOocyteCount] = useState("");
  const [performedById, setPerformedById] = useState("");
  const [operationNotes, setOperationNotes] = useState("");
  const [complications, setComplications] = useState("");
  const [postOpPlan, setPostOpPlan] = useState("");

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    setError(null);
    try {
      const [cycleRes, opuRes, physRes] = await Promise.all([
        api.get<{ success: boolean; data: CycleInfo }>(`/cycles/${cycleId}`),
        api.get<{ success: boolean; data: OPURecord | null }>(`/cycles/${cycleId}/opu`),
        api.get<{ success: boolean; data: PhysicianResult[] }>("/users/physicians"),
      ]);
      setCycle(cycleRes.data);
      setRecord(opuRes.data);
      setPhysicians(physRes.data || []);

      // Populate form if record exists
      if (opuRes.data) {
        setAnaesthesiaType(opuRes.data.anaesthesiaType || "");
        setFollicleCount(opuRes.data.follicleCount?.toString() || "");
        setOocyteCount(opuRes.data.oocyteCount?.toString() || "");
        setMiiOocyteCount(opuRes.data.miiOocyteCount?.toString() || "");
        setPerformedById(opuRes.data.performedById || "");
        setOperationNotes(opuRes.data.operationNotes || "");
        setComplications(opuRes.data.complications || "");
        setPostOpPlan(opuRes.data.postOpPlan || "");
      }
    } catch (err: any) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Start editing ──────────────────────────────────────────
  const startEditing = () => {
    setIsEditing(true);
    if (record) {
      setAnaesthesiaType(record.anaesthesiaType || "");
      setFollicleCount(record.follicleCount?.toString() || "");
      setOocyteCount(record.oocyteCount?.toString() || "");
      setMiiOocyteCount(record.miiOocyteCount?.toString() || "");
      setPerformedById(record.performedById || "");
      setOperationNotes(record.operationNotes || "");
      setComplications(record.complications || "");
      setPostOpPlan(record.postOpPlan || "");
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    // Reset to current record values
    if (record) {
      setAnaesthesiaType(record.anaesthesiaType || "");
      setFollicleCount(record.follicleCount?.toString() || "");
      setOocyteCount(record.oocyteCount?.toString() || "");
      setMiiOocyteCount(record.miiOocyteCount?.toString() || "");
      setPerformedById(record.performedById || "");
      setOperationNotes(record.operationNotes || "");
      setComplications(record.complications || "");
      setPostOpPlan(record.postOpPlan || "");
    }
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId) return;
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        performedById,
      };
      if (anaesthesiaType) payload.anaesthesiaType = anaesthesiaType;
      if (follicleCount) payload.follicleCount = parseInt(follicleCount);
      if (oocyteCount) payload.oocyteCount = parseInt(oocyteCount);
      if (miiOocyteCount) payload.miiOocyteCount = parseInt(miiOocyteCount);
      if (operationNotes) payload.operationNotes = operationNotes;
      if (complications) payload.complications = complications;
      if (postOpPlan) payload.postOpPlan = postOpPlan;

      if (record && record.id) {
        // Update existing
        await api.put(`/cycles/${cycleId}/opu`, payload);
      } else {
        // Create new
        await api.post(`/cycles/${cycleId}/opu`, payload);
      }

      setIsEditing(false);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save OPU record");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading && !cycle) return <PageLoader />;

  const wife = cycle?.couple?.wifePatient;
  const husband = cycle?.couple?.husbandPatient;
  const hasRecord = !!record;
  const matchedPhysician = physicians.find((p) => p.id === performedById);
  const performedBy = record?.performedBy
    ? `Dr. ${record.performedBy.firstName} ${record.performedBy.lastName}`
    : matchedPhysician
      ? `Dr. ${matchedPhysician.firstName} ${matchedPhysician.lastName}`
      : "—";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to={`/cycles/${cycleId}`}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">OPU Record</h1>
            {cycle && <Badge variant="purple" size="sm">{cycle.artType}</Badge>}
            {cycle && <StatusBadge status={cycle.status} />}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Cycle #{cycle?.cycleNumber} — {wife ? `${wife.firstName} ${wife.lastName}` : "—"}
            {husband ? ` & ${husband.firstName} ${husband.lastName}` : ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Stats Summary ─────────────────────────────────────── */}
      {hasRecord && !isEditing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{record!.follicleCount ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Follicles</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{record!.oocyteCount ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Oocytes</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-600">{record!.miiOocyteCount ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">MII Oocytes</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{record!.miiOocyteCount != null && record!.oocyteCount != null ? `${((record!.miiOocyteCount / record!.oocyteCount) * 100).toFixed(0)}%` : "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Maturity Rate</p>
            </div>
          </Card>
        </div>
      )}

      {!hasRecord && !isEditing && (
        <Card>
          <div className="text-center py-10">
            <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No OPU record yet</p>
            <p className="text-sm text-gray-400 mt-1">Record the oocyte retrieval details once the procedure is done</p>
            <div className="mt-4">
              <Button onClick={startEditing} icon={<Edit3 className="w-4 h-4" />}>Create OPU Record</Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Read-only View ─────────────────────────────────────── */}
      {hasRecord && !isEditing && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="OPU Details" subtitle="Oocyte retrieval procedure record" />
            <Button onClick={startEditing} variant="outline" size="sm" icon={<Edit3 className="w-4 h-4" />}>
              Edit Record
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Droplets />} label="Anaesthesia" value={record!.anaesthesiaType || "—"} />
            <InfoItem icon={<Syringe />} label="Follicle Count" value={record!.follicleCount?.toString() || "—"} />
            <InfoItem icon={<Droplets />} label="Oocyte Count" value={record!.oocyteCount?.toString() || "—"} />
            <InfoItem icon={<Activity />} label="MII Oocyte Count" value={record!.miiOocyteCount?.toString() || "—"} />
            <InfoItem icon={<Stethoscope />} label="Performed By" value={performedBy} />
            {record!.createdAt && (
              <InfoItem icon={<Calendar />} label="Recorded At" value={new Date(record!.createdAt).toLocaleDateString()} />
            )}
          </div>

          {record!.operationNotes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Operation Notes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{record!.operationNotes}</p>
            </div>
          )}

          {record!.complications && (
            <div className="mt-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h4 className="text-sm font-medium text-rose-700">Complications</h4>
              </div>
              <p className="text-sm text-rose-600 whitespace-pre-wrap">{record!.complications}</p>
            </div>
          )}

          {record!.postOpPlan && (
            <div className="mt-3 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-1">Post-OP Plan</h4>
              <p className="text-sm text-blue-600 whitespace-pre-wrap">{record!.postOpPlan}</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Edit / Create Form ─────────────────────────────────── */}
      {isEditing && (
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardHeader
                title={hasRecord ? "Edit OPU Record" : "New OPU Record"}
                subtitle="Record oocyte retrieval procedure details"
              />
              <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Anaesthesia & Performer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anaesthesia Type</label>
                  <div className="flex flex-wrap gap-2">
                    {ANAESTHESIA_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnaesthesiaType(opt)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                          anaesthesiaType === opt
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
                  <select
                    value={performedById}
                    onChange={(e) => setPerformedById(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select physician...</option>
                    {physicians.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.firstName} {doc.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Counts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Oocyte Counts</label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Follicle Count"
                    type="number"
                    min="0"
                    value={follicleCount}
                    onChange={(e) => setFollicleCount(e.target.value)}
                    placeholder="e.g., 12"
                    icon={<Droplets className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="Oocyte Count"
                    type="number"
                    min="0"
                    value={oocyteCount}
                    onChange={(e) => setOocyteCount(e.target.value)}
                    placeholder="e.g., 10"
                    icon={<Activity className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="MII Oocytes"
                    type="number"
                    min="0"
                    value={miiOocyteCount}
                    onChange={(e) => setMiiOocyteCount(e.target.value)}
                    placeholder="e.g., 8"
                    icon={<Activity className="w-4 h-4 text-gray-400" />}
                    helperText="Mature (Metaphase II)"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Notes</label>
                <textarea
                  value={operationNotes}
                  onChange={(e) => setOperationNotes(e.target.value)}
                  placeholder="Details of the retrieval procedure..."
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Complications
                    </span>
                  </label>
                  <textarea
                    value={complications}
                    onChange={(e) => setComplications(e.target.value)}
                    placeholder="Any complications during retrieval..."
                    rows={2}
                    className="block w-full rounded-lg border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Post-OP Plan
                    </span>
                  </label>
                  <textarea
                    value={postOpPlan}
                    onChange={(e) => setPostOpPlan(e.target.value)}
                    placeholder="Post-operative instructions..."
                    rows={2}
                    className="block w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={saving} icon={<Save className="w-4 h-4" />}>
                  {saving ? "Saving..." : hasRecord ? "Update Record" : "Save OPU Record"}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}

// ── Info Item ───────────────────────────────────────────────────

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
