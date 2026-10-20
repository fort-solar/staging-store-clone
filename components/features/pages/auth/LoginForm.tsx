"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { PasswordInput } from "@/components/features/pages/auth/PasswordInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { GoogleAuthButton } from "@/components/features/pages/auth/GoogleAuthButton";
import { useAuth } from "@/components/auth/auth-provider";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env";
import { authenticateWithGoogle, loginMockUser } from "@/lib/localAuth";
import { useRouter, useSearchParams } from "next/navigation";

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

const LoginForm = () => {
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAuthMethod, setLastAuthMethod] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const isGoogleAuthEnabled = Boolean(publicEnv.googleClientId);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setLastAuthMethod(localStorage.getItem("fortsolar_last_auth_method"));
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const redirectTo = sanitizeRedirectPath(searchParams.get("redirect"));

    setIsSubmitting(true);
    setStatus(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("fortsolar_last_auth_method", "password");
    }
    const { error } = await loginMockUser({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setStatus({ tone: "error", message: error });
      setIsSubmitting(false);
    } else {
      await refreshSession().catch(() => null);
      setStatus({ tone: "success", message: "Login successful. Redirecting..." });
      window.location.assign(redirectTo);
    }
  };

  const handleGoogleAuth = async (idToken: string) => {
    const redirectTo = sanitizeRedirectPath(searchParams.get("redirect"));

    setIsSubmitting(true);
    setStatus(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("fortsolar_last_auth_method", "google");
    }
    const { error } = await authenticateWithGoogle({ idToken });

    if (error) {
      setStatus({ tone: "error", message: error });
      setIsSubmitting(false);
    } else {
      await refreshSession().catch(() => null);
      setStatus({ tone: "success", message: "Login successful. Redirecting..." });
      window.location.assign(redirectTo);
    }
  };

  return (
    <div className="space-y-8 ">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">Welcome back!</h1>
        <p className="text-base text-[#6B7280]">
          Let&apos;s get you plugged in. Manage your solar products, track your
          installations, and keep the power flowing.
        </p>
      </div>

      {isGoogleAuthEnabled ? (
        <div className="space-y-5">
          <div className="relative">
            {lastAuthMethod === "google" && (
              <span className="absolute -top-2.5 right-3 z-10 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 shadow-2xs">
                Last used
              </span>
            )}
            <GoogleAuthButton
              onSuccess={(response) => {
                if (!response.credential) {
                  setStatus({ tone: "error", message: "Google sign-in did not return an ID token." });
                  return;
                }

                void handleGoogleAuth(response.credential);
              }}
              onError={() => setStatus({ tone: "error", message: "Google sign-in failed." })}
            />
          </div>

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-[#94A3B8]">
            <span className="h-px flex-1 bg-[#E2E8F0]" />
            Or
            <span className="h-px flex-1 bg-[#E2E8F0]" />
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="Email"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          {...register("email", {
            required: "Email is required",
          })}
          error={errors.email?.message}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[#111827]" htmlFor="password">
                Password
              </label>
              {lastAuthMethod === "password" && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Last used
                </span>
              )}
            </div>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#16A34A] hover:underline"
            >
              Forgot Password
            </Link>
          </div>
          <PasswordInput
            label=""
            id="password"
            placeholder="••••••••••••••"
            autoComplete="current-password"
            {...register("password", {
              required: "Password is required",
            })}
            error={errors.password?.message}
          />
        </div>

        <GradientCheckbox
          label="Remember Me"
          labelClassName="text-sm text-[#475569]"
          {...register("remember")}
        />

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting}>Login to Your Account</AuthButton>
      </form>

      <div className="space-y-2 text-center text-sm text-[#64748B]">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#16A34A] hover:underline">
            Sign Up
          </Link>
        </p>
        <p >
          Are you an installer?{" "}
          <Link
             href={"https://installer.fortsolar.ng"}
            aria-disabled
            className="font-semibold text-[#16A34A] hover:underline"
          >
            Join as Installer
          </Link>
        </p>
      </div>
    </div>
  );
};

export { LoginForm };
