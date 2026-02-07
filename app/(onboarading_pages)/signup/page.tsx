import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { SignupForm } from "@/components/features/pages/auth/SignupForm";

const Page = () => {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};

export default Page;
