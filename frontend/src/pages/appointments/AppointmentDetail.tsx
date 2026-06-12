import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { usePermission } from "@/components/auth/PermissionGate";
import { api } from "@/api/client";
import {
  ArrowLeft, CalendarDays, Clock, User, Building2, Phone,
  Mail, MapPin, Stethoscope, FileText, Edit3, CheckCircle2,
  XCircle, LogIn, AlertCircle, ClipboardList,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface AppointmentDetail {
  id: string;
  patientId: string;
  physicianId?: string | null;
  service: string;
  clinicId?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  physician?: {
    id: string;
    firstName: string;
    lastName: string;
    staffCode?: string;
  };
  clinic?: {
    id: string;
    name: string;
    branch?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

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

// ── Main Component ─────────────────────────────────────────────

export function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const canEdit = usePermission("appointment:edit");

  const loadAppointment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: AppointmentDetail }>(`/appointments/${id}`);
      setAppt(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load appointment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAppointment(); }, [loadAppointment]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setAppt((prev) => prev ? { ...prev, status } : null);
      setShowCancelDialog(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // ── Duration formatting ─────────────────────────────────────
  const formatDuration = (start: string, end: string) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    if (mins <= 0) return null;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  // ── Render ──────────────────────────────────────────────────
  if (loading) return <PageLoader />;

  if (error && !appt) return (
    <div className="text-center py-16">
      <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{error}</p>
      <Link to="/appointments" className="text-primary-600 text-sm mt-2 inline-block">Back to appointments</Link>
    </div>
  );

  if (!appt) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Appointment not found</p>
      <Link to="/appointments" className="text-primary-600 text-sm mt-2 inline-block">Back to appointments</Link>
    </div>
  );

  const duration = formatDuration(appt.startTime, appt.endTime);
  const isScheduled = appt.status === "SCHEDULED";
  const isInProgress = appt.status === "IN_PROGRESS";
  const isCompleted = appt.status === "COMPLETED";
  const isCancelled = appt.status === "CANCELLED";
  const isActionable = isScheduled || isInProgress;
  const canCancel = isScheduled;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link
          to="/appointments"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{appt.service}</h1>
            <StatusBadge status={appt.status} />
            {duration && (
              <Badge variant="neutral" size="sm">{duration}</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {appt.patient
              ? `${appt.patient.firstName} ${appt.patient.lastName}`
              : "Unknown patient"}
            {appt.patient?.mrn && (
              <> · <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{appt.patient.mrn}</code></>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Action Buttons ──────────────────────────────────── */}
      {canEdit && isActionable && (
        <div className="flex flex-wrap gap-3">
          {isScheduled && (
            <Button
              onClick={() => updateStatus("IN_PROGRESS")}
              isLoading={updating}
              icon={<LogIn className="w-4 h-4" />}
            >
              Check In Patient
            </Button>
          )}
          {isInProgress && (
            <Button
              onClick={() => updateStatus("COMPLETED")}
              isLoading={updating}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Complete Appointment
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              disabled={updating}
              icon={<XCircle className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/appointments/new`)}
            icon={<Edit3 className="w-4 h-4" />}
          >
            Book Similar
          </Button>
        </div>
      )}

      {/* ── Cancel Dialog ───────────────────────────────────── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to cancel this <strong>{appt.service}</strong> appointment?
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={updating}>
                Keep Appointment
              </Button>
              <Button variant="danger" onClick={() => updateStatus("CANCELLED")} isLoading={updating}>
                Cancel Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time & Status */}
        <SectionCard title="Appointment Details">
          <InfoRow
            icon={<CalendarDays className="w-4 h-4" />}
            label="Date"
            value={new Date(appt.startTime).toLocaleDateString(undefined, {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Time"
            value={`${new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${new Date(appt.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          />
          {duration && (
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Duration" value={duration} />
          )}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-1.5 rounded-md bg-white text-gray-500 shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <StatusBadge status={appt.status} />
            </div>
          </div>
        </SectionCard>

        {/* Patient Info */}
        <SectionCard title="Patient Information">
          {appt.patient ? (
            <>
              <InfoRow
                icon={<User className="w-4 h-4" />}
                label="Name"
                value={`${appt.patient.firstName} ${appt.patient.lastName}`}
              />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="MRN" value={appt.patient.mrn} />
              {appt.patient.dateOfBirth && (
                <InfoRow
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="Date of Birth"
                  value={new Date(appt.patient.dateOfBirth).toLocaleDateString()}
                />
              )}
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={appt.patient.phone} />
              {appt.patient.email && (
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={appt.patient.email} />
              )}
              <Link
                to={`/patients/${appt.patient.id}`}
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-1"
              >
                <User className="w-3.5 h-3.5" /> View Full Profile
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">Patient information not available</p>
          )}
        </SectionCard>

        {/* Provider & Location */}
        <SectionCard title="Provider & Location">
          {appt.physician ? (
            <InfoRow
              icon={<Stethoscope className="w-4 h-4" />}
              label="Physician"
              value={`Dr. ${appt.physician.firstName} ${appt.physician.lastName}`}
            />
          ) : (
            <InfoRow icon={<Stethoscope className="w-4 h-4" />} label="Physician" value="Not assigned" />
          )}
          {appt.clinic ? (
            <>
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Clinic" value={appt.clinic.name} />
              {appt.clinic.branch && (
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Branch" value={appt.clinic.branch} />
              )}
            </>
          ) : (
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Clinic" value="Not specified" />
          )}
          {appt.createdBy && (
            <InfoRow
              icon={<User className="w-4 h-4" />}
              label="Booked By"
              value={`${appt.createdBy.firstName} ${appt.createdBy.lastName}`}
            />
          )}
        </SectionCard>

        {/* Notes */}
        <div>
          <SectionCard title="Service Details">
            <InfoRow
              icon={<ClipboardList className="w-4 h-4" />}
              label="Service Type"
              value={appt.service}
            />
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Status History</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-gray-400">Created:</span>
                {new Date(appt.createdAt).toLocaleDateString()}
                {appt.updatedAt !== appt.createdAt && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400">Updated:</span>
                    {new Date(appt.updatedAt).toLocaleDateString()}
                  </>
                )}
              </div>
            </div>
          </SectionCard>

          {appt.notes && (
            <div className="mt-6">
              <Card>
                <CardHeader title="Notes" />
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.notes}</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
