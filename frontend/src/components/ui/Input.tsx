import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, icon, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replaceAll(" ", "-") : undefined);
    const errorId = error && inputId ? inputId + "-error" : undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "block w-full rounded-lg border px-3 py-2 text-sm",
              "transition-colors duration-150",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              icon ? "pl-10" : "",
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-gray-300 focus:border-primary-500 focus:ring-primary-500/20",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              className || "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={errorId}
            {...props}
          />
          {error && (
            <p id={errorId} className="text-sm text-rose-600">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
