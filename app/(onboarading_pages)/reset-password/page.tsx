import React from "react";
import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";

const Page = () => {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default Page;
