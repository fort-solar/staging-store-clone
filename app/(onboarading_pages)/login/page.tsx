import React from "react";
import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { LoginForm } from "@/components/features/auth/LoginForm";

const Page = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

export default Page;
