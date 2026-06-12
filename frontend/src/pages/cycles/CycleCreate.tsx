import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Syringe, Search, Users, UserCheck, Plus, X, AlertTriangle, Dna, Beaker, Stethoscope,
} from "lucide-react";

type ARTType = "ICSI" | "IVF" | "IUI" | "FET" | "NATURAL";
type PGDType = "PGS" | "PGD" | "NONE" | "";

const ART_OPTIONS: { value: ARTType; label: string; description: string }[] = [
  { value: "ICSI", label: "ICSI", description: "Intracytoplasmic Sperm Injection" },
  { value: "IVF", label: "IVF", description: "In Vitro Fertilization" },
  { value: "IUI", label: "IUI", description: "Intrauterine Insemination" },
  { value: "FET", label: "FET", description: "Frozen Embryo Transfer" },
  { value: "NATURAL", label: "Natural", description: "Natural Cycle" },
];

const PGD_OPTIONS: { value: PGDType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "PGS", label: "PGS (Aneuploidy Screening)" },
  { value: "PGD", label: "PGD (Monogenic Disease)" },
];

const STIMULATION_PROTOCOLS = [
  "Antagonist", "Agonist (Long)", "Agonist (Short)", "GnRH Antagonist",
  "Mini-Stimulation", "Natural", "PPOS", "DuoStim", "Other",
];

interface CycleSummary {
  id: string;
  cycleNumber: number;
  artType: string;
  status: string;
  createdAt: string;
}

interface CoupleWithCycles {
  id: string;
  wifePatient?: { id: string; firstName: string; lastName: string; mrn: string; dateOfBirth: string };
  husbandPatient?: { id: string; firstName: string; lastName: string; mrn: string; dateOfBirth: string };
  cycles: CycleSummary[];
  cycleCount: number;
  completedCycleCount: number;
  activeCycleCount: number;
  latestCycle: CycleSummary | null;
}

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  staffCode: string;
  role?: { name: string; label: string };
}

interface DrugRow {
  name: string;
  dosage: string;
  unit: string;
  startDay: number;
  endDay: number | undefined;
}

