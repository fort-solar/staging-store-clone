"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createLoginRedirectHref } from "@/lib/auth/redirect";

type LoginGateOptions = {
  redirectTo?: string;
  onAuthenticated?: () => void;
};

export function useCustomerLoginGate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, isRefreshing } = useAuth();

  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const requireCustomerLogin = useCallback(
    ({ redirectTo, onAuthenticated }: LoginGateOptions = {}) => {
      if (session) {
        onAuthenticated?.();
        return true;
      }

      if (isRefreshing) {
        return false;
      }

      router.push(createLoginRedirectHref(redirectTo ?? currentPath));
      return false;
    },
    [currentPath, isRefreshing, router, session],
  );

  return {
    isAuthenticated: Boolean(session),
    isRefreshing,
    requireCustomerLogin,
  };
}
