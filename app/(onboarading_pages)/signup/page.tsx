import React from "react";
import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { SignupForm } from "@/components/features/auth/SignupForm";

const Page = () => {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};

export default Page;
