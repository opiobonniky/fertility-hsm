import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  Syringe,
  ThermometerSnowflake,
  Microscope,
  CalendarCheck,
  DollarSign,
  BarChart3,
  CheckSquare,
  Shield,
  Heart,
  X,
  ChevronDown,
  ChevronRight,
  UserCog,
  KeyRound,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[];
  submenu?: { label: string; path: string; icon: React.ReactNode }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "BILLING", "RECEPTIONIST", "VIEWER"],
  },
  {
    label: "Patients",
    path: "/patients",
    icon: <Users className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "BILLING", "RECEPTIONIST"],
  },
  {
    label: "Treatment Cycles",
    path: "/cycles",
    icon: <Syringe className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "SONOGRAPHER"],
  },
  {
    label: "Cryo Inventory",
    path: "/cryo-inventory",
    icon: <ThermometerSnowflake className="w-5 h-5" />,
    roles: ["ADMIN", "EMBRYOLOGIST"],
  },
  {
    label: "Investigations",
    path: "/investigations",
    icon: <Microscope className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "LAB_TECH"],
  },
  {
    label: "Appointments",
    path: "/appointments",
    icon: <CalendarCheck className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "RECEPTIONIST"],
  },
  {
    label: "Billing",
    path: "/billing",
    icon: <DollarSign className="w-5 h-5" />,
    roles: ["ADMIN", "BILLING", "CONSULTANT", "SPECIALIST"],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "EMBRYOLOGIST", "BILLING"],
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: <CheckSquare className="w-5 h-5" />,
    roles: ["ADMIN", "CONSULTANT", "SPECIALIST", "NURSE", "EMBRYOLOGIST", "COUNSELLOR", "SONOGRAPHER", "LAB_TECH", "BILLING", "RECEPTIONIST"],
  },
  {
    label: "Admin",
    path: "/admin",
    icon: <Shield className="w-5 h-5" />,
    roles: ["ADMIN"],
    submenu: [
      { label: "Staff Management", path: "/admin/staff", icon: <UserCog className="w-4 h-4" /> },
      { label: "Role Management", path: "/admin/roles", icon: <Shield className="w-4 h-4" /> },
      { label: "Permissions", path: "/admin/permissions", icon: <KeyRound className="w-4 h-4" /> },
      { label: "Options & Lists", path: "/admin/options", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["Admin"]));

  // Auto-expand Admin submenu when navigating to any admin page
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      setExpandedMenus((prev) => {
        if (prev.has("Admin")) return prev;
        return new Set(prev).add("Admin");
      });
    }
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const visibleItems = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const isSubmenuActive = (submenu: { path: string }[]) => {
    return submenu.some((item) => location.pathname === item.path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              Life's Spring
            </p>
            <p className="text-xs text-gray-500 truncate">Women Center</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {visibleItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus.has(item.label);

            if (hasSubmenu) {
              return (
                <div key={item.label} className="space-y-0.5">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150 cursor-pointer
                      ${
                        isExpanded || isSubmenuActive(item.submenu!)
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-3 pl-4 border-l-2 border-gray-100 space-y-0.5">
                      {item.submenu!.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          end={sub.path === "/admin"}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                            transition-colors duration-150
                            ${
                              isActive
                                ? "bg-primary-50 text-primary-700"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            }
                          `
                          }
                        >
                          {sub.icon}
                          <span>{sub.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
