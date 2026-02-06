import React from "react";
import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

const Page = () => {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default Page;
