import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, Eye, EyeOff, Heart, IdCard } from "lucide-react";

interface FormErrors {
  staffCode?: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [staffCode, setStaffCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");

  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname || "/";

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!staffCode.trim()) {
      newErrors.staffCode = "Staff code is required";
    } else if (staffCode.trim().length < 2) {
      newErrors.staffCode = "Invalid staff code";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    try {
      await login({ staffCode: staffCode.trim().toUpperCase(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid staff code or password. Please try again.";
      setApiError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-200">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Life's Spring Women Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fertility Hospital Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* API Error */}
            {apiError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <Input
              label="Staff Code"
              type="text"
              placeholder="e.g. ADMIN, NURSE01"
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
              error={errors.staffCode}
              icon={<IdCard className="w-4 h-4 text-gray-400" />}
              autoFocus
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  {showPassword ? "Hide" : "Show"} password
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Life's Spring Women Center. All
          rights reserved.
        </p>
      </div>
    </div>
  );
}
