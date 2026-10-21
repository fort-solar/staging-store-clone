"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { updateCurrentUserProfile } from "@/lib/localAuth";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, refreshSession } = useAuth();

  const redirectTo = searchParams.get("redirect") || "/";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFullName(session.user.fullName || "");
      setEmail(session.user.email || "");
      if (session.user.phone) setPhone(session.user.phone);
      if (session.user.address) setAddress(session.user.address);

      // If user already has both phone and address, redirect them to their destination
      if (session.user.phone && session.user.address) {
        router.replace(redirectTo);
      }
    }
  }, [session, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      setStatus({ tone: "error", message: "Phone number is required for delivery and installation coordination." });
      return;
    }

    if (!address.trim()) {
      setStatus({ tone: "error", message: "Delivery address is required for dispatching products and solar site assessments." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      await updateCurrentUserProfile({
        name: fullName.trim() || undefined,
        phone: phone.trim(),
        address: address.trim(),
      });

      await refreshSession().catch(() => null);

      setStatus({ tone: "success", message: "Profile completed successfully! Redirecting..." });

      setTimeout(() => {
        window.location.assign(redirectTo);
      }, 500);
    } catch (err: any) {
      setStatus({
        tone: "error",
        message: err.message || "Failed to save profile details. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Almost Done • Step 2 of 2</span>
        </div>
        <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white">
          Complete Your Profile
        </h1>
        <p className="text-base text-[#6B7280] dark:text-slate-400">
          To ensure seamless equipment delivery and solar installation quotes, please provide your contact and delivery address.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-300">
            Account Email
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              disabled
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 text-sm font-medium text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed pr-10"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Verified via authentication</p>
        </div>

        <AuthInput
          label="Full Name"
          placeholder="e.g. John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <AuthInput
          label="Phone Number"
          type="tel"
          placeholder="e.g. 0802 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
        />

        <AuthInput
          label="Delivery Address"
          placeholder="e.g. 15 Admiralty Way, Lekki Phase 1, Lagos"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="street-address"
          required
        />

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting}>
          Complete Setup &amp; Continue
        </AuthButton>
      </form>
    </div>
  );
}
