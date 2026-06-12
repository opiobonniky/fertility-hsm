import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  Plus, Search, Flag, User, CalendarDays, CheckCircle2,
  Clock, ArrowUpDown,
} from "lucide-react";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  assignee: { id: string; firstName: string; lastName: string };
  assignedBy: { id: string; firstName: string; lastName: string };
  patient?: { id: string; firstName: string; lastName: string; mrn: string };
  cycle?: { id: string; cycleNumber: number; artType: string };
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const PRIORITY_STYLES: Record<TaskPriority, { badge: string; icon: string; dot: string }> = {
  URGENT: { badge: "bg-rose-100 text-rose-700", icon: "text-rose-500", dot: "bg-rose-500" },
  HIGH: { badge: "bg-amber-100 text-amber-700", icon: "text-amber-500", dot: "bg-amber-500" },
  MEDIUM: { badge: "bg-blue-100 text-blue-700", icon: "text-blue-500", dot: "bg-blue-500" },
  LOW: { badge: "bg-gray-100 text-gray-600", icon: "text-gray-400", dot: "bg-gray-400" },
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  FOLLOW_UP_CALL: "Follow-up Call",
  EMBRYO_DISPOSAL: "Embryo Disposal",
  GAMETE_REMINDER: "Gamete Reminder",
  EXPIRY_NOTIFICATION: "Expiry Notification",
};

export function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "newest">("priority");

  // Complete action
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = showMyTasks ? "/tasks/my" : "/tasks?limit=100";
      const res = await api.get<{ success: boolean; data: Task[] }>(url);
      setTasks(res.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [showMyTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = async () => {
    if (!showCompleteDialog) return;
    setCompletingId(showCompleteDialog);
    try {
      const payload: Record<string, string> = {};
      if (completeNotes.trim()) payload.notes = completeNotes.trim();
      await api.patch(`/tasks/${showCompleteDialog}/complete`, payload);
      setShowCompleteDialog(null);
      setCompleteNotes("");
      await loadTasks();
    } catch {
      // Error handled silently
    } finally {
      setCompletingId(null);
    }
  };

  // Filter + sort
  const filtered = tasks
    .filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.assignee?.firstName?.toLowerCase().includes(q) ||
          t.assignee?.lastName?.toLowerCase().includes(q) ||
          t.patient?.firstName?.toLowerCase().includes(q) ||
          t.patient?.lastName?.toLowerCase().includes(q) ||
          t.patient?.mrn?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const isOverdue = (task: Task) => {
    if (task.status === "COMPLETED" || task.status === "CANCELLED" || !task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  };

  // Stats
  const pendingCount = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Follow-up calls, reminders, and action items
          </p>
        </div>
        <Link to="/tasks/new">
          <Button icon={<Plus className="w-4 h-4" />}>Create Task</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-600">
            {showMyTasks ? "My Pending" : "Pending"}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            {overdueCount > 0 && (
              <span className="text-xs font-medium text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-600">Completed</p>
          <p className="text-xl font-bold text-emerald-700">{completedCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900">{tasks.length}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-3">
          {/* Search + view toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, assignee, or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowMyTasks(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  !showMyTasks ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setShowMyTasks(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  showMyTasks ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Tasks
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-1">Status:</span>
              {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    statusFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            <span className="text-gray-300">|</span>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ALL">All Types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1 ml-auto">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="priority">Sort: Priority</option>
                <option value="dueDate">Sort: Due Date</option>
                <option value="newest">Sort: Newest</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-medium">
              {search || statusFilter !== "ALL" || typeFilter !== "ALL" || priorityFilter !== "ALL"
                ? "No tasks match your filters"
                : showMyTasks
                ? "You have no assigned tasks"
                : "No tasks created yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {showMyTasks ? "Tasks assigned to you will appear here" : "Create a task to get started"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <Card key={task.id} className="hover:shadow-md hover:border-primary-200 transition-all duration-200">
              <div className="flex items-start gap-4">
                {/* Priority indicator */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${PRIORITY_STYLES[task.priority]?.dot || "bg-gray-300"}`} />

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_STYLES[task.priority]?.dot || "bg-gray-300"}`} />
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h3>
                    <Badge
                      variant={
                        task.status === "COMPLETED" ? "success" :
                        task.status === "CANCELLED" ? "neutral" :
                        task.status === "IN_PROGRESS" ? "info" :
                        "warning"
                      }
                      size="sm"
                    >
                      {task.status?.replace(/_/g, " ")}
                    </Badge>
                    {isOverdue(task) && (
                      <span className="text-xs font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className={`inline-flex items-center gap-1 font-medium ${
                      task.priority === "URGENT" ? "text-rose-600" :
                      task.priority === "HIGH" ? "text-amber-600" :
                      task.priority === "MEDIUM" ? "text-blue-600" :
                      "text-gray-500"
                    }`}>
                      <Flag className="w-3 h-3" />
                      {task.priority}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignee?.firstName} {task.assignee?.lastName}
                    </span>

                    {task.patient && (
                      <span className="inline-flex items-center gap-1">
                        {task.patient.firstName} {task.patient.lastName}
                        <span className="text-gray-400">({task.patient.mrn})</span>
                      </span>
                    )}

                    {task.dueDate && (
                      <span className={`inline-flex items-center gap-1 ${
                        isOverdue(task) ? "text-rose-600 font-medium" : ""
                      }`}>
                        <CalendarDays className="w-3 h-3" />
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>

                    <span className="text-gray-400">
                      {TYPE_LABELS[task.type] || task.type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                    <button
                      onClick={() => setShowCompleteDialog(task.id)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                      title="Mark as complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Task</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add completion notes or leave blank to complete without notes.
            </p>
            <textarea
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="Completion notes (optional)..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowCompleteDialog(null); setCompleteNotes(""); }}>
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                isLoading={completingId === showCompleteDialog}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
