import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  ArrowLeft, Flag, Tag, Search, CheckCircle, X, Save,
} from "lucide-react";

const TASK_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "FOLLOW_UP_CALL", label: "Follow-up Call" },
  { value: "EMBRYO_DISPOSAL", label: "Embryo Disposal" },
  { value: "GAMETE_REMINDER", label: "Gamete Reminder" },
  { value: "EXPIRY_NOTIFICATION", label: "Expiry Notification" },
] as const;

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  staffCode: string;
  email: string;
  isActive: boolean;
  role: { id: string; name: string; label: string };
}

interface PatientResult {
  id: string;
  firstName: string;
  lastName: string;
  mrn: string;
  phone: string;
}

export function TaskEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  // Staff list
  const [staff, setStaff] = useState<UserResult[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Load staff on mount
  const [staffError, setStaffError] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ success: boolean; data: UserResult[] }>("/users");
        setStaff((res.data || []).filter((u) => u.isActive));
      } catch {
        setStaffError(true);
      } finally {
        setLoadingStaff(false);
      }
    };
    load();
  }, []);

  // Load task data
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await api.get<{ success: boolean; data: any }>(`/tasks/${id}`);
        const task = res.data;

        // Pre-fill form
        setTitle(task.title || "");
        setDescription(task.description || "");
        setType(task.type || "GENERAL");
        setPriority(task.priority || "MEDIUM");
        setAssigneeId(task.assigneeId || "");

        if (task.dueDate) {
          setDueDate(new Date(task.dueDate).toISOString().split("T")[0]);
        }
        setNotes(task.notes || "");

        if (task.patient) {
          setSelectedPatient(task.patient);
          setPatientSearch(`${task.patient.firstName} ${task.patient.lastName}`);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load task");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
    if (!id) return;
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!assigneeId) {
      setError("Please select an assignee");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        type,
        priority,
        assigneeId,
      };
      if (description.trim()) payload.description = description.trim();
      if (selectedPatient) payload.patientId = selectedPatient.id;
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();
      if (notes.trim()) payload.notes = notes.trim();

      await api.put(`/tasks/${id}`, payload);
      navigate("/tasks");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/tasks" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update task details and assignment
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader title="Task Details" subtitle="Describe the task" />
            <div className="space-y-4">
              <Input
                label="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Call patient for follow-up"
                icon={<Tag className="w-4 h-4 text-gray-400" />}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the task..."
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Type" subtitle="Category of task" />
              <div className="flex flex-wrap gap-2">
                {TASK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                      type === t.value
                        ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Priority" subtitle="Level of urgency" />
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                      priority === p.value
                        ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 inline mr-1 ${
                      p.value === "URGENT" ? "text-rose-500" :
                      p.value === "HIGH" ? "text-amber-500" :
                      p.value === "MEDIUM" ? "text-blue-500" :
                      "text-gray-400"
                    }`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Assignee */}
          <Card>
            <CardHeader title="Assignee *" subtitle="Who should complete this task" />
            {loadingStaff ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Spinner size={16} /> Loading staff...
              </div>
            ) : staffError ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                Unable to load staff list. You may need admin permissions to view staff. Please contact an admin.
              </div>
            ) : (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select assignee...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.staffCode}) — {s.role?.label || s.role?.name}
                  </option>
                ))}
              </select>
            )}
          </Card>

          {/* Patient */}
          <Card>
            <CardHeader title="Linked Patient (Optional)" subtitle="Associate this task with a patient" />
            <div className="space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patient by name, MRN, or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {searchingPatients && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner size={16} /> Searching...
                </div>
              )}

              {patients.length > 0 && !selectedPatient && (
                <div className="space-y-2">
                  {patients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors border border-transparent hover:border-primary-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-700">{p.firstName[0]}{p.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-500">{p.mrn} | {p.phone}</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">Select</Badge>
                    </div>
                  ))}
                </div>
              )}

              {selectedPatient && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-900 font-medium">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </span>
                      <span className="text-xs text-gray-500">({selectedPatient.mrn})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Due Date & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Due Date (Optional)" subtitle="Set a deadline" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </Card>

            <Card>
              <CardHeader title="Notes (Optional)" subtitle="Additional information" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Link to="/tasks">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={saving} icon={<Save className="w-4 h-4" />}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
