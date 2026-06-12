import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { RoleBadge } from "@/components/ui/Badge";
import {
  Menu,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Bell,
  IdCard,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center/Right: Notifications & User */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <IdCard className="w-3 h-3" />
                  {user.staffCode}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="mt-1">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
