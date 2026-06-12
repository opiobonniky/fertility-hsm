import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Card, CardHeader } from "@/components/ui/Card";
import { RoleBadge, StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  Heart, Syringe, Users, ThermometerSnowflake, CalendarCheck,
  BarChart3, ArrowRight, Loader2,
} from "lucide-react";

interface DashboardData {
  underStimulation?: number;
  opuScheduled?: number;
  opuToday?: number;
  pregnancyTests?: number;
  iui?: number;
  fet?: number;
}

interface RecentPatient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  gender: string;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate?: string;
  patient?: { firstName: string; lastName: string; mrn: string };
}

interface AppointmentItem {
  id: string;
  service: string;
  startTime: string;
  endTime: string;
  status: string;
  patient?: { firstName: string; lastName: string; mrn: string };
  physician?: { firstName: string; lastName: string };
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<DashboardData>({});
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [todayAppts, setTodayAppts] = useState<AppointmentItem[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [
        dashRes,
        patientsRes,
        tasksRes,
        apptsRes,
      ] = await Promise.allSettled([
        api.get<{ success: boolean; data: DashboardData }>("/cycles/dashboard"),
        api.get<{ success: boolean; data: RecentPatient[]; total: number }>("/patients/search?limit=5"),
        api.get<{ success: boolean; data: TaskItem[] }>("/tasks/my"),
        api.get<{ success: boolean; data: AppointmentItem[]; total: number }>(`/appointments?startDate=${todayStart}&endDate=${todayEnd}`),
      ]);

      if (dashRes.status === "fulfilled") setDashData(dashRes.value.data || {});
      if (patientsRes.status === "fulfilled") {
        setRecentPatients(patientsRes.value.data || []);
        setTotalPatients(patientsRes.value.total || 0);
      }
      if (tasksRes.status === "fulfilled") setMyTasks(tasksRes.value.data || []);
      if (apptsRes.status === "fulfilled") setTodayAppts(apptsRes.value.data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!user) return null;

  const activeCycles = (dashData.underStimulation || 0) + (dashData.opuScheduled || 0);
  const tasksPending = myTasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");

  const stats = [
    {
      title: "Active Cycles",
      value: String(activeCycles),
      subtitle: `${dashData.underStimulation || 0} in stimulation, ${dashData.opuScheduled || 0} OPU scheduled`,
      icon: <Syringe className="w-6 h-6" />,
      color: "bg-purple-500",
      link: "/cycles",
    },
    {
      title: "Today's OPUs",
      value: String(dashData.opuToday || 0),
      subtitle: "Scheduled for today",
      icon: <ThermometerSnowflake className="w-6 h-6" />,
      color: "bg-blue-500",
      link: "/cycles",
    },
    {
      title: "Appointments Today",
      value: String(todayAppts.length),
      subtitle: `${todayAppts.filter((a) => a.status === "SCHEDULED").length} remaining`,
      icon: <CalendarCheck className="w-6 h-6" />,
      color: "bg-green-500",
      link: "/appointments",
    },
    {
      title: "Pending Tasks",
      value: String(tasksPending.length),
      subtitle: `${myTasks.length} total assigned`,
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-amber-500",
      link: "/tasks",
    },
    {
      title: "Total Patients",
      value: String(totalPatients),
      subtitle: `${recentPatients.length} registered recently`,
      icon: <Users className="w-6 h-6" />,
      color: "bg-rose-500",
      link: "/patients",
    },
    {
      title: "Pregnancy Tests",
      value: String(dashData.pregnancyTests || 0),
      subtitle: "Awaiting results",
      icon: <Heart className="w-6 h-6" />,
      color: "bg-pink-500",
      link: "/cycles",
    },
  ];

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return "No due date";
    const diff = new Date(dueDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            You are signed in as
            <RoleBadge role={user.role} />
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Refreshing...
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} padding="md">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? (
                    <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    stat.value
                  )}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{stat.subtitle}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-white shrink-0 ml-3`}>
                {stat.icon}
              </div>
            </div>
            {stat.link && (
              <Link
                to={stat.link}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View details <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" subtitle="Common tasks based on your role" />
        <div className="flex flex-wrap gap-3">
          {(user.role === "ADMIN" || user.role === "RECEPTIONIST" || user.role === "CONSULTANT" || user.role === "NURSE") && (
            <Link
              to="/patients/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              Register Patient
            </Link>
          )}
          {(user.role === "ADMIN" || user.role === "CONSULTANT" || user.role === "SPECIALIST") && (
            <Link
              to="/cycles/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              <Syringe className="w-4 h-4" />
              New Cycle
            </Link>
          )}
          <Link
            to="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <CalendarCheck className="w-4 h-4" />
            View Schedule
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Patients */}
        <Card>
          <CardHeader
            title="Recent Patients"
            subtitle="Latest registrations"
            action={
              <Link to="/patients" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all
              </Link>
            }
          />
          {loading ? (
            <div className="flex justify-center py-6"><Spinner size={20} /></div>
          ) : (
            <div className="space-y-2">
              {recentPatients.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recent patients</p>
              ) : (
                recentPatients.map((p) => (
                  <Link
                    key={p.id}
                    to={`/patients/${p.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">
                          {p.firstName[0]}{p.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{p.mrn}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </Card>

        {/* My Tasks */}
        <Card>
          <CardHeader
            title="My Tasks"
            subtitle={`${tasksPending.length} pending of ${myTasks.length} total`}
            action={
              <Link to="/tasks" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View all
              </Link>
            }
          />
          {loading ? (
            <div className="flex justify-center py-6"><Spinner size={20} /></div>
          ) : (
            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No tasks assigned</p>
              ) : (
                myTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <StatusBadge status={task.priority} />
                      </div>
                      {task.patient && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {task.patient.firstName} {task.patient.lastName}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs shrink-0 ml-2 ${
                      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
                        ? "text-rose-500 font-medium"
                        : "text-gray-400"
                    }`}>
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Today's Schedule */}
      {todayAppts.length > 0 && (
        <Card>
          <CardHeader
            title="Today's Schedule"
            subtitle={`${todayAppts.filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED").length} remaining of ${todayAppts.length} total`}
            action={
              <Link to="/appointments" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Full schedule
              </Link>
            }
          />
          <div className="space-y-2">
            {[...todayAppts]
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 8)
              .map((appt) => {
                const ms = new Date(appt.endTime).getTime() - new Date(appt.startTime).getTime();
                const mins = Math.round(ms / 60000);
                let durationLabel = "";
                if (mins > 0) {
                  if (mins >= 60) {
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    durationLabel = m > 0 ? `${h}h ${m}m` : `${h}h`;
                  } else {
                    durationLabel = `${mins}m`;
                  }
                }
                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-right w-16 shrink-0">
                        <p className="text-xs font-mono text-gray-500">
                          {new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {durationLabel && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{durationLabel}</p>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{appt.service}</p>
                        {appt.patient && (
                          <p className="text-xs text-gray-500 truncate">
                            {appt.patient.firstName} {appt.patient.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {appt.physician && (
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          Dr. {appt.physician.firstName} {appt.physician.lastName}
                        </span>
                      )}
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Cycle Summary */}
      {(dashData.iui || dashData.fet) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dashData.iui && dashData.iui > 0 && (
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Syringe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">IUI Cycles</p>
                  <p className="text-xl font-bold text-gray-900">{dashData.iui}</p>
                </div>
              </div>
            </Card>
          )}
          {dashData.fet && dashData.fet > 0 && (
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <ThermometerSnowflake className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">FET Cycles</p>
                  <p className="text-xl font-bold text-gray-900">{dashData.fet}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
