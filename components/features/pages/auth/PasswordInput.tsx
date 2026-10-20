"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "type"> & {
  label: string;
  error?: string;
};

const PasswordInput = ({ label, error, className, required, ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const inputId =
    props.id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-[#111827]">
        {label}
        {required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      <div className="relative">
        <AuthInput
          label={undefined}
          id={inputId}
          type={isVisible ? "text" : "password"}
          className={`pr-12 ${className ?? ""}`}
          error={error}
          required={required}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          onMouseDown={() => setIsVisible(true)}
          onMouseUp={() => setIsVisible(false)}
          onMouseLeave={() => setIsVisible(false)}
          onTouchStart={() => setIsVisible(true)}
          onTouchEnd={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 select-none text-[#94A3B8] transition hover:text-[#0F172A] focus:outline-none"
          aria-label={isVisible ? "Hide password (click or release to hide)" : "Show password (hold or click to view)"}
          title={isVisible ? "Release or click to hide password" : "Hold or click to view password"}
        >
          {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export { PasswordInput };
