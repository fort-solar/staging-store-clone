"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { PasswordInput } from "@/components/features/pages/auth/PasswordInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { GoogleAuthButton } from "@/components/features/pages/auth/GoogleAuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import { publicEnv } from "@/lib/env";
import {
  authenticateWithGoogle,
  registerMockUser,
  requestEmailVerification,
  updateCurrentUserProfile,
} from "@/lib/localAuth";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const SignupForm = () => {
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const isGoogleAuthEnabled = Boolean(publicEnv.googleClientId);

  const initialEmail = searchParams.get("email") || "";
  const initialName = searchParams.get("name") || "";
  const initialPhone = searchParams.get("phone") || "";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<SignupFormValues>({
    defaultValues: {
      fullName: initialName,
      email: initialEmail,
      phone: initialPhone,
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  React.useEffect(() => {
    if (initialEmail || initialName || initialPhone) {
      reset({
        fullName: initialName,
        email: initialEmail,
        phone: initialPhone,
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });
    }
  }, [initialEmail, initialName, initialPhone, reset]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const passwordValue = watch("password");

  const onSubmit = async (values: SignupFormValues) => {
    if (values.password !== values.confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    if (!values.acceptTerms) {
      setStatus({ tone: "error", message: "You must accept the terms & conditions." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    const { error, session } = await registerMockUser({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      address: "",
      password: values.password,
      role: "customer",
    });

    if (error) {
      setStatus({ tone: "error", message: error });
      setIsSubmitting(false);
      return;
    }

    if (!session) {
      setStatus({ tone: "error", message: "Unable to create account. Please try again." });
      setIsSubmitting(false);
      return;
    }

    await updateCurrentUserProfile({
      name: values.fullName,
      phone: values.phone,
      address: "",
    }).catch(() => null);

    await requestEmailVerification().catch(() => null);
    await refreshSession().catch(() => null);

    setStatus({ tone: "success", message: "Account created. Check your email to verify your address." });
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}&requested=1`);
    setIsSubmitting(false);
  };

  const handleGoogleAuth = async (idToken: string) => {
    setIsSubmitting(true);
    setStatus(null);
    const { error } = await authenticateWithGoogle({ idToken });

    if (error) {
      setStatus({ tone: "error", message: error });
      setIsSubmitting(false);
      return;
    }

    await refreshSession().catch(() => null);
    setStatus({ tone: "success", message: "Account created. Redirecting..." });
    router.push("/");
    router.refresh();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">
          Start Your FortSolar Experience.
        </h1>
        <p className="text-base text-[#6B7280]">
          Explore top-rated solar products, Package Packages, and reliable
          installation services designed for lasting performance.
        </p>
      </div>

      {isGoogleAuthEnabled ? (
        <div className="space-y-5">
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

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-[#94A3B8]">
            <span className="h-px flex-1 bg-[#E2E8F0]" />
            Or
            <span className="h-px flex-1 bg-[#E2E8F0]" />
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="Full Name"
          placeholder="eg. John Doe"
          required
          {...register("fullName", { required: "Full name is required" })}
          error={errors.fullName?.message}
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          required
          {...register("email", { required: "Email is required" })}
          error={errors.email?.message}
        />

        <AuthInput
          label="Phone"
          type="tel"
          placeholder="902 2367 890"
          autoComplete="tel"
          required
          {...register("phone", { required: "Phone is required" })}
          error={errors.phone?.message}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
          required
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Use at least 8 characters" },
          })}
          error={errors.password?.message}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
          required
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === passwordValue || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />

        <GradientCheckbox
          label="Accept Terms & Conditions"
          labelClassName="text-sm text-[#475569]"
          {...register("acceptTerms")}
        />

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting}>Create My Account</AuthButton>
      </form>

      <div className="space-y-2 text-center text-sm text-[#64748B]">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#16A34A] hover:underline">
            Login
          </Link>
        </p>
        <p>
          Are you an installer?
          <Link
            aria-disabled
            href={"https://installer.fortsolar.ng"}
            className="font-semibold text-[#16A34A] hover:underline"
          >
            Join as Installer
          </Link>
        </p>
      </div>
    </div>
  );
};

export { SignupForm };
