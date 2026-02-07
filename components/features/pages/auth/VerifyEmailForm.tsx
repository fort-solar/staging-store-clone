"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { OtpInput } from "@/components/features/pages/auth/OtpInput";
import { submitFormClient } from "@/lib/submitFormClient";

const VERIFY_EMAIL_ENDPOINT = "/auth/verify-email";
const RESEND_OTP_ENDPOINT = "/auth/resend-otp";

const VerifyEmailForm = () => {
  const searchParams = useSearchParams();
  const verificationId = useMemo(() => searchParams.get("id") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(150);

  useEffect(() => {
    if (!verificationId) return;
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, verificationId]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const onSubmit = async () => {
    if (!verificationId) {
      setStatus({ tone: "error", message: "Verification ID missing. Please start sign-up again." });
      return;
    }

    if (otp.length < 6) {
      setStatus({ tone: "error", message: "Enter the 6-digit code sent to your email." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    const { error } = await submitFormClient({
      endpoint: VERIFY_EMAIL_ENDPOINT,
      values: {
        id: verificationId,
        email,
        code: otp,
      },
    });
    if (error) {
      setStatus({ tone: "error", message: error });
    } else {
      setStatus({ tone: "success", message: "Email verified successfully." });
    }
    setIsSubmitting(false);
  };

  const handleResend = async () => {
    if (!verificationId) {
      setStatus({ tone: "error", message: "Verification ID missing." });
      return;
    }
    setStatus(null);
    const { error } = await submitFormClient({
      endpoint: RESEND_OTP_ENDPOINT,
      values: {
        id: verificationId,
        email,
      },
    });
    if (error) {
      setStatus({ tone: "error", message: error });
    } else {
      setStatus({ tone: "success", message: "OTP resent. Check your email." });
      setSecondsLeft(150);
    }
  };

  const isIdMissing = !verificationId;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">Enter OTP</h1>
        <p className="text-base text-[#6B7280]">
          Please enter the One-Time Password (OTP) sent to your email.
        </p>
      </div>

      {isIdMissing ? (
        <AuthMessage
          tone="error"
          message="Verification ID missing. Please complete sign-up first."
        />
      ) : null}

      <div className="space-y-4">
        <OtpInput onChange={setOtp} />

        <div className="text-center text-sm text-[#64748B]">
          O.T.P Code will expire in {formatTime(secondsLeft)}
        </div>

        <div className="text-center text-sm text-[#64748B]">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-[#16A34A] hover:underline"
            disabled={isIdMissing}
          >
            Resend OTP
          </button>
        </div>
      </div>

      <AuthMessage message={status?.message} tone={status?.tone} />

      <AuthButton isLoading={isSubmitting} disabled={isIdMissing} onClick={onSubmit}>
        Verify
      </AuthButton>

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
