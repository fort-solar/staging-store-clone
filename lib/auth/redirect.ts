const DEFAULT_REDIRECT_PATH = "/store/dashboard";

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH,
) {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function createLoginRedirectHref(redirectTo: string) {
  const searchParams = new URLSearchParams({
    redirect: sanitizeRedirectPath(redirectTo),
  });

  return `/login?${searchParams.toString()}`;
}
