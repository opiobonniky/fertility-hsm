import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Activity,
  Plus, X, Save,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface FollicleSize {
  size: number;
  count: number;
}

interface FollicleTrackingRecord {
  id: string;
  cycleId: string;
  dayNumber: number;
  date: string;
  rightOvary?: FollicleSize[] | null;
  leftOvary?: FollicleSize[] | null;
  endometrium?: string | null;
  notes?: string | null;
  recordedById?: string;
  createdAt: string;
}

interface CycleInfo {
  id: string;
  cycleNumber: number;
  artType: string;
  status: string;
  couple?: {
    wifePatient?: { firstName: string; lastName: string; mrn: string };
    husbandPatient?: { firstName: string; lastName: string; mrn: string };
  };
}

// ── Helpers ────────────────────────────────────────────────────

const FILL_COLORS = [
  "bg-blue-400", "bg-blue-500", "bg-indigo-500", "bg-violet-500",
  "bg-purple-500", "bg-pink-500", "bg-rose-500",
];

function getSizeColor(size: number): string {
  if (size < 10) return "bg-blue-300";
  if (size < 14) return "bg-blue-400";
  if (size < 18) return "bg-indigo-400";
  if (size < 22) return "bg-violet-500";
  return "bg-rose-500";
}

function FollicleBubble({ size, count }: { size: number; count: number }) {
  const diameter = Math.min(28 + size, 56);
  return (
    <div className="flex flex-col items-center gap-0.5" title={`${size}mm — ${count} follicle(s)`}>
      <div
        className={`rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-transform hover:scale-110 ${getSizeColor(size)}`}
        style={{ width: diameter, height: diameter }}
      >
        {count}
      </div>
      <span className="text-[10px] text-gray-500">{size}mm</span>
    </div>
  );
}

