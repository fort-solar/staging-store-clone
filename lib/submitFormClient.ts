import { BASE_URL } from "@/components/features/constants";

type SubmitFormClientProps = {
  endpoint: string;
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const submitFormClient = async <T = any>({
  endpoint,
  method,
  values,
}: SubmitFormClientProps): Promise<{ data?: T; error?: string }> => {
  if (!BASE_URL) {
    return { error: "Missing NEXT_PUBLIC_BASE_URL environment variable." };
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: method ?? "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const isJson = response.headers.get("Content-Type")?.includes("application/json");
    const payload = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const errorMessage =
        payload && typeof payload === "object"
          ? Object.entries(payload)
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              .map(([key, value]) =>
                Array.isArray(value) ? value.join(", ") : String(value)
              )
              .join(" | ")
          : response.statusText;
      return { error: errorMessage };
    }

    return { data: payload ?? ({} as T) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Something went wrong!",
    };
  }
};
