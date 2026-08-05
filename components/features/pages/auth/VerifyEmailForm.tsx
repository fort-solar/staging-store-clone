"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { verifyEmailToken } from "@/lib/localAuth";

const VerifyEmailForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const requested = useMemo(() => searchParams.get("requested") === "1", [searchParams]);

  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(
    requested && !token
      ? {
          tone: "success",
          message: email
            ? `Verification email sent to ${email}. Open the link in your inbox to complete setup.`
            : "Verification email sent. Open the link in your inbox to complete setup.",
        }
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTokenMissing = token.length === 0;
  const canUseDeveloperBypass =
    isTokenMissing && publicEnv.emailVerificationBypassEnabled;

  const onSubmit = async () => {
    if (isTokenMissing) {
      setStatus({
        tone: "error",
        message: "Verification token missing. Open the verification link from your email.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await verifyEmailToken(token);
      setStatus({
        tone: "success",
        message: response.message || "Email verified successfully. Redirecting...",
      });
      window.setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to verify email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeveloperBypass = () => {
    setStatus({
      tone: "success",
      message: "Sandbox bypass enabled. Continuing without email verification.",
    });
    router.push("/");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">Verify Your Email</h1>
        <p className="text-base text-[#6B7280]">
          Confirm your email address to finish activating your Fortsolar store account.
        </p>
      </div>

      <AuthMessage message={status?.message} tone={status?.tone} />

      {isTokenMissing ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#FAFAFA] p-5 text-sm text-[#475569]">
          This page requires the verification token from your email link before it can complete verification.
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#FAFAFA] p-5 text-sm text-[#475569]">
          Ready to confirm {email || "your email address"}.
        </div>
      )}

      <AuthButton isLoading={isSubmitting} disabled={isTokenMissing} onClick={onSubmit}>
        Verify Email
      </AuthButton>

      {canUseDeveloperBypass ? (
        <>
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-sm text-[#166534]">
            Email delivery bypass is enabled for this environment. Use this only when SMTP or mock email delivery is intentionally disabled for local or sandbox testing.
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl border-[#BBF7D0] text-sm font-semibold text-[#166534] hover:bg-[#DCFCE7]"
            onClick={handleDeveloperBypass}
          >
            Continue in Sandbox
          </Button>
        </>
      ) : null}

      <p className="text-center text-sm text-[#64748B]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#16A34A] hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};

export { VerifyEmailForm };
