import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { usePermission } from "@/components/auth/PermissionGate";
import { api } from "@/api/client";
import {
  CalendarCheck, ChevronLeft, ChevronRight, Plus, Search,
  CalendarDays, Clock, User, Building2,
  LogIn, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Appointment, AppointmentStatus } from "@/types";

interface AppointmentWithDetails extends Appointment {
  patient?: { id: string; firstName: string; lastName: string; mrn: string; phone: string };
  physician?: { id: string; firstName: string; lastName: string };
  clinic?: { id: string; name: string };
}

// ── Confirm Cancel Dialog ────────────────────────────────────
function CancelDialog({
  appt,
  onClose,
  onConfirm,
  loading,
}: {
  appt: AppointmentWithDetails;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to cancel the{" "}
            <strong>{appt.service}</strong> appointment for{" "}
            <strong>{appt.patient?.firstName} {appt.patient?.lastName}</strong>?
          </p>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Appointment
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={loading}>
            Cancel Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      start: today.toISOString().split("T")[0],
      end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<AppointmentWithDetails | null>(null);

  const { user } = useAuthStore();
  const canEdit = usePermission("appointment:edit");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (dateRange.start) params.startDate = new Date(dateRange.start).toISOString();
      if (dateRange.end) params.endDate = new Date(dateRange.end + "T23:59:59").toISOString();

      const res = await api.get<{ success: boolean; data: AppointmentWithDetails[]; total: number; totalPages: number }>("/appointments", params);
      setAppointments(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateRange]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppts = searchQuery
    ? appointments.filter((a) => {
        const q = searchQuery.toLowerCase();
        return (
          `${a.patient?.firstName} ${a.patient?.lastName}`.toLowerCase().includes(q) ||
          a.patient?.mrn?.toLowerCase().includes(q) ||
          a.service?.toLowerCase().includes(q) ||
          `${a.physician?.firstName} ${a.physician?.lastName}`.toLowerCase().includes(q)
        );
      })
    : appointments;

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      // Update locally immediately for responsive UI
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    await updateStatus(cancelTarget.id, "CANCELLED");
    setCancelTarget(null);
    loadAppointments();
  };

  const statusCounts = appointments.reduce((acc: Record<string, number>, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and manage patient appointments {total > 0 && `(${total} total)`}</p>
        </div>
        <Link to="/appointments/new">
          <Button icon={<Plus className="w-4 h-4" />}>Book Appointment</Button>
        </Link>
      </div>

      {/* Status Summary */}
      {appointments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                statusFilter === status
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {status.replace(/_/g, " ")} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => { setDateRange((p) => ({ ...p, start: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => { setDateRange((p) => ({ ...p, end: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => {
              const today = new Date();
              setDateRange({
                start: today.toISOString().split("T")[0],
                end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              });
              setPage(1);
            }}
            className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            This Week
          </button>
        </div>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : filteredAppts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No appointments found</p>
            <p className="text-sm text-gray-400 mt-1">Adjust your filters or book a new appointment</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAppts.map((appt) => (
            <Card key={appt.id} className="hover:shadow-md hover:border-primary-200 transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    appt.status === "COMPLETED" ? "bg-green-50" :
                    appt.status === "CANCELLED" ? "bg-rose-50" :
                    appt.status === "IN_PROGRESS" ? "bg-amber-50" :
                    "bg-blue-50"
                  }`}>
                    <CalendarDays className={`w-5 h-5 ${
                      appt.status === "COMPLETED" ? "text-green-600" :
                      appt.status === "CANCELLED" ? "text-rose-600" :
                      appt.status === "IN_PROGRESS" ? "text-amber-600" :
                      "text-blue-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/appointments/${appt.id}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors">{appt.service}</Link>
                      <StatusBadge status={appt.status} />
                    </div>
                    {appt.patient && (
                      <Link to={`/patients/${appt.patient.id}`} className="text-sm text-gray-600 hover:text-primary-600 mt-0.5 block">
                        {appt.patient.firstName} {appt.patient.lastName} <span className="text-xs text-gray-400">({appt.patient.mrn})</span>
                      </Link>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(appt.startTime).toLocaleDateString()} {new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {(() => {
                        const ms = new Date(appt.endTime).getTime() - new Date(appt.startTime).getTime();
                        const mins = Math.round(ms / 60000);
                        if (mins <= 0) return null;
                        if (mins >= 60) {
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3 h-3" /> {m > 0 ? `${h}h ${m}m` : `${h}h`}</span>;
                        }
                        return <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3 h-3" /> {mins}m</span>;
                      })()}
                      {appt.physician && <span className="flex items-center gap-1"><User className="w-3 h-3" /> Dr. {appt.physician.firstName} {appt.physician.lastName}</span>}
                      {appt.clinic && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {appt.clinic.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {updatingIds.has(appt.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : canEdit && appt.status === "SCHEDULED" ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(appt.id, "IN_PROGRESS")}
                        icon={<LogIn className="w-3.5 h-3.5" />}
                      >
                        Check In
                      </Button>
                      <button
                        onClick={() => setCancelTarget(appt)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Cancel appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : canEdit && appt.status === "IN_PROGRESS" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateStatus(appt.id, "COMPLETED")}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Complete
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {cancelTarget && (
        <CancelDialog
          appt={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancel}
          loading={updatingIds.has(cancelTarget.id)}
        />
      )}
    </div>
  );
}
