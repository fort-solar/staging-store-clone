import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { VerifyEmailForm } from "@/components/features/pages/auth/VerifyEmailForm";

const Page = () => {
  return (
    <AuthLayout>
      <VerifyEmailForm />
    </AuthLayout>
  );
};

export default Page;
