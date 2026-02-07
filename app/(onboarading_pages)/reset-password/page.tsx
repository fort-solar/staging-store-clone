import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/features/pages/auth/ResetPasswordForm";

const Page = () => {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default Page;
