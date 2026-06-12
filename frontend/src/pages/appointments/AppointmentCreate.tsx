import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, CalendarCheck, Search, User, Building2, Clock,
  Stethoscope, FileText, X, CheckCircle,
} from "lucide-react";

const SERVICE_OPTIONS = [
  "General Consultation",
  "Follow-up Visit",
  "Ultrasound Scan",
  "Follicle Tracking",
  "Semen Analysis",
  "Blood Test / Hormonal",
  "OPU (Oocyte Retrieval)",
  "Embryo Transfer",
  "Pregnancy Test",
  "Counselling Session",
  "HSG",
  "Infection Screening",
  "Genetic Counselling",
  "Cryo Consultation",
  "Nursing / Injection",
  "Other",
];

interface PatientResult {
  id: string;
  firstName: string;
  lastName: string;
  mrn: string;
  phone: string;
  gender: string;
}

interface PhysicianResult {
  id: string;
  firstName: string;
  lastName: string;
  staffCode: string;
  role?: { name: string; label: string };
}

interface ClinicResult {
  id: string;
  name: string;
  branch?: string;
}

export function AppointmentCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step tracking
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  // Step 2: Appointment details
  const [service, setService] = useState("");
  const [customService, setCustomService] = useState("");
  const [physicians, setPhysicians] = useState<PhysicianResult[]>([]);
  const [physicianId, setPhysicianId] = useState("");
  const [clinics, setClinics] = useState<ClinicResult[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [notes, setNotes] = useState("");

  // Load physicians
  useEffect(() => {
    const load = async () => {
      try {
        const [physRes, clinicRes] = await Promise.allSettled([
          api.get<{ success: boolean; data: PhysicianResult[] }>("/users/physicians"),
          api.get<{ success: boolean; data: ClinicResult[] }>("/clinics"),
        ]);
        if (physRes.status === "fulfilled") setPhysicians(physRes.value.data || []);
        if (clinicRes.status === "fulfilled") setClinics(clinicRes.value.data || []);
      } catch {
        // Optional data
      }
    };
    load();
  }, []);

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }
    setSearchingPatients(true);
    try {
      const res = await api.get<{ success: boolean; data: PatientResult[] }>(
        `/patients/search?query=${encodeURIComponent(query)}&limit=10`,
      );
      setPatients(res.data || []);
    } catch {
      setPatients([]);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 400);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }
    if (!service && !customService) {
      setError("Please select or enter a service");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      setError("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        patientId: selectedPatient.id,
        service: service === "Other" ? customService : service,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };
      if (physicianId) payload.physicianId = physicianId;
      if (clinicId) payload.clinicId = clinicId;
      if (notes.trim()) payload.notes = notes.trim();

      const res = await api.post<{ success: boolean; data: { id: string } }>("/appointments", payload);
      navigate(`/appointments`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to book appointment");
    } finally {
      setSaving(false);
    }
  };

  // Generate time slots (every 15 mins, 8am-6pm)
  const timeSlots: string[] = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  // Add 6pm as last slot
  timeSlots.push("18:00");

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/appointments" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? "Step 1: Select the patient" : "Step 2: Set appointment details"}
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
          Select Patient
        </div>
        <div className="w-8 h-px bg-gray-300" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          step === 2 ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
        }`}>
          <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-xs font-bold">2</span>
          Appointment Details
        </div>
      </div>

      {/* Step 1: Patient Search */}
      {step === 1 && (
        <Card>
          <div className="space-y-4">
            <CardHeader title="Search Patient" subtitle="Find the patient by name, MRN, or phone" />

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, MRN, or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>

            {searchingPatients && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size={16} /> Searching...
              </div>
            )}

            {patients.length > 0 && !selectedPatient && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Found {patients.length} patient(s):</p>
                {patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors border border-transparent hover:border-primary-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">{p.firstName[0]}{p.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-500">{p.mrn} | {p.phone} | {p.gender === "FEMALE" ? "Female" : "Male"}</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Select</Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedPatient && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p className="text-xs text-gray-500">{selectedPatient.mrn} | {selectedPatient.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!searchingPatients && patientSearch.length >= 2 && patients.length === 0 && !selectedPatient && (
              <div className="text-center py-6 text-gray-400 text-sm">
                No patients found matching "{patientSearch}"
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button onClick={() => setStep(2)} disabled={!selectedPatient} icon={<CalendarCheck className="w-4 h-4" />}>
                Continue to Details
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Appointment Details */}
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Selected Patient Summary */}
            {selectedPatient && (
              <Card>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-sm">
                    <span className="font-medium">Patient: </span>
                    {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.mrn})
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary-600 hover:text-primary-700 ml-auto cursor-pointer">
                    Change Patient
                  </button>
                </div>
              </Card>
            )}

            {/* Service */}
            <Card>
              <CardHeader title="Service" subtitle="Type of appointment" />
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setService(s); setCustomService(""); }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                        service === s
                          ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {service === "Other" && (
                  <Input
                    label="Specify Service"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Enter the service name"
                    icon={<Stethoscope className="w-4 h-4 text-gray-400" />}
                    required
                  />
                )}
              </div>
            </Card>

            {/* Physician */}
            <Card>
              <CardHeader title="Physician (Optional)" subtitle="Assign a doctor to this appointment" />
              <select
                value={physicianId}
                onChange={(e) => setPhysicianId(e.target.value)}
                className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No physician assigned...</option>
                {physicians.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.firstName} {doc.lastName} ({doc.staffCode})
                  </option>
                ))}
              </select>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader title="Date & Time" subtitle="Schedule the appointment slot" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      // Auto-set end time to 30 min later
                      const [h, m] = e.target.value.split(":").map(Number);
                      const end = new Date(2024, 0, 1, h, m + 30);
                      setEndTime(
                        `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
                      );
                    }}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {timeSlots.slice(0, -1).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t} disabled={t <= startTime}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Appointment duration: {(() => {
                    const [sh, sm] = startTime.split(":").map(Number);
                    const [eh, em] = endTime.split(":").map(Number);
                    const mins = (eh * 60 + em) - (sh * 60 + sm);
                    if (mins >= 60) {
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return m > 0 ? `${h}h ${m}m` : `${h}h`;
                    }
                    return `${mins}m`;
                  })()}
                </p>
              </div>
            </Card>

            {/* Clinic */}
            {clinics.length > 0 && (
              <Card>
                <CardHeader title="Clinic / Room (Optional)" subtitle="Select the location" />
                <select
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No clinic assigned...</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.branch ? ` — ${c.branch}` : ""}
                    </option>
                  ))}
                </select>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader title="Notes (Optional)" subtitle="Additional information" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes for this appointment..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back to Patient Selection
              </Button>
              <div className="flex gap-3">
                <Link to="/appointments">
                  <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                <Button type="submit" isLoading={saving} icon={<CalendarCheck className="w-4 h-4" />}>
                  {saving ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
