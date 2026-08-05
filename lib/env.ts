export function readNonEmptyEnv(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function readBooleanEnv(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim().toLowerCase();

    if (!normalized) {
      continue;
    }

    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

export function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

const publicGoogleClientId = readNonEmptyEnv(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const publicFortsolarApiBaseUrl = readNonEmptyEnv(
  process.env.NEXT_PUBLIC_FORTSOLAR_API_BASE_URL,
  process.env.NEXT_PUBLIC_BASE_URL,
);
const publicEmailVerificationBypassEnabled =
  readBooleanEnv(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_BYPASS) ??
  process.env.NODE_ENV !== "production";
const serverFortsolarApiBaseUrl = readNonEmptyEnv(
  process.env.FORTSOLAR_API_BASE_URL,
  publicFortsolarApiBaseUrl,
);
const serverSessionSecret = readNonEmptyEnv(
  process.env.FORTSOLAR_STORE_SESSION_SECRET,
  process.env.FORTSOLAR_SESSION_SECRET,
  process.env.NEXT_PUBLIC_FORTSOLAR_SESSION_SECRET,
);

export const publicEnv = {
  googleClientId: publicGoogleClientId ?? "",
  fortsolarApiBaseUrl: publicFortsolarApiBaseUrl ?? "",
  emailVerificationBypassEnabled: publicEmailVerificationBypassEnabled,
} as const;

export const serverEnv = {
  fortsolarApiBaseUrl: serverFortsolarApiBaseUrl,
  sessionSecret: serverSessionSecret,
} as const;

export function requireFortsolarApiBaseUrl() {
  return requireEnv("FORTSOLAR_API_BASE_URL", serverEnv.fortsolarApiBaseUrl);
}
