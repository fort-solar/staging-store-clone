import React from "react";
import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { VerifyEmailForm } from "@/components/features/auth/VerifyEmailForm";

const Page = () => {
  return (
    <AuthLayout>
      <VerifyEmailForm />
    </AuthLayout>
  );
};

export default Page;