function OvaryPanel({ label, follicles, className }: { label: string; follicles?: FollicleSize[] | null; className?: string }) {
  const hasData = follicles && follicles.length > 0;
  const total = hasData ? follicles!.reduce((s, f) => s + f.count, 0) : 0;
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
      {hasData ? (
        <>
          <div className="flex flex-wrap gap-2">
            {follicles!.map((f, i) => (
              <FollicleBubble key={i} size={f.size} count={f.count} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Total: {total} follicle(s)</p>
        </>
      ) : (
        <p className="text-xs text-gray-400 italic">Not recorded</p>
      )}
    </div>
  );
}

// ── Follicle Size Input Row ────────────────────────────────────

function FollicleSizeRow({
  sizes,
  onChange,
  onRemove,
}: {
  sizes: FollicleSize[];
  onChange: (sizes: FollicleSize[]) => void;
  onRemove?: () => void;
}) {
  const update = (index: number, field: keyof FollicleSize, value: number) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      {sizes.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <label className="text-xs text-gray-500 w-8">{i + 1}.</label>
            <input
              type="number"
              min={1}
              max={40}
              placeholder="Size (mm)"
              value={f.size || ""}
              onChange={(e) => update(i, "size", parseInt(e.target.value) || 0)}
              className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <span className="text-xs text-gray-400">×</span>
            <input
              type="number"
              min={1}
              max={20}
              placeholder="Count"
              value={f.count || ""}
              onChange={(e) => update(i, "count", parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <span className="text-[10px] text-gray-400">follicle(s)</span>
          </div>
          {sizes.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(sizes.filter((_, j) => j !== i))}
              className="p-1 text-gray-300 hover:text-rose-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...sizes, { size: 0, count: 1 }])}
        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1 cursor-pointer"
      >
        <Plus className="w-3 h-3" /> Add size group
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function FollicleTracking() {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const [records, setRecords] = useState<FollicleTrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dayNumber, setDayNumber] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rightFollicles, setRightFollicles] = useState<FollicleSize[]>([{ size: 0, count: 1 }]);
  const [leftFollicles, setLeftFollicles] = useState<FollicleSize[]>([{ size: 0, count: 1 }]);
  const [endometrium, setEndometrium] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // ── Load cycle info ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!cycleId) return;
    setError(null);
    setLoading(true);
    try {
      const [cycleRes, folliclesRes] = await Promise.all([
        api.get<{ success: boolean; data: CycleInfo }>(`/cycles/${cycleId}`),
        api.get<{ success: boolean; data: FollicleTrackingRecord[] }>(`/cycles/${cycleId}/follicles`),
      ]);
      setCycle(cycleRes.data);
      setRecords(folliclesRes.data || []);

      // Suggest next day number
      const existing = folliclesRes.data || [];
      if (existing.length > 0) {
        const maxDay = Math.max(...existing.map((r) => r.dayNumber));
        setDayNumber(maxDay + 1);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load cycle data");
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Submit new tracking day ───────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleId) return;
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        dayNumber,
        date: new Date(date + "T00:00:00").toISOString(),
        endometrium: endometrium || undefined,
        notes: formNotes || undefined,
      };

      const cleanFollicles = (arr: FollicleSize[]) =>
        arr.filter((f) => f.size > 0).map((f) => ({ size: f.size, count: f.count }));

      const rightClean = cleanFollicles(rightFollicles);
      const leftClean = cleanFollicles(leftFollicles);
      if (rightClean.length > 0) payload.rightOvary = rightClean;
      if (leftClean.length > 0) payload.leftOvary = leftClean;

      await api.post(`/cycles/${cycleId}/follicles`, payload);
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save tracking");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    const nextDay = records.length > 0 ? Math.max(...records.map((r) => r.dayNumber)) + 1 : 1;
    setDayNumber(nextDay);
    setDate(new Date().toISOString().split("T")[0]);
    setRightFollicles([{ size: 0, count: 1 }]);
    setLeftFollicles([{ size: 0, count: 1 }]);
    setEndometrium("");
    setFormNotes("");
  };

  // ── Helpers ───────────────────────────────────────────────────
  const totalRightFollicles = records.reduce(
    (sum, r) => sum + (r.rightOvary?.reduce((s, f) => s + f.count, 0) || 0), 0
  );
  const totalLeftFollicles = records.reduce(
    (sum, r) => sum + (r.leftOvary?.reduce((s, f) => s + f.count, 0) || 0), 0
  );
  const trackedDays = records.length;

  const sortedRecords = [...records].sort((a, b) => a.dayNumber - b.dayNumber);

  // ── Render ────────────────────────────────────────────────────
  if (loading && !cycle) return <PageLoader />;
  if (!cycle && !loading) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Cycle not found</p>
      <Link to="/cycles" className="text-primary-600 text-sm mt-2 inline-block">Back to cycles</Link>
    </div>
  );

  const wifeName = cycle?.couple?.wifePatient
    ? `${cycle.couple.wifePatient.firstName} ${cycle.couple.wifePatient.lastName}`
    : "—";
  const husbandName = cycle?.couple?.husbandPatient
    ? `${cycle.couple.husbandPatient.firstName} ${cycle.couple.husbandPatient.lastName}`
    : "";

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/cycles"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Follicle Tracking</h1>
            {cycle && <Badge variant="purple" size="sm">{cycle.artType}</Badge>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Cycle #{cycle?.cycleNumber} — {wifeName}{husbandName ? ` & ${husbandName}` : ""}
          </p>
        </div>
        {cycle && <StatusBadge status={cycle.status} />}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Summary Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{trackedDays}</p>
            <p className="text-xs text-gray-500 mt-0.5">Days Tracked</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalRightFollicles}</p>
            <p className="text-xs text-gray-500 mt-0.5">Right Ovary Total</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalLeftFollicles}</p>
            <p className="text-xs text-gray-500 mt-0.5">Left Ovary Total</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {cycle?.status === "UNDER_STIMULATION" ? "Active" : cycle?.status?.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Cycle Status</p>
          </div>
        </Card>
      </div>

      {/* ── Add New Day Button ────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tracking Days</h2>
          <p className="text-sm text-gray-500">Daily ultrasound follicle measurements during stimulation</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            Record New Day
          </Button>
        )}
      </div>

      {/* ── Add Day Form ──────────────────────────────────────── */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CardHeader
              title="New Follicle Tracking"
              subtitle={`Day ${dayNumber} — ${new Date(date + "T00:00:00").toLocaleDateString()}`}
              action={
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                  <X className="w-4 h-4" />
                </Button>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day Number</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={dayNumber}
                  onChange={(e) => setDayNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Ovary */}
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <label className="text-sm font-semibold text-gray-700">Right Ovary</label>
                </div>
                <FollicleSizeRow sizes={rightFollicles} onChange={setRightFollicles} />
              </div>

              {/* Left Ovary */}
              <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <label className="text-sm font-semibold text-gray-700">Left Ovary</label>
                </div>
                <FollicleSizeRow sizes={leftFollicles} onChange={setLeftFollicles} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endometrium</label>
                <input
                  type="text"
                  value={endometrium}
                  onChange={(e) => setEndometrium(e.target.value)}
                  placeholder="e.g., Triple-line 10mm, Not visualized"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-0.5">Thickness, pattern, and appearance</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional observations..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving} icon={<Save className="w-4 h-4" />}>
                {saving ? "Saving..." : "Save Day"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Tracking Records ──────────────────────────────────── */}
      {sortedRecords.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tracking data yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Record New Day" to start follicle tracking</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedRecords.map((record) => (
            <Card key={record.id} className="hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${record.dayNumber <= 6 ? "bg-blue-500" : record.dayNumber <= 10 ? "bg-indigo-500" : "bg-violet-500"}`}>
                    {record.dayNumber}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Day {record.dayNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {record.endometrium && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Endometrium</p>
                      <p className="text-sm font-medium text-amber-700">{record.endometrium}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OvaryPanel label="Right Ovary" follicles={record.rightOvary} className="p-3 bg-blue-50/30 rounded-lg" />
                <OvaryPanel label="Left Ovary" follicles={record.leftOvary} className="p-3 bg-indigo-50/30 rounded-lg" />
              </div>

              {record.notes && (
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">{record.notes}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Growth Trend Visualization ────────────────────────── */}
      {sortedRecords.length >= 2 && (
        <Card>
          <CardHeader title="Follicle Growth Trend" subtitle="Maximum follicle size by day" />
          <div className="flex items-end gap-1.5 h-32 pt-2">
            {sortedRecords.map((record, idx) => {
              const allFollicles = [...(record.rightOvary || []), ...(record.leftOvary || [])];
              const maxSize = allFollicles.length > 0 ? Math.max(...allFollicles.map((f) => f.size)) : 0;
              const heightPercent = Math.min((maxSize / 25) * 100, 100);
              const isDominant = maxSize >= 18;
              return (
                <div key={record.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500">{maxSize > 0 ? `${maxSize}mm` : ""}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${isDominant ? "bg-rose-500" : "bg-primary-400"}`}
                    style={{ height: `${Math.max(heightPercent, 2)}%`, minHeight: maxSize > 0 ? 4 : 2 }}
                  />
                  <span className="text-[10px] text-gray-400">D{record.dayNumber}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary-400" />
              <span>Growing follicles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span>≥18mm (trigger-ready)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-amber-600">Dashed line: trigger threshold</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
