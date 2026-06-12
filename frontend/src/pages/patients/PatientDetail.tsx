import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, RoleBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { usePermission, FALLBACK_PERMISSIONS } from "@/components/auth/PermissionGate";
import { api } from "@/api/client";
import type { Patient, Prescription, ClinicalTimeline } from "@/types";
import {
  ArrowLeft, Users, Phone, Mail, MapPin, Globe, Briefcase, Calendar,
  Syringe, FlaskConical, Microscope, ClipboardPlus,
  ClipboardList, Heart, UserCheck, Stethoscope, FileText, Clock,
  Receipt, DollarSign, Plus, Edit2, Save, X, Trash2, AlertTriangle,
} from "lucide-react";

type TabType = "overview" | "medical-history" | "diagnoses" | "couple" | "cycles" | "investigations" | "prescriptions" | "appointments" | "billing" | "embryology";

const TABS: { id: TabType; label: string; icon: React.ReactNode; permission?: string }[] = [
  { id: "overview", label: "Overview", icon: <FileText className="w-4 h-4" /> },
  { id: "medical-history", label: "Medical History", icon: <Heart className="w-4 h-4" />, permission: "medical-history:view" },
  { id: "diagnoses", label: "Diagnoses", icon: <Stethoscope className="w-4 h-4" />, permission: "diagnosis:manage" },
  { id: "couple", label: "Couple Info", icon: <UserCheck className="w-4 h-4" />, permission: "couple:manage" },
  { id: "cycles", label: "Treatment Cycles", icon: <Syringe className="w-4 h-4" />, permission: "cycle:view" },
  { id: "embryology", label: "Embryology Lab", icon: <FlaskConical className="w-4 h-4" />, permission: "cycle:view" },
  { id: "investigations", label: "Investigations", icon: <Microscope className="w-4 h-4" />, permission: "investigation:view" },
  { id: "prescriptions", label: "Prescriptions", icon: <ClipboardPlus className="w-4 h-4" />, permission: "prescription:view" },
  { id: "appointments", label: "Appointments", icon: <Calendar className="w-4 h-4" />, permission: "appointment:view" },
  { id: "billing", label: "Billing", icon: <Receipt className="w-4 h-4" />, permission: "invoice:view" },
];

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [timeline, setTimeline] = useState<ClinicalTimeline | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [editingMedicalHistory, setEditingMedicalHistory] = useState(false);
  const [savingMedicalHistory, setSavingMedicalHistory] = useState(false);
  const [medicalHistoryForm, setMedicalHistoryForm] = useState<any>({
    obHistory: "",
    surgicalHistory: "",
    gynecologicalHistory: "",
    lmp: "",
    gravida: "",
    para: "",
    abortion: "",
    ectopic: "",
    livingChildren: "",
  });
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { user } = useAuthStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Declare all permission checks at the top level (Rules of Hooks)
  const canViewMedicalHistory = usePermission("medical-history:view");
  const canViewDiagnoses = usePermission("diagnosis:manage");
  const canViewCouple = usePermission("couple:manage");
  const canViewCycles = usePermission("cycle:view");
  const canViewInvestigations = usePermission("investigation:view");
  const canViewPrescriptions = usePermission("prescription:view");
  const canViewAppointments = usePermission("appointment:view");
  const canViewInvoices = usePermission("invoice:view");

  const permMap: Record<string, boolean> = {
    "medical-history:view": canViewMedicalHistory,
    "diagnosis:manage": canViewDiagnoses,
    "couple:manage": canViewCouple,
    "cycle:view": canViewCycles,
    "investigation:view": canViewInvestigations,
    "prescription:view": canViewPrescriptions,
    "appointment:view": canViewAppointments,
    "invoice:view": canViewInvoices,
  };

  const loadPatient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: any }>(`/patients/${id}`);
      setPatient(res.data);
    } catch (err) {
      console.error("Failed to load patient:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadInvoices = useCallback(async () => {
    if (!id) return;
    setLoadingInvoices(true);
    try {
      const res = await api.get<{ success: boolean; data: any[] }>(`/invoices?patientId=${id}`);
      setInvoices(res.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, [id]);

  const loadTimeline = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<{ success: boolean; data: ClinicalTimeline }>(`/prescriptions/patient/${id}/timeline`);
      setTimeline(res.data);
    } catch {
      // Timeline is supplementary
    }
  }, [id]);

  const handleEditMedicalHistory = () => {
    setMedicalHistoryForm({
      obHistory: patient.medicalHistory?.obHistory || "",
      surgicalHistory: patient.medicalHistory?.surgicalHistory || "",
      gynecologicalHistory: patient.medicalHistory?.gynecologicalHistory || "",
      lmp: patient.medicalHistory?.lmp ? patient.medicalHistory.lmp.split("T")[0] : "",
      gravida: patient.medicalHistory?.gravida?.toString() || "",
      para: patient.medicalHistory?.para?.toString() || "",
      abortion: patient.medicalHistory?.abortion?.toString() || "",
      ectopic: patient.medicalHistory?.ectopic?.toString() || "",
      livingChildren: patient.medicalHistory?.livingChildren?.toString() || "",
    });
    setEditingMedicalHistory(true);
  };

  const handleDeletePatient = async () => {
    if (!id) return;
    setDeleteError(null);
    setDeletingPatient(true);
    try {
      await api.delete(`/patients/${id}`);
      navigate("/patients");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete patient. They may have active invoices, cycles, or other records.";
      setDeleteError(msg);
      setDeletingPatient(false);
    }
  };

  const handleCancelMedicalHistory = () => {
    setEditingMedicalHistory(false);
    setMedicalHistoryForm({});
  };

  const [medicalHistorySaveError, setMedicalHistorySaveError] = useState<string | null>(null);

  const handleSaveMedicalHistory = async () => {
    if (!id) return;
    setMedicalHistorySaveError(null);
    setSavingMedicalHistory(true);
    try {
      const payload: Record<string, any> = {};
      // Text fields — always include (even empty strings to allow clearing)
      payload.obHistory = medicalHistoryForm.obHistory ?? "";
      payload.surgicalHistory = medicalHistoryForm.surgicalHistory ?? "";
      payload.gynecologicalHistory = medicalHistoryForm.gynecologicalHistory ?? "";
      // LMP
      if (medicalHistoryForm.lmp) {
        payload.lmp = new Date(medicalHistoryForm.lmp).toISOString();
      }
      // Numeric fields — only include if non-empty
      if (medicalHistoryForm.gravida !== "") payload.gravida = parseInt(medicalHistoryForm.gravida, 10);
      if (medicalHistoryForm.para !== "") payload.para = parseInt(medicalHistoryForm.para, 10);
      if (medicalHistoryForm.abortion !== "") payload.abortion = parseInt(medicalHistoryForm.abortion, 10);
      if (medicalHistoryForm.ectopic !== "") payload.ectopic = parseInt(medicalHistoryForm.ectopic, 10);
      if (medicalHistoryForm.livingChildren !== "") payload.livingChildren = parseInt(medicalHistoryForm.livingChildren, 10);

      await api.put(`/patients/${id}/medical-history`, payload);
      await loadPatient();
      setEditingMedicalHistory(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save medical history. Please try again.";
      setMedicalHistorySaveError(msg);
      console.error("Failed to save medical history:", err);
    } finally {
      setSavingMedicalHistory(false);
    }
  };

  useEffect(() => {
    loadPatient();
    loadTimeline();
    loadInvoices();
  }, [loadPatient, loadTimeline, loadInvoices]);

  if (loading) return <PageLoader />;
  if (!patient) return <div className="text-center py-12 text-gray-500">Patient not found</div>;

  const visibleTabs = TABS.filter((tab) => !tab.permission || permMap[tab.permission]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
            <Badge variant={patient.gender === "FEMALE" ? "info" : "neutral"} size="sm">
              {patient.gender === "FEMALE" ? "Female" : "Male"}
            </Badge>
            <Badge variant={patient.isActive ? "success" : "danger"} size="sm">
              {patient.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">MRN: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{patient.mrn}</code></p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${id}/edit`)}
            icon={<FileText className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Link to="/patients/new">
            <Button variant="outline" size="sm" icon={<Users className="w-4 h-4" />}>Register New</Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowDeleteDialog(true); setDeleteError(null); }}
            icon={<Trash2 className="w-4 h-4" />}
            className="!text-rose-600 !border-rose-200 hover:!bg-rose-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <>
            {/* Patient Info Card */}
            <Card><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InfoItem icon={<Calendar />} label="Date of Birth" value={new Date(patient.dateOfBirth).toLocaleDateString()} />
              <InfoItem icon={<Globe />} label="Nationality" value={patient.nationality || "—"} />
              <InfoItem icon={<Phone />} label="Phone" value={patient.phone} />
              <InfoItem icon={<Mail />} label="Email" value={patient.email || "—"} />
              <InfoItem icon={<MapPin />} label="Address" value={patient.address || "—"} />
              <InfoItem icon={<MapPin />} label="City" value={patient.city || "—"} />
              <InfoItem icon={<Briefcase />} label="Occupation" value={patient.occupation || "—"} />
              <InfoItem icon={<Briefcase />} label="Company" value={patient.company || "—"} />
              <InfoItem icon={<Globe />} label="Branch" value={patient.branch || "—"} />
              <InfoItem icon={<Clock />} label="Registered" value={new Date(patient.createdAt).toLocaleDateString()} />
              {patient.nationalId && <InfoItem icon={<FileText />} label="National ID" value={patient.nationalId} />}
            </div></Card>

            {/* Clinical Summary */}
            {timeline && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Prescriptions */}
                {canViewPrescriptions && timeline.prescriptions.length > 0 && (
                  <Card><CardHeader title="Active Prescriptions" subtitle={`${timeline.prescriptions.filter((p: any) => p.status === "ACTIVE").length} active`} />
                    <div className="space-y-2">
                      {timeline.prescriptions.slice(0, 5).map((rx: any) => (
                        <div key={rx.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div><p className="text-sm font-medium text-gray-900">{rx.medicationName}</p>
                            <p className="text-xs text-gray-500">{rx.dosage} — {rx.frequency.replace(/_/g, " ").toLowerCase()} | by {rx.prescribedBy?.firstName} {rx.prescribedBy?.lastName}</p></div>
                          <StatusBadge status={rx.status} />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Recent Investigations */}
                {canViewInvestigations && timeline.investigations?.length > 0 && (
                  <Card><CardHeader title="Recent Investigations" subtitle={`${timeline.investigations.length} total`} />
                    <div className="space-y-2">
                      {timeline.investigations.slice(0, 5).map((inv: any) => (
                        <Link key={inv.id} to={`/investigations/${inv.id}`} className="block">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                            <div><p className="text-sm font-medium text-gray-900">{inv.type.replace(/_/g, " ")}</p>
                              <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()} | Ordered by {inv.orderedBy?.firstName} {inv.orderedBy?.lastName}</p></div>
                            <Badge variant={inv.isAbnormal ? "danger" : "success"} size="sm">{inv.isAbnormal ? "Abnormal" : "Normal"}</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Active Cycles */}
                {canViewCycles && timeline.cycles?.length > 0 && (
                  <Card><CardHeader title="Treatment Cycles" subtitle={`${timeline.cycles.length} cycle(s)`} />
                    <div className="space-y-2">
                      {timeline.cycles.slice(0, 3).map((cycle: any) => (
                        <Link key={cycle.id} to={`/cycles/${cycle.id}`} className="block p-2 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">Cycle #{cycle.cycleNumber} — {cycle.artType}</p>
                            <StatusBadge status={cycle.status} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">OPU: {cycle.opuRecord?.oocyteCount || 0} oocytes | ET: {cycle.etRecord?.etDate ? new Date(cycle.etRecord.etDate).toLocaleDateString() : "Pending"}</p>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Upcoming Appointments */}
                {canViewAppointments && timeline.appointments?.length > 0 && (
                  <Card><CardHeader title="Appointments" subtitle={`${timeline.appointments.length} total`} />
                    <div className="space-y-2">
                      {timeline.appointments.slice(0, 3).map((appt: any) => (
                        <div key={appt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div><p className="text-sm font-medium text-gray-900">{appt.service}</p>
                            <p className="text-xs text-gray-500">{new Date(appt.startTime).toLocaleDateString()} {new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | Dr. {appt.physician?.firstName} {appt.physician?.lastName}</p></div>
                          <StatusBadge status={appt.status} />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "medical-history" && (
          <Card>
            <CardHeader
              title="Medical History"
              subtitle="Obstetric, surgical and gynecological history"
              action={
                !editingMedicalHistory && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit2 className="w-4 h-4" />}
                    onClick={handleEditMedicalHistory}
                  >
                    Edit
                  </Button>
                )
              }
            />
            {editingMedicalHistory ? (
              <div className="space-y-5">
                {/* Text fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OB History</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      value={medicalHistoryForm.obHistory}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, obHistory: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Surgical History</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      value={medicalHistoryForm.surgicalHistory}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, surgicalHistory: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gynecological History</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      value={medicalHistoryForm.gynecologicalHistory}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, gynecologicalHistory: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LMP (Last Menstrual Period)</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={medicalHistoryForm.lmp}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, lmp: e.target.value })}
                    />
                  </div>
                </div>

                {/* Numeric fields */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gravida</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={medicalHistoryForm.gravida}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, gravida: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Para</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={medicalHistoryForm.para}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, para: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abortion</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={medicalHistoryForm.abortion}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, abortion: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ectopic</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={medicalHistoryForm.ectopic}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, ectopic: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Living Children</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={medicalHistoryForm.livingChildren}
                      onChange={(e) => setMedicalHistoryForm({ ...medicalHistoryForm, livingChildren: e.target.value })}
                    />
                  </div>
                </div>

                {/* Error display */}
                {medicalHistorySaveError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                    {medicalHistorySaveError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Save className="w-4 h-4" />}
                    loading={savingMedicalHistory}
                    onClick={handleSaveMedicalHistory}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<X className="w-4 h-4" />}
                    onClick={handleCancelMedicalHistory}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patient.medicalHistory ? (
                  <>
                    <InfoItem icon={<Heart />} label="OB History" value={patient.medicalHistory.obHistory || "—"} />
                    <InfoItem icon={<Heart />} label="Surgical History" value={patient.medicalHistory.surgicalHistory || "—"} />
                    <InfoItem icon={<Heart />} label="Gynecological History" value={patient.medicalHistory.gynecologicalHistory || "—"} />
                    <InfoItem icon={<Calendar />} label="LMP" value={patient.medicalHistory.lmp ? new Date(patient.medicalHistory.lmp).toLocaleDateString() : "—"} />
                    <InfoItem icon={<Heart />} label="Gravida" value={patient.medicalHistory.gravida?.toString() || "—"} />
                    <InfoItem icon={<Heart />} label="Para" value={patient.medicalHistory.para?.toString() || "—"} />
                    <InfoItem icon={<Heart />} label="Abortion" value={patient.medicalHistory.abortion?.toString() || "—"} />
                    <InfoItem icon={<Heart />} label="Ectopic" value={patient.medicalHistory.ectopic?.toString() || "—"} />
                    <InfoItem icon={<Heart />} label="Living Children" value={patient.medicalHistory.livingChildren?.toString() || "—"} />
                  </>
                ) : (
                  <p className="text-gray-500 col-span-full text-center py-8">No medical history recorded</p>
                )}
              </div>
            )}
          </Card>
        )}

        {activeTab === "diagnoses" && (
          <Card><CardHeader title="Diagnoses" subtitle="Current and past diagnoses" />
            {patient.diagnoses && patient.diagnoses.length > 0 ? (
              <div className="space-y-2">
                {patient.diagnoses.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div><p className="text-sm font-medium text-gray-900">{d.diagnosis?.replace(/_/g, " ")}</p>
                      {d.notes && <p className="text-xs text-gray-500 mt-0.5">{d.notes}</p>}</div>
                    <span className="text-xs text-gray-400">{d.diagnosedAt ? new Date(d.diagnosedAt).toLocaleDateString() : ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No diagnoses recorded</p>
            )}
          </Card>
        )}

        {activeTab === "couple" && (
          <Card><CardHeader title="Couple Information" subtitle="Partner linking" />
            {patient.wifeInCouple || patient.husbandInCouple ? (
              <div className="space-y-4">
                {patient.wifeInCouple && (
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="text-sm font-medium text-rose-900">Linked as Wife</p>
                    <p className="text-xs text-rose-700 mt-1">
                      Husband: {patient.wifeInCouple.husbandPatient?.firstName} {patient.wifeInCouple.husbandPatient?.lastName}
                      <span className="text-rose-400"> ({patient.wifeInCouple.husbandPatient?.mrn})</span>
                    </p>
                    {patient.wifeInCouple.infertilityType && (
                      <p className="text-xs text-rose-700 mt-1">Infertility Type: {patient.wifeInCouple.infertilityType}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Couple ID: {patient.wifeInCouple.id}</p>
                  </div>
                )}
                {patient.husbandInCouple && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Linked as Husband</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Wife: {patient.husbandInCouple.wifePatient?.firstName} {patient.husbandInCouple.wifePatient?.lastName}
                      <span className="text-blue-400"> ({patient.husbandInCouple.wifePatient?.mrn})</span>
                    </p>
                    {patient.husbandInCouple.infertilityType && (
                      <p className="text-xs text-blue-700 mt-1">Infertility Type: {patient.husbandInCouple.infertilityType}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Couple ID: {patient.husbandInCouple.id}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Not linked to a partner yet</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === "cycles" && (
          <Card><CardHeader title="Treatment Cycles" subtitle="ART cycle history" />
            {timeline?.cycles && timeline.cycles.length > 0 ? (
              <div className="space-y-3">
                {timeline.cycles.map((cycle: any) => (
                  <Link key={cycle.id} to={`/cycles/${cycle.id}`} className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Cycle #{cycle.cycleNumber}</h4>
                      <StatusBadge status={cycle.status} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500">ART Type:</span> <span className="font-medium">{cycle.artType}</span></div>
                      <div><span className="text-gray-500">Oocytes:</span> <span className="font-medium">{cycle.opuRecord?.oocyteCount || 0}</span></div>
                      <div><span className="text-gray-500">MII:</span> <span className="font-medium">{cycle.opuRecord?.miiOocyteCount || 0}</span></div>
                      <div><span className="text-gray-500">Outcome:</span> <span className="font-medium">{cycle.pregnancyOutcome?.outcome || cycle.pregnancyTest?.bhcgLevel ? "Tested" : "Pending"}</span></div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No treatment cycles recorded</p>
            )}
          </Card>
        )}

        {activeTab === "embryology" && (
          <div className="space-y-4">
            {/* Summary stats */}
            {timeline?.cycles && timeline.cycles.filter((c: any) => c.embryologyRecords?.length > 0).length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card padding="sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {timeline.cycles.filter((c: any) => c.embryologyRecords?.length > 0).length}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Cycles with Lab</p>
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {timeline.cycles.reduce((sum: number, c: any) => sum + (c.embryologyRecords?.length || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Total Records</p>
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {timeline.cycles.reduce((sum: number, c: any) => {
                          const d7 = c.embryologyRecords?.find((r: any) => r.dayNumber === "D7");
                          const d6 = d7 ? null : c.embryologyRecords?.find((r: any) => r.dayNumber === "D6");
                          const d5 = d6 || d7 ? null : c.embryologyRecords?.find((r: any) => r.dayNumber === "D5");
                          return sum + (d7?.embryoCount || d6?.embryoCount || d5?.embryoCount || 0);
                        }, 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Final Embryos</p>
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-violet-600">
                        {(() => {
                          const withBlast = timeline.cycles.filter((c: any) =>
                            c.embryologyRecords?.some((r: any) =>
                              ["D5", "D6", "D7"].includes(r.dayNumber)
                            )
                          );
                          return withBlast.length;
                        })()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Blastocyst Cycles</p>
                    </div>
                  </Card>
                </div>

                {/* Cycle-by-cycle embryology */}
                {timeline.cycles.filter((c: any) => c.embryologyRecords?.length > 0).map((cycle: any) => {
                  const records = cycle.embryologyRecords || [];
                  return (
                    <Card key={cycle.id}>
                      <Link
                        to={`/cycles/${cycle.id}`}
                        className="block hover:bg-gray-50 transition-colors -mx-4 -mt-4 px-4 pt-4 pb-2 rounded-t-lg"
                      >
                        <CardHeader
                          title={
                            <span className="flex items-center gap-2">
                              <FlaskConical className="w-4 h-4 text-primary-600" />
                              <span>Cycle #{cycle.cycleNumber} — {cycle.artType}</span>
                            </span>
                          }
                          subtitle={`${records.length} day(s) recorded`}
                        />
                      </Link>
                      <div className="space-y-2 mt-2">
                        {records.map((record: any) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                record.dayNumber === "D0" ? "bg-rose-500" :
                                record.dayNumber === "D1" ? "bg-orange-500" :
                                record.dayNumber === "D2" ? "bg-amber-500" :
                                record.dayNumber === "D3" ? "bg-yellow-600" :
                                record.dayNumber === "D4" ? "bg-lime-600" :
                                record.dayNumber === "D5" ? "bg-emerald-600" :
                                record.dayNumber === "D6" ? "bg-teal-600" :
                                "bg-cyan-600"
                              }`}>
                                {record.dayNumber?.replace("D", "")}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Day {record.dayNumber?.replace("D", "")}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {record.embryoCount} embryo{record.embryoCount !== 1 ? "s" : ""}
                                  {record.icsiMethod && ` — ${record.icsiMethod}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {record.details && record.details.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  {record.details.length} embryo{record.details.length !== 1 ? "s" : ""} graded
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(record.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No embryology data recorded</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lab data will appear here once embryology records are created during a treatment cycle
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "investigations" && (
          <Card><CardHeader title="Investigations" subtitle="Lab results and diagnostic tests" />
            {timeline?.investigations && timeline.investigations.length > 0 ? (
              <div className="space-y-2">
                {timeline.investigations.map((inv: any) => (
                  <Link key={inv.id} to={`/investigations/${inv.id}`} className="block">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()} | Ordered by {inv.orderedBy?.firstName} {inv.orderedBy?.lastName}</p>
                        {inv.notes && <p className="text-xs text-gray-400 mt-0.5">{inv.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {inv.isAbnormal !== null && (
                          <Badge variant={inv.isAbnormal ? "danger" : "success"} size="sm">
                            {inv.isAbnormal ? "Abnormal" : "Normal"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Microscope className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No investigations recorded</p>
                <p className="text-xs text-gray-400 mt-1">Lab results will appear here once ordered by a physician</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === "prescriptions" && (
          <Card><CardHeader title="Prescriptions" subtitle="Medication history" />
            {timeline?.prescriptions && timeline.prescriptions.length > 0 ? (
              <div className="space-y-2">
                {timeline.prescriptions.map((rx: any) => (
                  <div key={rx.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardPlus className="w-4 h-4 text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rx.medicationName} — {rx.dosage}</p>
                          <p className="text-xs text-gray-500">
                            {rx.frequency.replace(/_/g, " ").toLowerCase()} | {rx.medicationRoute.toLowerCase()} | Started {new Date(rx.startDate).toLocaleDateString()}
                            {rx.duration && ` for ${rx.duration}`}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={rx.status} />
                    </div>
                    {rx.instructions && (
                      <p className="text-xs text-gray-500 mt-1 ml-6"><span className="font-medium">Instructions:</span> {rx.instructions}</p>
                    )}
                    {rx.diagnosis && (
                      <p className="text-xs text-gray-400 mt-0.5 ml-6">For: {rx.diagnosis}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">Prescribed by {rx.prescribedBy?.firstName} {rx.prescribedBy?.lastName} ({rx.prescribedBy?.role?.label || ""})</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardPlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No prescriptions recorded</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === "appointments" && (
          <Card><CardHeader title="Appointments" subtitle="Visit history and upcoming" />
            {timeline?.appointments && timeline.appointments.length > 0 ? (
              <div className="space-y-2">
                {timeline.appointments.map((appt: any) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appt.service}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(appt.startTime).toLocaleDateString()} at {new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {appt.physician && ` — Dr. ${appt.physician.firstName} ${appt.physician.lastName}`}
                      </p>
                      {appt.notes && <p className="text-xs text-gray-400 mt-0.5">{appt.notes}</p>}
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No appointments recorded</p>
            )}
          </Card>
        )}

        {activeTab === "billing" && (
          <div className="space-y-4">
            {/* Summary */}
            {invoices.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card padding="sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Invoices</p>
                  </div>
                </Card>
                <Card padding="sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {invoices.filter((inv: any) => inv.status === "PAID").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Paid</p>
                  </div>
                </Card>
                <Card padding="sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {invoices.filter((inv: any) => inv.status !== "PAID" && inv.status !== "CANCELLED").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
                  </div>
                </Card>
                <Card padding="sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-rose-600">
                      {invoices
                        .filter((inv: any) => inv.status !== "PAID" && inv.status !== "CANCELLED")
                        .reduce((sum: number, inv: any) => sum + inv.balanceAmount, 0)
                        .toLocaleString()}{' '}AED
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Balance Due</p>
                  </div>
                </Card>
              </div>
            )}

            {/* Header + Create Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Invoice History</h3>
              {patient && (
                <Link to={`/billing/new`}>
                  <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
                    Create Invoice
                  </Button>
                </Link>
              )}
            </div>

            {loadingInvoices ? (
              <div className="flex justify-center py-8"><Spinner size={24} /></div>
            ) : invoices.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No invoices found</p>
                  <p className="text-xs text-gray-400 mt-1">No invoices have been created for this patient yet</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv: any) => {
                  const paymentRatio = inv.totalAmount > 0 ? inv.paidAmount / inv.totalAmount : 0;
                  return (
                    <Link key={inv.id} to={`/billing/${inv.id}`} className="block">
                      <Card className="hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            inv.status === "PAID" ? "bg-emerald-50" :
                            inv.status === "OVERDUE" ? "bg-rose-50" :
                            inv.status === "CANCELLED" ? "bg-gray-50" :
                            "bg-blue-50"
                          }`}>
                            <Receipt className={`w-5 h-5 ${
                              inv.status === "PAID" ? "text-emerald-600" :
                              inv.status === "OVERDUE" ? "text-rose-600" :
                              "text-blue-600"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</span>
                              {inv.status && (
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                                  inv.status === "OVERDUE" ? "bg-rose-100 text-rose-700" :
                                  inv.status === "CANCELLED" ? "bg-gray-100 text-gray-500" :
                                  inv.status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {inv.status.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {inv.currency || "AED"} {inv.totalAmount?.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                Paid: {inv.currency || "AED"} {inv.paidAmount?.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            {/* Payment progress */}
                            {inv.totalAmount > 0 && (
                              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    paymentRatio >= 1 ? "bg-emerald-500" :
                                    paymentRatio > 0 ? "bg-amber-500" :
                                    "bg-gray-200"
                                  }`}
                                  style={{ width: `${Math.min(paymentRatio * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Patient</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to deactivate{" "}
                <strong>
                  {patient.firstName} {patient.lastName}
                </strong>
                ?
              </p>
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                This will mark the patient as inactive. Their clinical records
                (investigations, cycles, appointments, invoices) will be preserved
                but the patient will no longer appear in active searches.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                MRN: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{patient.mrn}</code>
              </p>

              {deleteError && (
                <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 text-left">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deletingPatient}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeletePatient}
                isLoading={deletingPatient}
                icon={<Trash2 className="w-4 h-4" />}
              >
                {deletingPatient ? "Deactivating..." : "Delete Patient"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-md bg-gray-100 text-gray-500 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}
