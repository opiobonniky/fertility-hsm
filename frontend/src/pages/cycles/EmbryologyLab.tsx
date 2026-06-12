import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, FlaskConical, Save, Edit3, X, Plus, Activity,
  CheckCircle2, Microscope, Dna,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type EmbryoDay = "D0" | "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7";

interface EmbryoGrading {
  embryoNumber: number;
  cellCount?: number;
  fragmentation?: number;
  symmetry?: "EQUAL" | "UNEQUAL";
  multinucleation?: boolean;
  expansion?: number;
  icm?: "A" | "B" | "C";
  te?: "A" | "B" | "C";
  pnCount?: number;
  fertilizationStatus?: "2PN" | "1PN" | "3PN" | "0PN" | "DEGENERATED";
  compaction?: boolean;
  grade?: string;
  notes?: string;
}

interface EmbryologyRecord {
  id: string;
  cycleId: string;
  dayNumber: EmbryoDay;
  embryoCount: number;
  icsiMethod?: string | null;
  details?: EmbryoGrading[] | null;
  notes?: string | null;
  icsiPerformedById?: string | null;
  icsiPerformedBy?: { id: string; firstName: string; lastName: string } | null;
  createdById?: string;
  createdAt: string;
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

interface PhysicianResult {
  id: string;
  firstName: string;
  lastName: string;
  staffCode: string;
}

// ── Constants ──────────────────────────────────────────────────

const EMBRYO_DAYS: EmbryoDay[] = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

const DAY_LABELS: Record<EmbryoDay, string> = {
  D0: "ICSI / Insemination",
  D1: "Fertilization Check",
  D2: "Cleavage Day 2",
  D3: "Cleavage Day 3",
  D4: "Morula Stage",
  D5: "Blastocyst Day 5",
  D6: "Blastocyst Day 6",
  D7: "Blastocyst Day 7",
};

const DAY_DESCRIPTIONS: Record<EmbryoDay, string> = {
  D0: "Record ICSI details and initial embryo count after insemination",
  D1: "Assess pronuclear formation (2PN) to confirm fertilisation",
  D2: "Early cleavage — cell count, fragmentation, and symmetry",
  D3: "Cleavage stage — cell count ≥6-8 cells expected",
  D4: "Morula compaction assessment",
  D5: "Blastocyst grading — expansion, ICM, and trophectoderm",
  D6: "Extended blastocyst culture — assess hatching status",
  D7: "Late blastocyst — final assessment before cryo or discard",
};

const DAY_COLORS: Record<EmbryoDay, string> = {
  D0: "bg-rose-500",
  D1: "bg-orange-500",
  D2: "bg-amber-500",
  D3: "bg-yellow-600",
  D4: "bg-lime-600",
  D5: "bg-emerald-600",
  D6: "bg-teal-600",
  D7: "bg-cyan-600",
};

const DAY_ACTIVE_COLORS: Record<EmbryoDay, string> = {
  D0: "ring-rose-500 border-rose-500",
  D1: "ring-orange-500 border-orange-500",
  D2: "ring-amber-500 border-amber-500",
  D3: "ring-yellow-600 border-yellow-600",
  D4: "ring-lime-600 border-lime-600",
  D5: "ring-emerald-600 border-emerald-600",
  D6: "ring-teal-600 border-teal-600",
  D7: "ring-cyan-600 border-cyan-600",
};

const ICSI_METHODS = [
  "Conventional IVF",
  "Standard ICSI",
  "PICSI",
  "IMSI",
  "MACS",
  "Other",
];

const EMBRYO_DAYS_FOR = {
  icsiMethod: ["D0" as EmbryoDay],
  fertilization: ["D1" as EmbryoDay],
  cleavage: ["D2" as EmbryoDay, "D3" as EmbryoDay],
  blastocyst: ["D5" as EmbryoDay, "D6" as EmbryoDay, "D7" as EmbryoDay],
};

const FERTILIZATION_OPTIONS = ["2PN", "1PN", "3PN", "0PN", "DEGENERATED"];

// ── Main Component ─────────────────────────────────────────────

export function EmbryologyLab() {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const [records, setRecords] = useState<EmbryologyRecord[]>([]);
  const [physicians, setPhysicians] = useState<PhysicianResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected day & editing state
  const [activeDay, setActiveDay] = useState<EmbryoDay>("D0");
  const [editingDay, setEditingDay] = useState<EmbryoDay | null>(null);

  // Form state
  const [embryoCount, setEmbryoCount] = useState("");
  const [icsiMethod, setIcsiMethod] = useState("");
  const [icsiPerformedById, setIcsiPerformedById] = useState("");
  const [embryos, setEmbryos] = useState<EmbryoGrading[]>([]);
  const [notes, setNotes] = useState("");

  const activeRecord = records.find((r) => r.dayNumber === activeDay);
  const isEditing = editingDay === activeDay;
  const hasRecord = !!activeRecord;

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    setError(null);
    try {
      const [cycleRes, embryoRes, physRes] = await Promise.all([
        api.get<{ success: boolean; data: CycleInfo }>(`/cycles/${cycleId}`),
        api.get<{ success: boolean; data: EmbryologyRecord[] }>(`/embryology/cycles/${cycleId}/records`),
        api.get<{ success: boolean; data: PhysicianResult[] }>("/users/physicians"),
      ]);
      setCycle(cycleRes.data);
      setRecords(embryoRes.data || []);
      setPhysicians(physRes.data || []);
    } catch (err: any) {
      setError("Failed to load embryology data");
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Populate form for selected day ──────────────────────────
  const loadFormForDay = useCallback((day: EmbryoDay) => {
    const record = records.find((r) => r.dayNumber === day);
    if (record) {
      setEmbryoCount(record.embryoCount.toString());
      setIcsiMethod(record.icsiMethod || "");
      setIcsiPerformedById(record.icsiPerformedById || "");
      setEmbryos(record.details || []);
      setNotes(record.notes || "");
    } else {
      setEmbryoCount("");
      setIcsiMethod("");
      setIcsiPerformedById("");
      setEmbryos([]);
      setNotes("");
    }
  }, [records]);

  // When activeDay changes or records load, populate the form
  useEffect(() => {
    loadFormForDay(activeDay);
  }, [activeDay, records, loadFormForDay]);

  // ── Start editing ──────────────────────────────────────────
  const startEditing = () => {
    setEditingDay(activeDay);
  };

  const cancelEditing = () => {
    setEditingDay(null);
    loadFormForDay(activeDay);
  };

  // ── Embryo management ──────────────────────────────────────
  const updateEmbryo = (index: number, field: keyof EmbryoGrading, value: any) => {
    setEmbryos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addEmbryo = () => {
    setEmbryos((prev) => [
      ...prev,
      {
        embryoNumber: prev.length + 1,
        cellCount: undefined,
        fragmentation: undefined,
        symmetry: undefined,
        multinucleation: undefined,
        expansion: undefined,
        icm: undefined,
        te: undefined,
        pnCount: undefined,
        fertilizationStatus: undefined,
        compaction: undefined,
        grade: undefined,
        notes: undefined,
      },
    ]);
  };

  const removeEmbryo = (index: number) => {
    setEmbryos((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Renumber
      return filtered.map((e, i) => ({ ...e, embryoNumber: i + 1 }));
    });
  };

  // ── Sync embryo count with form ────────────────────────────
  useEffect(() => {
    const count = parseInt(embryoCount);
    if (!isNaN(count) && count >= 0) {
      setEmbryos((prev) => {
        if (prev.length === count) return prev;
        if (prev.length < count) {
          const newEmbryos = [...prev];
          for (let i = prev.length + 1; i <= count; i++) {
            newEmbryos.push({ embryoNumber: i });
          }
          return newEmbryos;
        }
        // Trim
        return prev.slice(0, count).map((e, i) => ({ ...e, embryoNumber: i + 1 }));
      });
    }
  }, [embryoCount]);

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: Record<string, unknown> = {
        dayNumber: activeDay,
        embryoCount: parseInt(embryoCount) || 0,
        notes: notes || undefined,
      };

      // Day-specific fields
      if (activeDay === "D0" && icsiMethod) payload.icsiMethod = icsiMethod;
      if (activeDay === "D0" && icsiPerformedById) payload.icsiPerformedById = icsiPerformedById;

      // Clean embryo data — only include non-empty entries
      const cleanEmbryos = embryos
        .filter((e) => e.cellCount != null || e.fertilizationStatus || e.grade || e.icm || e.te || e.notes)
        .map((e) => {
          const clean: Record<string, unknown> = { embryoNumber: e.embryoNumber };
          if (e.cellCount != null) clean.cellCount = e.cellCount;
          if (e.fragmentation != null) clean.fragmentation = e.fragmentation;
          if (e.symmetry) clean.symmetry = e.symmetry;
          if (e.multinucleation != null) clean.multinucleation = e.multinucleation;
          if (e.expansion != null) clean.expansion = e.expansion;
          if (e.icm) clean.icm = e.icm;
          if (e.te) clean.te = e.te;
          if (e.pnCount != null) clean.pnCount = e.pnCount;
          if (e.fertilizationStatus) clean.fertilizationStatus = e.fertilizationStatus;
          if (e.compaction != null) clean.compaction = e.compaction;
          if (e.grade) clean.grade = e.grade;
          if (e.notes) clean.notes = e.notes;
          return clean;
        });

      if (cleanEmbryos.length > 0) payload.details = cleanEmbryos;

      if (activeRecord) {
        await api.put(`/embryology/cycles/${cycleId}/records/${activeRecord.id}`, payload);
        setSuccessMsg(`Day ${activeDay} updated successfully`);
      } else {
        await api.post(`/embryology/cycles/${cycleId}/records`, payload);
        setSuccessMsg(`Day ${activeDay} recorded successfully`);
      }

      setEditingDay(null);
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

  const daysWithRecords = new Set(records.map((r) => r.dayNumber));

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
            <h1 className="text-2xl font-bold text-gray-900">Embryology Lab</h1>
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
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{successMsg}</div>
      )}

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{records.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Days Recorded</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {records.length > 0 ? Math.max(...records.map((r) => r.embryoCount)) : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Max Embryos</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {records.find((r) => r.dayNumber === "D5")?.embryoCount ?? "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Blastocyst (D5)</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-600">
              {(() => {
                const d7 = records.find((r) => r.dayNumber === "D7");
                if (d7) return d7.embryoCount;
                const d6 = records.find((r) => r.dayNumber === "D6");
                if (d6) return d6.embryoCount;
                const d5 = records.find((r) => r.dayNumber === "D5");
                return d5?.embryoCount ?? "—";
              })()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Final Embryos</p>
          </div>
        </Card>
      </div>

      {/* ── Day Selector ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {EMBRYO_DAYS.map((day) => {
          const hasDayRecord = daysWithRecords.has(day);
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                setActiveDay(day);
                setEditingDay(null);
              }}
              className={`relative px-3 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer
                ${isActive
                  ? `ring-2 ${DAY_ACTIVE_COLORS[day]} bg-gray-50 shadow-sm`
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${DAY_COLORS[day]}`} />
                <span>{day}</span>
                {hasDayRecord && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{DAY_LABELS[day]}</p>
            </button>
          );
        })}
      </div>

      {/* ── Day Content ─────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${DAY_COLORS[activeDay]}`} />
                  <span>Day {activeDay.replace("D", "")} — {DAY_LABELS[activeDay]}</span>
                </span>
              }
              subtitle={DAY_DESCRIPTIONS[activeDay]}
            />
          </div>
          {!isEditing && hasRecord && (
            <Button onClick={startEditing} variant="outline" size="sm" icon={<Edit3 className="w-4 h-4" />}>
              Edit
            </Button>
          )}
        </div>

        {!isEditing && !hasRecord && (
          <div className="text-center py-8">
            <Microscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No record for {activeDay}</p>
            <p className="text-sm text-gray-400 mt-1">Click the button below to start recording</p>
            <div className="mt-4">
              <Button onClick={startEditing} icon={<FlaskConical className="w-4 h-4" />}>
                Record Day {activeDay.replace("D", "")}
              </Button>
            </div>
          </div>
        )}

        {!isEditing && hasRecord && (
          <div className="space-y-5">
            {/* ICSI info — only shown for D0 */}
            {activeDay === "D0" && activeRecord.icsiMethod && (
              <div className="flex items-center gap-4 flex-wrap">
                {activeRecord.icsiMethod && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">ICSI Method:</span>
                    <span className="font-medium text-gray-900">{activeRecord.icsiMethod}</span>
                  </div>
                )}
                {activeRecord.icsiPerformedBy && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Performed by:</span>
                    <span className="font-medium text-gray-900">
                      Dr. {activeRecord.icsiPerformedBy.firstName} {activeRecord.icsiPerformedBy.lastName}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Embryo Count:</span>
              <span className="font-semibold text-gray-900">{activeRecord.embryoCount}</span>
            </div>

            {/* Embryo Grading Table */}
            {activeRecord.details && activeRecord.details.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">#</th>
                      {(activeDay === "D0" || activeDay === "D1") && (
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Fert.</th>
                      )}
                      {activeDay === "D1" && (
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">PN</th>
                      )}
                      {(EMBRYO_DAYS_FOR.cleavage.includes(activeDay)) && (
                        <>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">Cells</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">Frag.</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">Sym.</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">MN</th>
                        </>
                      )}
                      {activeDay === "D4" && (
                        <th className="text-left py-2 px-2 text-gray-500 font-medium">Compact.</th>
                      )}
                      {(EMBRYO_DAYS_FOR.blastocyst.includes(activeDay)) && (
                        <>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">Exp.</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">ICM</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">TE</th>
                        </>
                      )}
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Grade</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecord.details.map((embryo, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium text-gray-900">{embryo.embryoNumber}</td>
                        {(activeDay === "D0" || activeDay === "D1") && (
                          <td className="py-2 px-2">
                            {embryo.fertilizationStatus ? (
                              <Badge
                                variant={
                                  embryo.fertilizationStatus === "2PN" ? "success" :
                                  embryo.fertilizationStatus === "DEGENERATED" ? "error" :
                                  "warning"
                                }
                                size="sm"
                              >
                                {embryo.fertilizationStatus}
                              </Badge>
                            ) : "—"}
                          </td>
                        )}
                        {activeDay === "D1" && (
                          <td className="py-2 px-2">{embryo.pnCount ?? "—"}</td>
                        )}
                        {(EMBRYO_DAYS_FOR.cleavage.includes(activeDay)) && (
                          <>
                            <td className="py-2 px-2 font-medium">{embryo.cellCount ?? "—"}</td>
                            <td className="py-2 px-2">
                              {embryo.fragmentation != null ? (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-8 h-1.5 rounded-full bg-gray-200 overflow-hidden"
                                    title={`${embryo.fragmentation}%`}
                                  >
                                    <div
                                      className={`h-full rounded-full ${
                                        embryo.fragmentation <= 10 ? "bg-emerald-500" :
                                        embryo.fragmentation <= 25 ? "bg-amber-500" :
                                        "bg-rose-500"
                                      }`}
                                      style={{ width: `${embryo.fragmentation}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">{embryo.fragmentation}%</span>
                                </div>
                              ) : "—"}
                            </td>
                            <td className="py-2 px-2">{embryo.symmetry ?? "—"}</td>
                            <td className="py-2 px-2">
                              {embryo.multinucleation != null
                                ? (embryo.multinucleation
                                  ? <span className="text-rose-600 font-medium">Yes</span>
                                  : <span className="text-emerald-600">No</span>)
                                : "—"}
                            </td>
                          </>
                        )}
                        {activeDay === "D4" && (
                          <td className="py-2 px-2">
                            {embryo.compaction != null
                              ? (embryo.compaction
                                ? <span className="text-emerald-600 font-medium">Compacted</span>
                                : <span className="text-amber-600">Not compacted</span>)
                              : "—"}
                          </td>
                        )}
                        {(EMBRYO_DAYS_FOR.blastocyst.includes(activeDay)) && (
                          <>
                            <td className="py-2 px-2">{embryo.expansion ? `Grade ${embryo.expansion}` : "—"}</td>
                            <td className="py-2 px-2">{embryo.icm ?? "—"}</td>
                            <td className="py-2 px-2">{embryo.te ?? "—"}</td>
                          </>
                        )}
                        <td className="py-2 px-2">
                          {embryo.grade ? (
                            <Badge
                              variant={
                                ["AA", "AB", "BA", "A", "B"].includes(embryo.grade) ? "success" : "warning"
                              }
                              size="sm"
                            >
                              {embryo.grade}
                            </Badge>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-2 text-gray-500 text-xs max-w-[120px] truncate">
                          {embryo.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeRecord.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Lab Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeRecord.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Edit / Create Form ─────────────────────────────── */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {activeDay === "D0" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ICSI / Insemination Method</label>
                  <div className="flex flex-wrap gap-2">
                    {ICSI_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setIcsiMethod(method)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                          icsiMethod === method
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ICSI Performed By</label>
                  <select
                    value={icsiPerformedById}
                    onChange={(e) => setIcsiPerformedById(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select embryologist...</option>
                    {physicians.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.firstName} {doc.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Embryo Count */}
            <Input
              label="Embryo Count"
              type="number"
              min="0"
              value={embryoCount}
              onChange={(e) => setEmbryoCount(e.target.value)}
              placeholder="Number of embryos observed"
              icon={<Activity className="w-4 h-4 text-gray-400" />}
            />

            {/* Per-Embryo Grading */}
            {parseInt(embryoCount) > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Embryo Grading Details</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addEmbryo} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add
                  </Button>
                </div>

                <div className="space-y-4">
                  {embryos.map((embryo, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Embryo #{embryo.embryoNumber}</h4>
                        {embryos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmbryo(idx)}
                            className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Fertilization (D0-D1) */}
                      {(activeDay === "D0" || activeDay === "D1") && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fertilization Status</label>
                            <select
                              value={embryo.fertilizationStatus || ""}
                              onChange={(e) => updateEmbryo(idx, "fertilizationStatus", e.target.value || undefined)}
                              className="block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">—</option>
                              {FERTILIZATION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <Input
                            label="PN Count"
                            type="number"
                            min="0"
                            max="6"
                            value={embryo.pnCount?.toString() || ""}
                            onChange={(e) => updateEmbryo(idx, "pnCount", e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="e.g., 2"
                          />
                        </div>
                      )}

                      {/* Cleavage (D2-D3) */}
                      {(EMBRYO_DAYS_FOR.cleavage.includes(activeDay)) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <Input
                            label="Cell Count"
                            type="number"
                            min="1"
                            value={embryo.cellCount?.toString() || ""}
                            onChange={(e) => updateEmbryo(idx, "cellCount", e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="e.g., 8"
                          />
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fragmentation (%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={embryo.fragmentation ?? 0}
                              onChange={(e) => updateEmbryo(idx, "fragmentation", parseInt(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">{embryo.fragmentation ?? 0}%</span>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Symmetry</label>
                            <select
                              value={embryo.symmetry || ""}
                              onChange={(e) => updateEmbryo(idx, "symmetry", e.target.value || undefined)}
                              className="block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">—</option>
                              <option value="EQUAL">Equal</option>
                              <option value="UNEQUAL">Unequal</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Multinucleation</label>
                            <select
                              value={embryo.multinucleation == null ? "" : embryo.multinucleation ? "true" : "false"}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateEmbryo(idx, "multinucleation", val === "" ? undefined : val === "true");
                              }}
                              className="block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">—</option>
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Morula compaction (D4) */}
                      {activeDay === "D4" && (
                        <div className="mb-3">
                          <label className="block text-xs text-gray-500 mb-1">Compaction</label>
                          <select
                            value={embryo.compaction == null ? "" : embryo.compaction ? "true" : "false"}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateEmbryo(idx, "compaction", val === "" ? undefined : val === "true");
                            }}
                            className="block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">—</option>
                            <option value="true">Compacted</option>
                            <option value="false">Not Compacted</option>
                          </select>
                        </div>
                      )}

                      {/* Blastocyst (D5-D7) */}
                      {(EMBRYO_DAYS_FOR.blastocyst.includes(activeDay)) && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Expansion Grade</label>
                            <select
                              value={embryo.expansion?.toString() || ""}
                              onChange={(e) => updateEmbryo(idx, "expansion", e.target.value ? parseInt(e.target.value) : undefined)}
                              className="block w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">—</option>
                              {[1, 2, 3, 4, 5, 6].map((n) => (
                                <option key={n} value={n}>Grade {n}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">ICM Grade</label>
                            <div className="flex gap-1">
                              {(["A", "B", "C"] as const).map((grade) => (
                                <button
                                  key={grade}
                                  type="button"
                                  onClick={() => updateEmbryo(idx, "icm", embryo.icm === grade ? undefined : grade)}
                                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                                    embryo.icm === grade
                                      ? "border-primary-500 bg-primary-50 text-primary-700 font-semibold"
                                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                                  }`}
                                >
                                  {grade}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">TE Grade</label>
                            <div className="flex gap-1">
                              {(["A", "B", "C"] as const).map((grade) => (
                                <button
                                  key={grade}
                                  type="button"
                                  onClick={() => updateEmbryo(idx, "te", embryo.te === grade ? undefined : grade)}
                                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                                    embryo.te === grade
                                      ? "border-primary-500 bg-primary-50 text-primary-700 font-semibold"
                                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                                  }`}
                                >
                                  {grade}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Aggregate Grade */}
                      <div className="flex items-center gap-2 mb-3">
                        <label className="text-xs text-gray-500">Overall Grade:</label>
                        <input
                          type="text"
                          value={embryo.grade || ""}
                          onChange={(e) => updateEmbryo(idx, "grade", e.target.value || undefined)}
                          placeholder="e.g., 4AA, 3AB, 2BB"
                          className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      {/* Embryo notes */}
                      <div>
                        <input
                          type="text"
                          value={embryo.notes || ""}
                          onChange={(e) => updateEmbryo(idx, "notes", e.target.value || undefined)}
                          placeholder="Notes for this embryo..."
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <Dna className="w-3.5 h-3.5 text-gray-400" />
                  Lab Notes
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="General observations, culture conditions, or any issues..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? "Saving..." : hasRecord ? "Update Day" : "Save Day"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
