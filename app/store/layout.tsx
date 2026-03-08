"use client";

import React from "react";
import { RoleGuard } from "@/components/features/auth/RoleGuard";

const CustomerLayout = ({ children }: { children: React.ReactNode }) => {
  return <RoleGuard expectedRole="customer">{children}</RoleGuard>;
};

export default CustomerLayout;
