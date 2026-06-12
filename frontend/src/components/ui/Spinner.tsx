import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = "" }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin text-primary-600 ${className}`}
      size={size}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <Spinner size={40} />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
