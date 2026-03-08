"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getMockSession, type UserRole } from "@/lib/localAuth";

const RoleGuard = ({
  expectedRole,
  children,
}: {
  expectedRole: UserRole;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const session = useMemo(() => getMockSession(), []);
  const isAllowed = session?.role === expectedRole;

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.role !== expectedRole) {
      router.replace(
        session.role === "installer" ? "/installer/dashboard" : "/store"
      );
      return;
    }
  }, [expectedRole, isAllowed, router, session]);

  if (!isAllowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F7F7] text-sm text-[#4B5563]">
        Loading your dashboard...
      </div>
    );
  }

  return <>{children}</>;
};

export { RoleGuard };
