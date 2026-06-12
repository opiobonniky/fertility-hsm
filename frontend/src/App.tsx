import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { PatientList } from "@/pages/patients/PatientList";
import { PatientCreate } from "@/pages/patients/PatientCreate";
import { PatientDetail } from "@/pages/patients/PatientDetail";
import { PatientEdit } from "@/pages/patients/PatientEdit";
import { CycleList } from "@/pages/cycles/CycleList";
import { CycleCreate } from "@/pages/cycles/CycleCreate";
import { CycleDetail } from "@/pages/cycles/CycleDetail";
import { FollicleTracking } from "@/pages/cycles/FollicleTracking";
import { OPUForm } from "@/pages/cycles/OPUForm";
import { EmbryologyLab } from "@/pages/cycles/EmbryologyLab";
import { SemenAnalysis } from "@/pages/cycles/SemenAnalysis";
import { AppointmentList } from "@/pages/appointments/AppointmentList";
import { AppointmentDetail } from "@/pages/appointments/AppointmentDetail";
import { AppointmentCreate } from "@/pages/appointments/AppointmentCreate";
import { InvestigationList } from "@/pages/investigations/InvestigationList";
import { InvestigationDetail } from "@/pages/investigations/InvestigationDetail";
import { CryoDashboard } from "@/pages/cryo/CryoDashboard";
import { InvoiceList } from "@/pages/billing/InvoiceList";
import { InvoiceCreate } from "@/pages/billing/InvoiceCreate";
import { InvoiceEdit } from "@/pages/billing/InvoiceEdit";
import { InvoiceDetail } from "@/pages/billing/InvoiceDetail";
import { ReportsDashboard } from "@/pages/reports/ReportsDashboard";
import { TaskList } from "@/pages/tasks/TaskList";
import { TaskCreate } from "@/pages/tasks/TaskCreate";
import { TaskEdit } from "@/pages/tasks/TaskEdit";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { RoleManagement } from "@/pages/admin/RoleManagement";
import { PermissionManagement } from "@/pages/admin/PermissionManagement";
import { StaffManagement } from "@/pages/admin/StaffManagement";
import { OptionsManagement } from "@/pages/admin/OptionsManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Home — role-based: admin sees admin dashboard, others see clinical dashboard */}
            <Route path="/" element={<HomePage />} />

            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/new" element={<PatientCreate />} />
            <Route path="/patients/:id/edit" element={<PatientEdit />} />
            <Route path="/patients/:id" element={<PatientDetail />} />

            <Route path="/cycles" element={<CycleList />} />
            <Route path="/cycles/new" element={<CycleCreate />} />
            <Route path="/cycles/:id" element={<CycleDetail />} />
            <Route path="/cycles/:cycleId/follicles" element={<FollicleTracking />} />
            <Route path="/cycles/:cycleId/opu" element={<OPUForm />} />
            <Route path="/cycles/:cycleId/embryology" element={<EmbryologyLab />} />
            <Route path="/cycles/:cycleId/semen" element={<SemenAnalysis />} />

            <Route path="/appointments" element={<AppointmentList />} />
            <Route path="/appointments/new" element={<AppointmentCreate />} />
            <Route path="/appointments/:id" element={<AppointmentDetail />} />
            <Route path="/investigations" element={<InvestigationList />} />
            <Route path="/investigations/:id" element={<InvestigationDetail />} />
            <Route path="/cryo-inventory" element={<CryoDashboard />} />
            <Route path="/billing" element={<InvoiceList />} />
            <Route path="/billing/new" element={<InvoiceCreate />} />
            <Route path="/billing/:id/edit" element={<InvoiceEdit />} />
            <Route path="/billing/:id" element={<InvoiceDetail />} />
            <Route path="/reports" element={<ReportsDashboard />} />
            <Route path="/tasks/new" element={<TaskCreate />} />
            <Route path="/tasks/:id/edit" element={<TaskEdit />} />
            <Route path="/tasks" element={<TaskList />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="/admin/permissions" element={<PermissionManagement />} />
            <Route path="/admin/staff" element={<StaffManagement />} />
            <Route path="/admin/options" element={<OptionsManagement />} />

            {/* Legacy redirects */}
            <Route path="/admin/users" element={<Navigate to="/admin/staff" replace />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
