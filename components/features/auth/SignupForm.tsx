"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
import { AuthInput } from "@/components/features/auth/AuthInput";
import { PasswordInput } from "@/components/features/auth/PasswordInput";
import { AuthButton } from "@/components/features/auth/AuthButton";
import { AuthMessage } from "@/components/features/auth/AuthMessage";
import { submitFormClient } from "@/lib/submitFormClient";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const SIGNUP_ENDPOINT = "/auth/signup";

const SignupForm = () => {
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useMemo(() => searchParams.get("role") ?? "customer", [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const passwordValue = watch("password");

  const createVerificationId = () => {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `verify_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };

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
    const { error } = await submitFormClient({
      endpoint: SIGNUP_ENDPOINT,
      values: {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role,
      },
    });

    if (error) {
      setStatus({ tone: "error", message: error });
      setIsSubmitting(false);
      return;
    }

    const verificationId = createVerificationId();
    setStatus({ tone: "success", message: "Account created. Redirecting to verification..." });
    router.push(`/verify-email?id=${verificationId}&email=${encodeURIComponent(values.email)}`);
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

      <div className="space-y-5">
        <div className="">
          <GoogleLogin
            onSuccess={() => setStatus({ tone: "success", message: "Google sign-in success." })}
            onError={() => setStatus({ tone: "error", message: "Google sign-in failed." })}
            size="large"
            width="100%"
            text="continue_with"
            shape="rectangular"
          />
        </div>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-[#94A3B8]">
          <span className="h-px flex-1 bg-[#E2E8F0]" />
          Or
          <span className="h-px flex-1 bg-[#E2E8F0]" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="Full Name"
          placeholder="eg. John Doe"
          {...register("fullName", { required: "Full name is required" })}
          error={errors.fullName?.message}
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          {...register("email", { required: "Email is required" })}
          error={errors.email?.message}
        />

        <AuthInput
          label="Phone"
          type="tel"
          placeholder="902 2367 890"
          autoComplete="tel"
          {...register("phone", { required: "Phone is required" })}
          error={errors.phone?.message}
        />

        <AuthInput
          label="Address"
          placeholder="suite 5 ..."
          autoComplete="street-address"
          {...register("address", { required: "Address is required" })}
          error={errors.address?.message}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
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
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === passwordValue || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />

        <label className="flex items-center gap-3 text-sm text-[#475569]">
          <input
            type="checkbox"
            className="h-5 w-5 rounded-md border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A]/30"
            {...register("acceptTerms")}
          />
          Accept Terms &amp; Conditions
        </label>

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
          Are you an installer?{" "}
          <Link
            href="/signup?role=installer"
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