export function CycleCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Couple selection
  const [coupleSearch, setCoupleSearch] = useState("");
  const [allCouples, setAllCouples] = useState<CoupleWithCycles[]>([]);
  const [loadingCouples, setLoadingCouples] = useState(true);
  const [selectedCouple, setSelectedCouple] = useState<CoupleWithCycles | null>(null);

  // Load all couples on mount
  useEffect(() => {
    const loadCouples = async () => {
      setLoadingCouples(true);
      try {
        const res = await api.get<{ success: boolean; data: CoupleWithCycles[] }>("/couples?limit=100");
        setAllCouples(res.data || []);
      } catch {
        setAllCouples([]);
      } finally {
        setLoadingCouples(false);
      }
    };
    loadCouples();
  }, []);

  // Filter couples by search query
  const filteredCouples = allCouples.filter((c) => {
    if (!coupleSearch || coupleSearch.length < 2) return true;
    const q = coupleSearch.toLowerCase();
    const wife = c.wifePatient;
    const husband = c.husbandPatient;
    return (
      (wife?.firstName || "").toLowerCase().includes(q) ||
      (wife?.lastName || "").toLowerCase().includes(q) ||
      (wife?.mrn || "").toLowerCase().includes(q) ||
      (husband?.firstName || "").toLowerCase().includes(q) ||
      (husband?.lastName || "").toLowerCase().includes(q) ||
      (husband?.mrn || "").toLowerCase().includes(q)
    );
  });

  // Step 2: Form fields
  const [artType, setArtType] = useState<ARTType>("ICSI");
  const [pgdType, setPgdType] = useState<PGDType>("NONE");
  const [pgdGene, setPgdGene] = useState("");
  const [pgdMutation, setPgdMutation] = useState("");
  const [pgdInheritanceMode, setPgdInheritanceMode] = useState("");
  const [pgdMarkers, setPgdMarkers] = useState("");
  const [pgdTestMethod, setPgdTestMethod] = useState("");
  const [pgdFemaleDiagnosis, setPgdFemaleDiagnosis] = useState("");
  const [pgdMaleDiagnosis, setPgdMaleDiagnosis] = useState("");
  const [stimulationProtocol, setStimulationProtocol] = useState("");
  const [drugs, setDrugs] = useState<DrugRow[]>([]);
  const [physicians, setPhysicians] = useState<UserResult[]>([]);
  const [treatingPhysicianId, setTreatingPhysicianId] = useState("");
  const [lmp, setLmp] = useState("");
  const [bmi, setBmi] = useState("");
  const [cycleWarnings, setCycleWarnings] = useState("");
  const [notes, setNotes] = useState("");

  // Load physicians for dropdown
  useEffect(() => {
    const loadPhysicians = async () => {
      try {
        const res = await api.get<{ success: boolean; data: UserResult[] }>("/users/physicians");
        const doctors = (res.data || []);
        setPhysicians(doctors);
      } catch {
        // Physicians list is supplementary
      }
    };
    loadPhysicians();
  }, []);



  const addDrug = () => {
    setDrugs([...drugs, { name: "", dosage: "", unit: "mg", startDay: 1, endDay: undefined }]);
  };

  const updateDrug = (index: number, field: keyof DrugRow, value: string | number) => {
    const updated = [...drugs];
    (updated[index] as any)[field] = value;
    setDrugs(updated);
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCouple) {
      setError("Please select a couple to start the cycle");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        coupleId: selectedCouple.id,
        artType,
      };

      if (pgdType) payload.pgdType = pgdType;
      if (pgdType !== "NONE") {
        if (pgdGene) payload.pgdGene = pgdGene;
        if (pgdMutation) payload.pgdMutation = pgdMutation;
        if (pgdInheritanceMode) payload.pgdInheritanceMode = pgdInheritanceMode;
        if (pgdMarkers) payload.pgdMarkers = pgdMarkers;
        if (pgdTestMethod) payload.pgdTestMethod = pgdTestMethod;
        if (pgdFemaleDiagnosis) payload.pgdFemaleDiagnosis = pgdFemaleDiagnosis;
        if (pgdMaleDiagnosis) payload.pgdMaleDiagnosis = pgdMaleDiagnosis;
      }
      if (stimulationProtocol) payload.stimulationProtocol = stimulationProtocol;
      if (drugs.length > 0) payload.stimulationDrugs = drugs;
      if (treatingPhysicianId) payload.treatingPhysicianId = treatingPhysicianId;
      if (lmp) payload.lmp = new Date(lmp).toISOString();
      if (bmi) payload.bmi = parseFloat(bmi);
      if (cycleWarnings) payload.cycleWarnings = cycleWarnings;
      if (notes) payload.notes = notes;

      const res = await api.post<{ success: boolean; data: { id: string; cycleNumber: number } }>("/cycles", payload);
      navigate(`/cycles/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create cycle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/cycles" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Start New Treatment Cycle</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? "Step 1: Select the patient couple" : "Step 2: Configure cycle parameters"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          step === 1 ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
        }`}>
          <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs font-bold">
            {step > 1 ? "✓" : "1"}
          </span>
          Select Couple
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          step === 2 ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
        }`}>
          <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs font-bold">2</span>
          Cycle Details
        </div>
      </div>

      {step === 1 && (
        <Card>
          <div className="space-y-4">
            <CardHeader title="Select Patient Couple" subtitle="Choose the couple to start a new treatment cycle" />

            {/* Search / Filter */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by patient name or MRN..."
                value={coupleSearch}
                onChange={(e) => setCoupleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {loadingCouples ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
                <Spinner size={16} /> Loading couples...
              </div>
            ) : selectedCouple ? (
              /* Selected couple summary */
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Couple Selected</p>
                      <p className="text-xs text-gray-500">
                        {selectedCouple.wifePatient?.firstName} {selectedCouple.wifePatient?.lastName}
                        {" ("}{selectedCouple.wifePatient?.mrn}{") & "}
                        {selectedCouple.husbandPatient?.firstName} {selectedCouple.husbandPatient?.lastName}
                        {" ("}{selectedCouple.husbandPatient?.mrn}{")"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCouple(null); setCoupleSearch(""); }}
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : filteredCouples.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">
                  {coupleSearch.length >= 2 ? "No couples match your search" : "No couples found"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {coupleSearch.length >= 2
                    ? "Try a different search term"
                    : "Register patients and link them as a couple first"}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Showing {filteredCouples.length} couple{filteredCouples.length !== 1 ? "s" : ""}
                  {allCouples.length !== filteredCouples.length
                    ? ` (filtered from ${allCouples.length})`
                    : ""}
                </p>

                {/* Couples Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Wife</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">MRN</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Husband</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">MRN</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600">Cycles</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600">Completed</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600">Active</th>
                        <th className="text-left px-3 py-3 font-medium text-gray-600">Latest Status</th>
                        <th className="text-center px-3 py-3 font-medium text-gray-600"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCouples.map((c) => {
                        const isSelected = selectedCouple?.id === c.id;
                        const completedPct = c.cycleCount > 0
                          ? Math.round((c.completedCycleCount / c.cycleCount) * 100)
                          : 0;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedCouple(c)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary-50 hover:bg-primary-100"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                              {c.wifePatient?.firstName} {c.wifePatient?.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                              {c.wifePatient?.mrn || "—"}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                              {c.husbandPatient?.firstName} {c.husbandPatient?.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                              {c.husbandPatient?.mrn || "—"}
                            </td>
                            <td className="px-3 py-3 text-center font-medium text-gray-900">
                              {c.cycleCount}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                                c.completedCycleCount > 0 ? "text-emerald-600" : "text-gray-400"
                              }`}>
                                {c.completedCycleCount > 0 ? (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {c.completedCycleCount}
                                  </>
                                ) : "0"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {c.activeCycleCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                  {c.activeCycleCount}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">0</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {c.latestCycle ? (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  c.latestCycle.status === "CYCLE_COMPLETED" || c.latestCycle.status === "PREGNANCY_CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : c.latestCycle.status === "CYCLE_CANCELLED"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}>
                                  {c.latestCycle.status === "PREGNANCY_CONFIRMED" ? "Confirmed" :
                                   c.latestCycle.status === "CYCLE_COMPLETED" ? "Completed" :
                                   c.latestCycle.status === "CYCLE_CANCELLED" ? "Cancelled" :
                                   c.latestCycle.status === "OPU_COMPLETED" ? "OPU Done" :
                                   c.latestCycle.status === "ET_COMPLETED" ? "ET Done" :
                                   c.latestCycle.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">No cycles</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Button
                                size="sm"
                                variant={isSelected ? "primary" : "outline"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCouple(c);
                                }}
                              >
                                {isSelected ? "Selected" : "Select"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Progress bar for overall cycle completion */}
                {filteredCouples.some((c) => c.cycleCount > 0) && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Overall Cycle Completion</span>
                      <span>
                        {filteredCouples.reduce((s, c) => s + c.completedCycleCount, 0)} /
                        {" "}{filteredCouples.reduce((s, c) => s + c.cycleCount, 0)} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (filteredCouples.reduce((s, c) => s + c.completedCycleCount, 0) /
                            Math.max(filteredCouples.reduce((s, c) => s + c.cycleCount, 0), 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button onClick={() => setStep(2)} disabled={!selectedCouple} icon={<Syringe className="w-4 h-4" />}>
                Continue to Cycle Details
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Selected Couple Summary */}
            {selectedCouple && (
              <Card>
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-primary-600" />
                  <div className="text-sm">
                    <span className="font-medium">Couple: </span>
                    {selectedCouple.wifePatient?.firstName} {selectedCouple.wifePatient?.lastName}
                    {" & "}
                    {selectedCouple.husbandPatient?.firstName} {selectedCouple.husbandPatient?.lastName}
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary-600 hover:text-primary-700 ml-auto cursor-pointer">
                    Change Couple
                  </button>
                </div>
              </Card>
            )}

            {/* ART Type */}
            <Card>
              <CardHeader title="ART Procedure" subtitle="Select the type of assisted reproductive technology" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ART_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setArtType(opt.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      artType === opt.value
                        ? "border-primary-500 bg-primary-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Syringe className={`w-6 h-6 mx-auto mb-2 ${artType === opt.value ? "text-primary-600" : "text-gray-400"}`} />
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* PGD/PGS */}
            <Card>
              <CardHeader title="PGD / PGS" subtitle="Preimplantation Genetic Testing" />
              <div className="space-y-4">
                <div className="flex gap-3">
                  {PGD_OPTIONS.filter((o) => o.value).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPgdType(opt.value)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                        pgdType === opt.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {pgdType !== "NONE" && pgdType !== "" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Input label="Gene" value={pgdGene} onChange={(e) => setPgdGene(e.target.value)} placeholder="e.g., CFTR, FMR1" icon={<Dna className="w-4 h-4 text-gray-400" />} />
                    <Input label="Mutation" value={pgdMutation} onChange={(e) => setPgdMutation(e.target.value)} placeholder="e.g., F508del" />
                    <Input label="Inheritance Mode" value={pgdInheritanceMode} onChange={(e) => setPgdInheritanceMode(e.target.value)} placeholder="e.g., Autosomal Recessive" />
                    <Input label="Markers" value={pgdMarkers} onChange={(e) => setPgdMarkers(e.target.value)} placeholder="Associated markers" />
                    <Input label="Test Method" value={pgdTestMethod} onChange={(e) => setPgdTestMethod(e.target.value)} placeholder="e.g., NGS, PCR" icon={<Beaker className="w-4 h-4 text-gray-400" />} />
                    <Input label="Female Diagnosis" value={pgdFemaleDiagnosis} onChange={(e) => setPgdFemaleDiagnosis(e.target.value)} />
                    <Input label="Male Diagnosis" value={pgdMaleDiagnosis} onChange={(e) => setPgdMaleDiagnosis(e.target.value)} />
                  </div>
                )}
              </div>
            </Card>

            {/* Stimulation Protocol */}
            <Card>
              <CardHeader title="Stimulation Protocol" subtitle="Ovarian stimulation settings" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Protocol</label>
                  <div className="flex flex-wrap gap-2">
                    {STIMULATION_PROTOCOLS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setStimulationProtocol(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                          stimulationProtocol === p
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stimulation Drugs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Medications / Drugs</label>
                    <Button type="button" size="sm" variant="outline" onClick={addDrug} icon={<Plus className="w-3.5 h-3.5" />}>
                      Add Drug
                    </Button>
                  </div>
                  {drugs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No drugs added yet. Click "Add Drug" to add stimulation medications.</p>
                  ) : (
                    <div className="space-y-2">
                      {drugs.map((drug, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            placeholder="Drug name"
                            value={drug.name}
                            onChange={(e) => updateDrug(i, "name", e.target.value)}
                            className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={drug.dosage}
                            onChange={(e) => updateDrug(i, "dosage", e.target.value)}
                            className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <select
                            value={drug.unit}
                            onChange={(e) => updateDrug(i, "unit", e.target.value)}
                            className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="mg">mg</option>
                            <option value="mcg">mcg</option>
                            <option value="IU">IU</option>
                            <option value="mL">mL</option>
                            <option value="tablet">tablet(s)</option>
                          </select>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Day</span>
                            <input
                              type="number"
                              min={1}
                              value={drug.startDay}
                              onChange={(e) => updateDrug(i, "startDay", parseInt(e.target.value) || 1)}
                              className="w-12 px-1 py-1.5 text-sm border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              min={1}
                              placeholder="∞"
                              value={drug.endDay ?? ""}
                              onChange={(e) => updateDrug(i, "endDay", e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-12 px-1 py-1.5 text-sm border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <button type="button" onClick={() => removeDrug(i)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Treating Physician */}
            <Card>
              <CardHeader title="Treating Physician" subtitle="Assign the responsible doctor" />
              <select
                value={treatingPhysicianId}
                onChange={(e) => setTreatingPhysicianId(e.target.value)}
                className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select physician...</option>
                {physicians.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.firstName} {doc.lastName} ({doc.staffCode})
                  </option>
                ))}
              </select>
            </Card>

            {/* Clinical Info */}
            <Card>
              <CardHeader title="Clinical Information" subtitle="Patient health metrics and warnings" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="LMP (Last Menstrual Period)" type="date" value={lmp}
                  onChange={(e) => setLmp(e.target.value)} helperText="Cycle start date" />
                <Input label="BMI" type="number" step="0.1" min="10" max="60" value={bmi}
                  onChange={(e) => setBmi(e.target.value)} placeholder="e.g., 24.5" helperText="kg/m²" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Warnings</label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-amber-400" />
                    <input
                      type="text" value={cycleWarnings} onChange={(e) => setCycleWarnings(e.target.value)}
                      placeholder="e.g., HEP B PATIENT, Allergic to..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Warnings will appear prominently on the cycle page</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this cycle..."
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back to Couple Selection
              </Button>
              <div className="flex gap-3">
                <Link to="/cycles">
                  <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                <Button type="submit" isLoading={saving} icon={<Syringe className="w-4 h-4" />}>
                  {saving ? "Creating Cycle..." : "Start Cycle"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
