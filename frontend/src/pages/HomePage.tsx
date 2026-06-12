import { useAuthStore } from "@/store/authStore";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { Spinner } from "@/components/ui/Spinner";

export function HomePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  // Admin users see the admin dashboard as their landing page
  if (user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  // All other roles see the clinical dashboard
  return <DashboardPage />;
}
