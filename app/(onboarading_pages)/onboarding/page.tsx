import React, { Suspense } from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { OnboardingForm } from "@/components/features/pages/auth/OnboardingForm";

export const metadata = {
  title: "Complete Your Profile | Fortsolar Store",
  description: "Provide your contact and delivery address to complete your account setup.",
};

export default function Page() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading profile setup...</div>}>
        <OnboardingForm />
      </Suspense>
    </AuthLayout>
  );
}
