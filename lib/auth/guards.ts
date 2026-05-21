import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createLoginRedirectHref } from "@/lib/auth/redirect";
import { getSessionSnapshotFromCookieStore } from "@/lib/auth/session";

export async function requireCustomerSession(redirectTo: string) {
  const snapshot = await getSessionSnapshotFromCookieStore(await cookies());

  if (!snapshot || snapshot.user.role !== "customer") {
    redirect(createLoginRedirectHref(redirectTo));
  }

  return snapshot;
}
