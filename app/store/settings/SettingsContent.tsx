"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useAuth } from "@/components/auth/auth-provider";
import { createLoginRedirectHref } from "@/lib/auth/redirect";
import { Eye, EyeOff, Lock, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/ui/pagination-controls";
import { SmartTabs, type TabKey } from "@/lib/smartTabs";
import { getNotifications } from "@/lib/notifications";
import {
  approveCustomerInstallation,
  changeCustomerPassword,
  getCustomerInstallations,
  getCustomerInstallationDetail,
  getCustomerOrderDetail,
  getCustomerOrders,
  getCustomerPackageRequests,
  getCustomerQuotes,
  getCustomerSummary,
  submitCustomerQuoteFeedback,
  reportCustomerInstallationIssue,
  acceptCustomerPackageRequest,
  initializeCustomerOrderPayment,
  verifyCustomerPayment,
} from "@/lib/customer";
import { buildPaystackInlineOptions } from "@/lib/checkout";
import { sessionSnapshotToMockUser, updateCurrentUserProfile } from "@/lib/localAuth";
import type {
  CustomerInstallationDetailApiResponse,
  CustomerInstallationListApiResponse,
  CustomerOrderDetailApiResponse,
  CustomerOrderListApiResponse,
  CustomerPackageRequestListApiResponse,
  CustomerQuoteRecord,
  CustomerSummaryRecord,
} from "@/types/api.types";
import { FORTSOLAR_GOOGLE_REVIEW_URL } from "@/lib/env";

const tabs = [
  { key: "profile", label: "Profile", link: "/settings/profile", mobileLink: "/settings/profile#section" },
  { key: "orders", label: "Orders", link: "/settings/orders", mobileLink: "/settings/orders#section" },
  { key: "quotes", label: "Quotes", link: "/settings/quotes", mobileLink: "/settings/quotes#section" },
  {
    key: "installations",
    label: "Installations",
    link: "/settings/installations",
    mobileLink: "/settings/installations#section",
  },
  {
    key: "package_requests",
    label: "Package Requests",
    link: "/settings/package-requests",
    mobileLink: "/settings/package-requests#section",
  },
] as const;

const QUOTE_REQUESTS_KEY = "fortsolar_quote_requests_v1";
const PAGE_SIZE = 20;
const QUOTE_PAGE_SIZE = PAGE_SIZE;
const LOCAL_QUOTE_PAGE_SIZE = PAGE_SIZE;

type StoredQuoteRequest = {
  createdAt: string;
  location: string;
  installationAddress: string;
  preferredContactMethod: string;
  additionalInfo: string;
  requestInstallation: boolean;
  products: Array<{
    id: string;
    title: string;
    quantity?: number;
  }>;
};

type AsyncStatus = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) {
    return "N/A";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(value: number | string | null | undefined, currency = "NGN") {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return formatCurrency(parsed, currency);
    }

    return value;
  }

  return "N/A";
}

function humanizeStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readStoredQuoteRequests() {
  if (typeof window === "undefined") {
    return [] as StoredQuoteRequest[];
  }

  try {
    const raw = window.localStorage.getItem(QUOTE_REQUESTS_KEY);
    return raw ? (JSON.parse(raw) as StoredQuoteRequest[]) : [];
  } catch {
    return [] as StoredQuoteRequest[];
  }
}

function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-sm text-slate-400">N/A</span>;
  }

  if (
    typeof value === "string" &&
    (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value))
  ) {
    return <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(value)}</span>;
  }

  if (Array.isArray(value) || isRecord(value)) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="text-sm text-slate-900 dark:text-white">{String(value)}</span>;
}

function ProfileInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 py-3 text-sm">
      <span className="shrink-0 text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white text-right min-w-0 break-all">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-4 transition-colors">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
      {message}
    </div>
  );
}

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

const SettingsContent = ({ page }: { page: TabKey }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, signOut, isRefreshing, isSigningOut } = useAuth();
  const currentUser = useMemo(() => sessionSnapshotToMockUser(session), [session]);
  const [activeTab, setActiveTab] = useState<TabKey>(page);
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState<CustomerSummaryRecord>({
    packageRequests: 0,
    completedInstallations: 0,
  });
  const [quotes, setQuotes] = useState<CustomerQuoteRecord[]>([]);
  const [localQuoteRequests, setLocalQuoteRequests] = useState<StoredQuoteRequest[]>([]);
  const [ordersPayload, setOrdersPayload] = useState<CustomerOrderListApiResponse | null>(null);
  const [installationsPayload, setInstallationsPayload] =
    useState<CustomerInstallationListApiResponse | null>(null);
  const [packageRequestsPayload, setPackageRequestsPayload] =
    useState<CustomerPackageRequestListApiResponse | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, Record<string, unknown>>>({});
  const [installationDetails, setInstallationDetails] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [ordersPage, setOrdersPage] = useState(1);
  const [installationsPage, setInstallationsPage] = useState(1);
  const [packageRequestsPage, setPackageRequestsPage] = useState(1);
  const [quotesPage, setQuotesPage] = useState(1);
  const [localQuoteRequestsPage, setLocalQuoteRequestsPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedInstallationId, setExpandedInstallationId] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<AsyncStatus>(null);
  const [pageStatus, setPageStatus] = useState<AsyncStatus>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false);
  const [isLoadingPackageRequests, setIsLoadingPackageRequests] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isPayingRequestId, setIsPayingRequestId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    salutation: "Mr.",
    customSalutation: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("fortsolar:store:theme_preference") as "light" | "dark" | "system") || "light";
  });

  const handleThemeChange = (next: "light" | "dark" | "system") => {
    setThemeMode(next);
    localStorage.setItem("fortsolar:store:theme_preference", next);
    const isDark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    localStorage.setItem("fortsolar:store:appearance", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
    window.dispatchEvent(new Event("fortsolar:store:theme-change"));
    void updateCurrentUserProfile({ theme_preference: next }).catch(() => {});
  };

  const isGoogleAccount = currentUser?.authProvider === "google" || (session?.user as any)?.authProvider === "google";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const passwordCriteria = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const passwordStrengthScore = Object.values(passwordCriteria).filter(Boolean).length;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ tone: "error", message: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ tone: "error", message: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ tone: "error", message: "New password and confirm password do not match." });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordStatus({ tone: "error", message: "New password cannot be the same as your current password." });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await changeCustomerPassword({ currentPassword, newPassword });
      setPasswordStatus({
        tone: "success",
        message: res.message || "Password changed successfully! Other active sessions have been signed out.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({
        tone: "error",
        message: err instanceof Error ? err.message : "Failed to change password. Please verify your current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    getNotifications()
      .then((payload) => {
        if (payload?.data) {
          setNotifications(payload.data);
        }
      })
      .catch((err) => console.error("Error loading notifications:", err));
  }, []);

  const getUnreadCountForTab = (tabKey: TabKey) => {
    if (!notifications || !notifications.length) return 0;
    return notifications.filter((notif) => {
      if (notif.is_read) return false;
      if (!notif.link) return false;

      const link = notif.link.toLowerCase();
      
      if (tabKey === "orders") {
        return link.includes("/orders") && !link.includes("/package-requests") && !link.includes("/quotes");
      }
      if (tabKey === "quotes") {
        return link.includes("/quotes");
      }
      if (tabKey === "installations") {
        return link.includes("/installations");
      }
      if (tabKey === "package_requests") {
        return link.includes("/package-requests") || link.includes("/package_requests");
      }
      return false;
    }).length;
  };

  const tabsWithUnread = useMemo(() => {
    return tabs.map((tab) => ({
      ...tab,
      unreadCount: getUnreadCountForTab(tab.key),
    }));
  }, [notifications]);

  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    setActiveTab(page);
  }, [page]);

  useEffect(() => {
    if (isRefreshing || isSigningOut || session) {
      return;
    }

    router.replace(createLoginRedirectHref(currentPath));
  }, [currentPath, isRefreshing, isSigningOut, router, session]);

  useEffect(() => {
    const fullName = currentUser?.fullName ?? "";
    const parts = fullName.split(/\s+/).filter(Boolean);
    const salutation = currentUser?.salutation ?? "";
    const isPreset = ["Mr.", "Mrs.", "Ms.", "Doctor (PhD)", "Engr."].includes(salutation);

    setProfileForm({
      salutation: isPreset ? salutation : (salutation ? "custom" : "Mr."),
      customSalutation: isPreset ? "" : salutation,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
      address: currentUser?.address ?? "",
    });

    if (currentUser?.theme_preference) {
      const pref = currentUser.theme_preference;
      setThemeMode(pref);
      localStorage.setItem("fortsolar:store:theme_preference", pref);
      const isDark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      localStorage.setItem("fortsolar:store:appearance", isDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [currentUser?.address, currentUser?.email, currentUser?.fullName, currentUser?.phone, currentUser?.salutation, currentUser?.theme_preference]);

  useEffect(() => {
    setLocalQuoteRequests(readStoredQuoteRequests());
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoadingSummary(true);

      try {
        const payload = await getCustomerSummary();

        if (!cancelled) {
          setSummary(payload.data);
        }
      } catch (error) {
        if (!cancelled) {
          setPageStatus({
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to load your account summary.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummary(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "quotes" || quotes.length > 0 || isLoadingQuotes) {
      return;
    }

    let cancelled = false;
    setIsLoadingQuotes(true);

    getCustomerQuotes()
      .then((payload) => {
        if (!cancelled) {
          setQuotes(payload.data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPageStatus({
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to load your quotes.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingQuotes(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, isLoadingQuotes, quotes.length]);

  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }

    let cancelled = false;
    setIsLoadingOrders(true);

    getCustomerOrders(ordersPage, PAGE_SIZE)
      .then((payload) => {
        if (!cancelled) {
          setOrdersPayload(payload);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPageStatus({
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to load your orders.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingOrders(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, ordersPage]);

  useEffect(() => {
    if (activeTab !== "installations") {
      return;
    }

    let cancelled = false;
    setIsLoadingInstallations(true);

    getCustomerInstallations(installationsPage, PAGE_SIZE)
      .then((payload) => {
        if (!cancelled) {
          setInstallationsPayload(payload);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPageStatus({
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to load your installations.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingInstallations(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, installationsPage]);

  useEffect(() => {
    if (activeTab !== "package_requests") {
      return;
    }

    let cancelled = false;
    setIsLoadingPackageRequests(true);

    getCustomerPackageRequests(packageRequestsPage, PAGE_SIZE)
      .then((payload) => {
        if (!cancelled) {
          setPackageRequestsPayload(payload);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPageStatus({
            tone: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unable to load your package requests.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPackageRequests(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, packageRequestsPage]);

  async function handleProfileSave() {
    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();

    if (!fullName || !profileForm.email) {
      setProfileStatus({
        tone: "error",
        message: "First name, last name, and email are required.",
      });
      return;
    }

    setIsSavingProfile(true);
    setProfileStatus(null);

    const effectiveSalutation =
      profileForm.salutation === "custom"
        ? profileForm.customSalutation.trim()
        : profileForm.salutation.trim();

    try {
      await updateCurrentUserProfile({
        salutation: effectiveSalutation || undefined,
        name: fullName,
        phone: profileForm.phone,
        address: profileForm.address,
        theme_preference: themeMode,
      });
      setProfileStatus({
        tone: "success",
        message: "Profile updated successfully.",
      });
    } catch (error) {
      setProfileStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update your profile.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function toggleOrderDetail(id: string) {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(id);

    if (orderDetails[id]) {
      return;
    }

    try {
      const payload = (await getCustomerOrderDetail(id)) as CustomerOrderDetailApiResponse;
      setOrderDetails((current) => ({
        ...current,
        [id]: payload.data,
      }));
    } catch (error) {
      setPageStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to load the selected order.",
      });
    }
  }

  async function toggleInstallationDetail(id: string) {
    if (expandedInstallationId === id) {
      setExpandedInstallationId(null);
      return;
    }

    setExpandedInstallationId(id);

    if (installationDetails[id]) {
      return;
    }

    try {
      const payload =
        (await getCustomerInstallationDetail(id)) as CustomerInstallationDetailApiResponse;
      setInstallationDetails((current) => ({
        ...current,
        [id]: payload.data,
      }));
    } catch (error) {
      setPageStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the selected installation.",
      });
    }
  }

  async function handleApproveInstallation(id: string) {
    try {
      await approveCustomerInstallation(id);
      setPageStatus({
        tone: "success",
        message: "Installation approved successfully.",
      });
      setInstallationsPayload(null);
      setInstallationsPage((current) => current);
      const payload = await getCustomerInstallations(installationsPage, PAGE_SIZE);
      setInstallationsPayload(payload);
      const summaryPayload = await getCustomerSummary();
      setSummary(summaryPayload.data);
    } catch (error) {
      setPageStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to approve this installation.",
      });
    }
  }

  async function handleReportInstallationIssue(id: string) {
    const description = window.prompt("Describe the issue with this installation.");

    if (!description?.trim()) {
      return;
    }

    try {
      await reportCustomerInstallationIssue(id, {
        description: description.trim(),
      });
      setPageStatus({
        tone: "success",
        message: "Your installation issue has been submitted.",
      });
    } catch (error) {
      setPageStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to submit the installation issue.",
      });
    }
  }

  async function handlePaymentVerification(reference: string) {
    if (isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    setPageStatus({
      tone: "info",
      message: "Verifying payment reference...",
    });
    try {
      await verifyCustomerPayment({ reference });
      setPageStatus({
        tone: "success",
        message: "Payment verified successfully. Your order is now awaiting approval.",
      });
      setPackageRequestsPayload(null);
      const prPayload = await getCustomerPackageRequests(packageRequestsPage, PAGE_SIZE);
      setPackageRequestsPayload(prPayload);
      const summaryPayload = await getCustomerSummary();
      setSummary(summaryPayload.data);
    } catch (error) {
      setPageStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to verify your payment.",
      });
    } finally {
      setIsVerifyingPayment(false);
      setIsPayingRequestId(null);
    }
  }

  async function handleAcceptAndPay(packageRequestId: string) {
    if (isPayingRequestId) return;
    setIsPayingRequestId(packageRequestId);
    setPageStatus({
      tone: "info",
      message: "Accepting quote package request...",
    });

    try {
      const acceptResult = await acceptCustomerPackageRequest(packageRequestId);
      const orderId = acceptResult.orderId;
      if (!orderId) {
        throw new Error("Package request accepted, but failed to retrieve order ID.");
      }

      setPageStatus({
        tone: "info",
        message: "Initializing checkout payment details...",
      });
      const paymentPayload = await initializeCustomerOrderPayment(orderId);
      const { accessCode, amountKobo, authorizationUrl, publicKey, reference } =
        paymentPayload.data;

      if (window.PaystackPop?.setup) {
        const handler = window.PaystackPop.setup(
          buildPaystackInlineOptions({
            payment: {
              publicKey,
              amountKobo,
              reference,
              accessCode,
            },
            email: currentUser?.email || "",
            onSuccess: (nextReference) => {
              void handlePaymentVerification(nextReference);
            },
            onClose: () => {
              setPageStatus({
                tone: "info",
                message: "Payment window closed before completion.",
              });
              setIsPayingRequestId(null);
            },
          })
        );
        handler.openIframe();
        setPageStatus({
          tone: "info",
          message: "Order generated. Complete payment in the secure window.",
        });
      } else {
        setPageStatus({
          tone: "info",
          message: "Redirecting to complete payment...",
        });
        window.location.assign(authorizationUrl);
      }
    } catch (error) {
      setPageStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to process payment for this quote.",
      });
      setIsPayingRequestId(null);
    }
  }

  const [isFeedbackSubmittingQuoteId, setIsFeedbackSubmittingQuoteId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [showRejectionFormQuoteId, setShowRejectionFormQuoteId] = useState<string | null>(null);

  async function handleQuoteFeedback(id: string, response: "approved" | "rejected") {
    if (isFeedbackSubmittingQuoteId) return;
    const note = rejectionNotes[id]?.trim();
    if (response === "rejected" && !note) {
      setPageStatus({ tone: "error", message: "Please supply rejection feedback notes." });
      return;
    }

    setIsFeedbackSubmittingQuoteId(id);
    setPageStatus({
      tone: "info",
      message: response === "approved"
        ? "Accepting proposal and preparing standard checkout..."
        : "Submitting revision feedback...",
    });

    try {
      const result = await submitCustomerQuoteFeedback(id, { response, feedback: note });
      setPageStatus({
        tone: "success",
        message: response === "approved"
          ? "Proposal accepted! Redirecting to standard package checkout..."
          : "Proposal revision requested. Our engineering team will review and update your proposal.",
      });
      // Refresh quotes
      const quotesData = await getCustomerQuotes();
      setQuotes(quotesData.data);
      // Try refresh package requests
      try {
        const prData = await getCustomerPackageRequests();
        setPackageRequestsPayload(prData);
      } catch (_) {}
      
      if (response === "approved") {
        const quoteItem = quotes.find((q) => q.id === id);
        const pkgReqId = (result as any)?.data?.convertedPackageRequestId;
        const tailoredPkgId = (result as any)?.data?.tailoredPackageId || quoteItem?.tailoredPackageId;
        const targetPackageId = tailoredPkgId || pkgReqId || id;
        const packageTitle = quoteItem?.tailoredPackage?.name || `Tailored Solar System (${quoteItem?.recommendedSystemSize ? `${quoteItem.recommendedSystemSize} kW` : "Custom"})`;
        const packagePrice = quoteItem?.estimatedCost || 0;

        // Store active package order for the standard checkout process
        try {
          localStorage.setItem(
            "fortsolar:active_package_order",
            JSON.stringify({
              packageId: targetPackageId,
              packageTitle,
              price: packagePrice,
              image: "/images/custom-solar-package.png",
              quoteId: id,
            })
          );
        } catch (_) {}

        // Navigate to standard package checkout
        router.push(`/checkout?packageId=${encodeURIComponent(targetPackageId)}&quoteId=${encodeURIComponent(id)}`);
      }
    } catch (err) {
      setPageStatus({
        tone: "error",
        message: err instanceof Error ? err.message : "Feedback submission failed.",
      });
    } finally {
      setIsFeedbackSubmittingQuoteId(null);
      setShowRejectionFormQuoteId(null);
    }
  }

  const [isPayingOrderId, setIsPayingOrderId] = useState<string | null>(null);

  async function handlePayOrder(orderId: string) {
    if (isPayingOrderId) return;
    setIsPayingOrderId(orderId);
    setPageStatus({
      tone: "info",
      message: "Initializing payment details...",
    });

    try {
      const paymentPayload = await initializeCustomerOrderPayment(orderId);
      const { accessCode, amountKobo, authorizationUrl, publicKey, reference } =
        paymentPayload.data;

      if (window.PaystackPop?.setup) {
        const handler = window.PaystackPop.setup(
          buildPaystackInlineOptions({
            payment: {
              publicKey,
              amountKobo,
              reference,
              accessCode,
            },
            email: currentUser?.email || "",
            onSuccess: async (nextReference: string) => {
              setPageStatus({
                tone: "info",
                message: "Payment successful. Verifying transaction...",
              });
              setIsVerifyingPayment(true);
              try {
                await verifyCustomerPayment({ reference: nextReference });
                setPageStatus({
                  tone: "success",
                  message: "Your payment has been successfully verified! Order is now paid.",
                });
                // Refresh summary & orders
                const summaryPayload = await getCustomerSummary();
                setSummary(summaryPayload.data);
                const orders = await getCustomerOrders(ordersPage, PAGE_SIZE);
                setOrdersPayload(orders);
              } catch (err) {
                setPageStatus({
                  tone: "error",
                  message: err instanceof Error ? err.message : "Payment verification failed. Please contact support.",
                });
              } finally {
                setIsVerifyingPayment(false);
                setIsPayingOrderId(null);
              }
            },
            onClose: () => {
              setPageStatus({
                tone: "info",
                message: "Payment popup closed.",
              });
              setIsPayingOrderId(null);
            },
          })
        );
        handler.openIframe();
        setPageStatus({
          tone: "info",
          message: "Complete payment in the secure window.",
        });
      } else {
        setPageStatus({
          tone: "info",
          message: "Redirecting to complete payment...",
        });
        window.location.assign(authorizationUrl);
      }
    } catch (error) {
      setPageStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to process payment for this order.",
      });
      setIsPayingOrderId(null);
    }
  }

  const orderSummary = ordersPayload?.summary ?? {
    allOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
  };
  const installationSummary = installationsPayload?.summary ?? {
    activeInstallations: 0,
    pendingApproval: 0,
    completedInstallations: 0,
  };
  const quoteTotalPages = Math.max(1, Math.ceil(quotes.length / QUOTE_PAGE_SIZE));
  const localQuoteRequestsTotalPages = Math.max(
    1,
    Math.ceil(localQuoteRequests.length / LOCAL_QUOTE_PAGE_SIZE),
  );
  const resolvedQuotesPage = Math.min(quotesPage, quoteTotalPages);
  const resolvedLocalQuoteRequestsPage = Math.min(
    localQuoteRequestsPage,
    localQuoteRequestsTotalPages,
  );
  const paginatedQuotes = useMemo(
    () => paginateItems(quotes, resolvedQuotesPage, QUOTE_PAGE_SIZE),
    [quotes, resolvedQuotesPage],
  );
  const paginatedLocalQuoteRequests = useMemo(
    () =>
      paginateItems(
        localQuoteRequests,
        resolvedLocalQuoteRequestsPage,
        LOCAL_QUOTE_PAGE_SIZE,
      ),
    [localQuoteRequests, resolvedLocalQuoteRequestsPage],
  );

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-[#0a0f1d] text-sm text-slate-500 dark:text-slate-400">
        Redirecting to sign in...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] py-20 transition-colors">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />
      <DashboardHeader query={query} onQueryChange={setQuery} />
      <div className="mx-auto mt-20 w-full max-w-6xl px-6 py-6 lg:mt-0">
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-t-3xl border border-[#ECECEC] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 lg:py-10 shadow-xs">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-[#E3E3E3] dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-4xl font-semibold text-[#5B5B5B] dark:text-slate-300">
                {currentUser?.fullName?.charAt(0)?.toUpperCase() ?? "C"}
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#202020] dark:text-white">
                  {[currentUser?.salutation, currentUser?.fullName].filter(Boolean).join(" ") || "Customer User"}
                </p>
                <span className="mt-2 inline-flex items-center rounded-full bg-[#EAF7E8] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-4 py-1 text-sm font-medium text-[#1E8E1E] dark:text-emerald-400">
                  Customer
                </span>
              </div>
            </div>

            <div className="mt-8">
              <ProfileInfoRow
                label="Email"
                value={currentUser?.email ?? "No email available"}
              />
              <ProfileInfoRow
                label="Phone"
                value={currentUser?.phone || "Not added yet"}
              />
              <ProfileInfoRow
                label="Address"
                value={currentUser?.address || "No address yet"}
              />
            </div>

            <div className="mt-8 space-y-3">
              <StatCard label="Package Requests" value={summary.packageRequests} />
              <StatCard
                label="Completed Installations"
                value={summary.completedInstallations}
              />
            </div>

            {isLoadingSummary ? (
              <p className="mt-4 text-sm text-[#7C7C7C] dark:text-slate-400">Refreshing your account summary...</p>
            ) : null}
          </aside>

          <section
            className="rounded-t-3xl border border-[#ECECEC] dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs"
            id="section"
          >
            <div className="flex flex-col gap-6">
              <SmartTabs tabs={tabsWithUnread} activeTab={activeTab} onChange={setActiveTab} />

              {pageStatus ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    pageStatus.tone === "success"
                      ? "bg-[#EAF7E8] text-[#048a05]"
                      : pageStatus.tone === "info"
                        ? "bg-[#EEF5FF] text-[#1D4ED8]"
                        : "bg-[#FDECEC] text-[#C73939]"
                  }`}
                >
                  {pageStatus.message}
                </div>
              ) : null}

              {activeTab === "profile" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#202020] dark:text-white">Personal Details</h2>
                    <p className="text-sm text-[#7C7C7C] dark:text-slate-400">
                      Keep your contact and delivery details up to date.
                    </p>
                  </div>

                  {profileStatus ? (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        profileStatus.tone === "success"
                          ? "bg-[#EAF7E8] text-[#048a05]"
                          : "bg-[#FDECEC] text-[#C73939]"
                      }`}
                    >
                      {profileStatus.message}
                    </div>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="flex flex-col gap-1.5 lg:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                        Title / Salutation Prefix
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                        <select
                          value={profileForm.salutation}
                          onChange={(e) =>
                            setProfileForm((current) => ({
                              ...current,
                              salutation: e.target.value,
                            }))
                          }
                          className="h-12 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium text-[#0F172A] dark:text-slate-100 outline-none transition focus:border-[#048a05] focus:ring-1 focus:ring-[#048a05]"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Doctor (PhD)">Doctor (PhD)</option>
                          <option value="Engr.">Engr.</option>
                          <option value="custom">Other / Custom Title...</option>
                        </select>
                        {profileForm.salutation === "custom" && (
                          <Input
                            value={profileForm.customSalutation}
                            onChange={(e) =>
                              setProfileForm((current) => ({
                                ...current,
                                customSalutation: e.target.value,
                              }))
                            }
                            placeholder="e.g. Prof., Chief, Alhaji, Dr."
                            className="h-12 rounded-xl bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-white"
                          />
                        )}
                      </div>
                    </div>

                    <Input
                      value={profileForm.firstName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                      placeholder="First name"
                      className="h-12 rounded-xl bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-white"
                    />
                    <Input
                      value={profileForm.lastName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                      placeholder="Last name"
                      className="h-12 rounded-xl bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-white"
                    />
                    <Input value={profileForm.email} readOnly className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-slate-300 opacity-80" />
                    <Input
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Phone number"
                      className="h-12 rounded-xl bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-white"
                    />
                    <Input
                      value={profileForm.address}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      placeholder="Delivery address"
                      className="h-12 rounded-xl lg:col-span-2 bg-white dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 text-[#0F172A] dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                      Appearance Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-w-sm">
                      <button
                        type="button"
                        onClick={() => handleThemeChange("light")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all gap-1.5 ${
                          themeMode === "light"
                            ? "border-[#048a05] bg-[#048a05]/10 text-[#048a05] font-semibold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span className="text-lg">☀️</span>
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeChange("dark")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all gap-1.5 ${
                          themeMode === "dark"
                            ? "border-[#048a05] bg-[#048a05]/10 text-[#048a05] font-semibold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span className="text-lg">🌙</span>
                        <span>Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeChange("system")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all gap-1.5 ${
                          themeMode === "system"
                            ? "border-[#048a05] bg-[#048a05]/10 text-[#048a05] font-semibold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span className="text-lg">💻</span>
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Security & Password Section */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-[#048a05] dark:text-emerald-400" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Security &amp; Password
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage your password and safeguard your Fortsolar account.
                    </p>

                    {isGoogleAccount ? (
                      <div className="rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/20 p-5">
                        <div className="flex items-start gap-3.5">
                          <div className="rounded-xl bg-sky-100 dark:bg-sky-900/40 p-2.5 text-sky-600 dark:text-sky-400 shrink-0">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                              Managed by Google Authentication
                            </h4>
                            <p className="mt-1 text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                              You signed in with your Google Account. Your login security, two-factor authentication, and credentials are provided and secured by Google.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-4 max-w-xl">
                        {passwordStatus ? (
                          <div
                            className={`rounded-xl px-4 py-3 text-xs font-medium ${
                              passwordStatus.tone === "success"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#048a05] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                            }`}
                          >
                            {passwordStatus.message}
                          </div>
                        ) : null}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Current Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter your current password"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white shadow-sm focus:border-[#048a05] focus:outline-none focus:ring-1 focus:ring-[#048a05] pr-10"
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            New Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Min 8 chars with upper, lower, number, symbol"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white shadow-sm focus:border-[#048a05] focus:outline-none focus:ring-1 focus:ring-[#048a05] pr-10"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              aria-label={showNewPassword ? "Hide password" : "Show password"}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>

                          {newPassword.length > 0 && (
                            <div className="mt-2.5 space-y-1.5">
                              <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <span
                                  className={`h-full transition-all duration-300 rounded-full ${
                                    passwordStrengthScore <= 2
                                      ? "w-1/3 bg-rose-500"
                                      : passwordStrengthScore <= 4
                                      ? "w-2/3 bg-amber-500"
                                      : "w-full bg-[#048a05]"
                                  }`}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                                <span className={passwordCriteria.length ? "text-[#048a05] dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                                  {passwordCriteria.length ? "✓" : "○"} 8+ characters
                                </span>
                                <span className={passwordCriteria.upper ? "text-[#048a05] dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                                  {passwordCriteria.upper ? "✓" : "○"} Uppercase letter
                                </span>
                                <span className={passwordCriteria.lower ? "text-[#048a05] dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                                  {passwordCriteria.lower ? "✓" : "○"} Lowercase letter
                                </span>
                                <span className={passwordCriteria.number ? "text-[#048a05] dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                                  {passwordCriteria.number ? "✓" : "○"} Number (0-9)
                                </span>
                                <span className={passwordCriteria.special ? "text-[#048a05] dark:text-emerald-400 font-semibold col-span-2" : "text-slate-400 col-span-2"}>
                                  {passwordCriteria.special ? "✓" : "○"} Special character (!@#$%^&*)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Confirm New Password *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter your new password"
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white shadow-sm focus:border-[#048a05] focus:outline-none focus:ring-1 focus:ring-[#048a05] pr-10"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-rose-500 mt-1">Passwords do not match.</p>
                          )}
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            type="submit"
                            disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="rounded-xl bg-[#048a05] hover:bg-[#037004] text-white text-xs font-semibold px-6 py-2.5 cursor-pointer disabled:opacity-50"
                          >
                            {isChangingPassword ? "Updating..." : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        void signOut();
                        router.replace("/");
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 px-5 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition w-full sm:w-auto cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>

                    <Button
                      onClick={handleProfileSave}
                      disabled={isSavingProfile}
                      className="rounded-xl bg-[#048a05] hover:bg-[#037004] px-8 py-3 text-sm font-semibold text-white shadow-sm w-full sm:w-auto"
                    >
                      {isSavingProfile ? "Saving..." : "Save Details"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTab === "quotes" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Quotes</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Track submitted energy assessments, tailored proposals, and quote status.
                    </p>
                  </div>

                    {localQuoteRequests.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Local Quote Requests</h3>
                        {paginatedLocalQuoteRequests.map((quote) => (
                          <div key={quote.createdAt} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  Saved {formatDate(quote.createdAt)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  Preferred contact: {quote.preferredContactMethod}
                                </p>
                              </div>
                              <span className="inline-flex rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                Pending Sync
                              </span>
                            </div>
                            <div className="mt-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                              <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Location:</span> {quote.location || "N/A"}</p>
                              <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Address:</span> {quote.installationAddress || "N/A"}</p>
                              <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Installation requested:</span> {quote.requestInstallation ? "Yes" : "No"}</p>
                              <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Items:</span> {quote.products.map((item) => `${item.title} x${item.quantity ?? 1}`).join(", ")}</p>
                            </div>
                          </div>
                        ))}
                        <PaginationControls
                          className="pt-2"
                          page={resolvedLocalQuoteRequestsPage}
                          totalPages={localQuoteRequestsTotalPages}
                          totalItems={localQuoteRequests.length}
                          onPageChange={setLocalQuoteRequestsPage}
                        />
                      </div>
                    ) : null}

                    {isLoadingQuotes ? (
                      <EmptyState message="Loading your quotes..." />
                    ) : quotes.length === 0 ? (
                      <EmptyState message="No backend quote records were found for this account yet." />
                    ) : (
                      <div className="space-y-4">
                        {paginatedQuotes.map((quote) => (
                          <div key={quote.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{quote.id}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(quote.createdAt)}</p>
                              </div>
                              <span className="inline-flex rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                {humanizeStatus(quote.status)}
                              </span>
                            </div>

                            {/* Offline Contact Banner */}
                            {quote.contactedOffline && (
                              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 text-xs text-emerald-900 dark:text-emerald-300">
                                <span className="text-base leading-none">✓</span>
                                <div>
                                  <strong className="block font-semibold">Contacted &amp; Discussed Offline</strong>
                                  <span className="text-emerald-700 dark:text-emerald-400">
                                    {quote.offlineContactNotes || "Our engineering team contacted you offline to review your site audit, explain the whole process, and tailor this custom system package for your needs."}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Load:</span> <span className="font-semibold text-slate-900 dark:text-white">{quote.energySummary.totalLoad || "N/A"}</span></p>
                                <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Total Watt Hours / Day:</span> <span className="font-semibold text-slate-900 dark:text-white">{quote.energySummary.totalWattHoursPerDay || "N/A"}</span></p>
                                <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Daily Usage:</span> <span className="font-semibold text-slate-900 dark:text-white">{quote.energySummary.dailyUsage || "N/A"}</span></p>
                                <p><span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Monthly Usage:</span> <span className="font-semibold text-slate-900 dark:text-white">{quote.energySummary.monthlyUsage || "N/A"}</span></p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Appliances</p>
                                <div className="flex flex-wrap gap-2">
                                  {quote.appliances.length > 0 ? (
                                    quote.appliances.map((item) => (
                                      <span
                                        key={`${quote.id}-${item}`}
                                        className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-700 dark:text-slate-200 font-medium"
                                      >
                                        {item}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-slate-500 dark:text-slate-400">No appliances supplied.</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {quote.status === "quoted" && (
                              (() => {
                                const validityDays = Number(quote.formExtras?.validity_days) || 14;
                                const createdDate = new Date(quote.updatedAt);
                                const expirationDate = new Date(createdDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
                                const now = new Date();
                                const isExpired = now.getTime() > expirationDate.getTime();
                                const remainingMs = expirationDate.getTime() - now.getTime();
                                const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                                const tp = quote.tailoredPackage || (quote.formExtras?.tailored_package as Record<string, any>) || null;

                                return (
                                  <div className="mt-4 p-5 border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-900/90 shadow-xs space-y-4 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                      <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#048A05] dark:text-emerald-400 block">
                                          Tailored System Package Proposal
                                        </span>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                          {tp?.name || (quote.recommendedSystemSize ? `${quote.recommendedSystemSize} kW Tailored Solar Package` : "Tailored System Package")}
                                        </h4>
                                      </div>
                                      <div className="text-left sm:text-right">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 block">System Investment</span>
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                                          {quote.estimatedCost ? formatCurrency(quote.estimatedCost) : "Custom Estimate"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Tailored Component Specifications */}
                                    {tp ? (
                                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Solar Panels</span>
                                          <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tp.panels || "Tier-1 High-Efficiency Mono Panels"}</p>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Inverter System</span>
                                          <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tp.inverter || "Pure Sine Wave Hybrid Inverter"}</p>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Battery Storage</span>
                                          <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tp.battery || "Deep-Cycle Lithium LiFePO4 Storage"}</p>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold block">Warranty Coverage</span>
                                          <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tp.warranty || "5 Years Comprehensive Warranty"}</p>
                                        </div>
                                      </div>
                                    ) : null}

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">System Size:</span>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{quote.recommendedSystemSize ? `${quote.recommendedSystemSize} kW` : "N/A"}</p>
                                      </div>
                                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Est. Annual Savings:</span>
                                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{quote.estimatedSavings ? formatCurrency(quote.estimatedSavings) : "N/A"}</p>
                                      </div>
                                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Payback Period:</span>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{quote.paybackPeriodYears ? `${quote.paybackPeriodYears} Years` : "N/A"}</p>
                                      </div>
                                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Quote Validity:</span>
                                        <p className={`font-bold text-sm mt-0.5 ${isExpired ? "text-rose-600 dark:text-rose-400" : "text-[#048A05] dark:text-emerald-400"}`}>
                                          {isExpired ? "Expired" : `${remainingDays} days left`}
                                        </p>
                                      </div>
                                    </div>

                                    {quote.adminNotes && (
                                      <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-3 rounded-xl">
                                        <strong className="text-slate-900 dark:text-white">Engineer's Note: </strong> {quote.adminNotes}
                                      </div>
                                    )}

                                    {quote.quoteAssetUrl && (
                                      <div>
                                        <a
                                          href={quote.quoteAssetUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#048A05] dark:text-emerald-400 hover:underline"
                                        >
                                          📄 Download Official Proposal PDF / Spec Sheet
                                        </a>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                      {isExpired ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs">
                                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                                            <span className="text-base">⚠️</span>
                                            <span>This proposal validity window has expired. You can request a refreshed quote with updated component pricing.</span>
                                          </div>
                                          <a
                                            href={`https://wa.me/2348087366156?text=${encodeURIComponent(`Hi Fortsolar, my custom quote #${quote.id.slice(0, 8)} has expired. Could you please refresh it for me?`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 px-3.5 py-2 rounded-lg bg-[#048A05] hover:bg-[#036B04] text-white font-bold text-xs shadow-xs transition text-center"
                                          >
                                            Request Quote Refresh ↗
                                          </a>
                                        </div>
                                      ) : showRejectionFormQuoteId === quote.id ? (
                                        <div className="w-full space-y-2 text-left">
                                          <textarea
                                            className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#048A05]"
                                            placeholder="Enter reasons for revision or change requests..."
                                            value={rejectionNotes[quote.id] || ""}
                                            onChange={(e) => setRejectionNotes(prev => ({ ...prev, [quote.id]: e.target.value }))}
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              onClick={() => setShowRejectionFormQuoteId(null)}
                                              variant="outline"
                                              className="px-3.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={() => handleQuoteFeedback(quote.id, "rejected")}
                                              className="px-3.5 py-1.5 text-xs rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                                              disabled={isFeedbackSubmittingQuoteId === quote.id}
                                            >
                                              Submit Revision Request
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <Button
                                            onClick={() => setShowRejectionFormQuoteId(quote.id)}
                                            className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800/80 rounded-xl w-full sm:w-fit cursor-pointer"
                                            disabled={isFeedbackSubmittingQuoteId === quote.id}
                                          >
                                            Reject &amp; Request Revision
                                          </Button>
                                          <Button
                                            onClick={() => handleQuoteFeedback(quote.id, "approved")}
                                            className="px-5 py-2 text-xs font-semibold text-white bg-[#048A05] hover:bg-[#036B04] rounded-xl w-full sm:w-fit cursor-pointer shadow-xs"
                                            disabled={isFeedbackSubmittingQuoteId === quote.id}
                                          >
                                            {isFeedbackSubmittingQuoteId === quote.id ? "Proceeding to Checkout..." : "Accept & Proceed to Checkout →"}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()
                            )}

                            {(quote.status === "approved" || quote.status === "reviewed") && (
                              <div className="mt-4 p-4 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Proposal Accepted</p>
                                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    Your tailored system package is ready for checkout and installation scheduling.
                                  </p>
                                </div>
                                <Button
                                  onClick={() => {
                                    const tailoredPkgId = quote.tailoredPackageId || quote.convertedPackageRequestId || quote.id;
                                    try {
                                      localStorage.setItem(
                                        "fortsolar:active_package_order",
                                        JSON.stringify({
                                          packageId: tailoredPkgId,
                                          packageTitle: quote.tailoredPackage?.name || "Tailored Solar System",
                                          price: quote.estimatedCost || 0,
                                          image: "/images/custom-solar-package.png",
                                          quoteId: quote.id,
                                        })
                                      );
                                    } catch (_) {}
                                    router.push(`/checkout?packageId=${encodeURIComponent(tailoredPkgId)}&quoteId=${encodeURIComponent(quote.id)}`);
                                  }}
                                  className="px-4 py-2 text-xs font-semibold text-white bg-[#048A05] hover:bg-[#036B04] rounded-xl shrink-0 cursor-pointer shadow-xs"
                                >
                                  Proceed to Checkout →
                                </Button>
                              </div>
                            )}

                            {quote.status === "rejected" && (
                              <div className="mt-4 p-3 border border-rose-200 dark:border-rose-800/50 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
                                Proposal revision requested. Our engineering team has been notified to provide revised specifications.
                              </div>
                            )}
                          </div>
                        ))}
                      <PaginationControls
                        className="pt-2"
                        page={resolvedQuotesPage}
                        totalPages={quoteTotalPages}
                        totalItems={quotes.length}
                        onPageChange={setQuotesPage}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "orders" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Orders</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Review the latest order status, fulfillment progress, and totals.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="All Orders" value={orderSummary.allOrders} />
                    <StatCard
                      label="Processing Orders"
                      value={orderSummary.processingOrders}
                    />
                    <StatCard
                      label="Delivered Orders"
                      value={orderSummary.deliveredOrders}
                    />
                  </div>

                  {isLoadingOrders ? (
                    <EmptyState message="Loading your orders..." />
                  ) : ordersPayload?.data.length ? (
                    <div className="space-y-4">
                      {ordersPayload.data.map((order) => (
                        <div key={order.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {order.orderNumber || (order.id ? `#${order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}` : "Order")}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 text-xs font-semibold text-[#048a05] dark:text-emerald-400">
                                {humanizeStatus(order.displayStatus || order.status)}
                              </span>
                              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                {formatCurrency(order.totalAmount, order.currency || "NGN")}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm lg:grid-cols-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 p-3.5">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">Type</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">{humanizeStatus(order.type)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">Fulfillment</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">{humanizeStatus(order.fulfillmentStatus)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">Quantity</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block">{order.qty}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">Primary Item</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">{order.primaryItemName || "N/A"}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 items-center mt-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#048A05] hover:bg-[#036B04] rounded-lg shadow-xs transition"
                            >
                              Track Order & Live Status →
                            </Link>

                            {order.type === "FINANCING" || (order as any).isFinancing ? (
                              order.status === "completed" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                  Payment Completed (Financed)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                                  Financing Application (Under Review)
                                </span>
                              )
                            ) : order.status === "pending" ? (
                              <Button
                                onClick={() => handlePayOrder(order.id)}
                                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#048A05] hover:bg-[#036B04] rounded-lg cursor-pointer"
                                disabled={isPayingOrderId === order.id}
                              >
                                {isPayingOrderId === order.id ? "Processing Payment..." : `Complete Payment (${formatCurrency(order.totalAmount, order.currency || "NGN")})`}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}

                      <PaginationControls
                        className="pt-2"
                        page={ordersPayload?.pagination.page ?? ordersPage}
                        totalPages={ordersPayload?.pagination.totalPages ?? 1}
                        totalItems={ordersPayload.data.length}
                        onPageChange={setOrdersPage}
                      />
                    </div>
                  ) : (
                    <EmptyState message="No orders were found for this account." />
                  )}
                </div>
              ) : null}

              {activeTab === "installations" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Installations</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Track the progress, schedule, and completion of your solar installations.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      label="Active Installations"
                      value={installationSummary.activeInstallations}
                    />
                    <StatCard
                      label="Completed Installations"
                      value={installationSummary.completedInstallations}
                    />
                  </div>

                  {isLoadingInstallations ? (
                    <EmptyState message="Loading your installations..." />
                  ) : installationsPayload?.data.length ? (
                    <div className="space-y-4">
                      {installationsPayload.data.map((installation) => (
                        <div key={installation.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {installation.packageLabel || "Solar System Installation"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Booked {formatDate(installation.createdAt)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 text-xs font-semibold text-[#048a05] dark:text-emerald-400">
                                  {humanizeStatus(installation.displayStatus || installation.status)}
                                </span>
                                <span className="inline-flex rounded-full bg-[#EAFBEA] dark:bg-[#048A05]/20 border border-[#D4F2D4] dark:border-[#048A05]/40 px-3 py-1 text-xs font-semibold text-[#048A05] dark:text-emerald-300">
                                  Payment: {humanizeStatus(installation.paymentStatus || "Paid")}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {installation.installerName ? `Technician: ${installation.installerName}` : "Technician: Assigned by Fortsolar"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {installation.scheduledDate
                                  ? `Scheduled: ${formatDate(installation.scheduledDate)}`
                                  : "Schedule: In coordination"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>Installation Progress</span>
                              <span className="font-bold text-slate-900 dark:text-white">{installation.progressPercent}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-2 rounded-full bg-[#048a05] transition-all duration-300"
                                style={{ width: `${Math.max(0, Math.min(100, installation.progressPercent))}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void toggleInstallationDetail(installation.id)}
                              className="text-sm font-semibold text-[#048a05] dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {expandedInstallationId === installation.id
                                ? "Hide Installation Detail"
                                : "View Installation Detail"}
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleReportInstallationIssue(installation.id)}
                              className="rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              Report Issue
                            </button>

                            {Boolean(
                              installation.progressPercent >= 100 ||
                                installation.status === "completed" ||
                                (installation.displayStatus && installation.displayStatus.toLowerCase().includes("completed"))
                            ) ? (
                              <a
                                href={FORTSOLAR_GOOGLE_REVIEW_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 transition hover:bg-amber-100/80 cursor-pointer shadow-2xs"
                              >
                                <span>★ Leave a Review on Google</span>
                                <span>↗</span>
                              </a>
                            ) : null}
                          </div>

                          {expandedInstallationId === installation.id &&
                          installationDetails[installation.id] ? (
                            (() => {
                              const details = installationDetails[installation.id] as any;
                              const photos = details?.proofOfWork || [];
                              const locationStr = [details.address, details.city, details.state].filter(Boolean).join(", ");

                              return (
                                <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-5 space-y-5">
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#048a05] dark:text-emerald-400">
                                      Installation Details &amp; Scope
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      Site, technical specifications, and execution schedule.
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">System Package</span>
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        {details.packageLabel || "Residential Solar System"}
                                      </p>
                                      {details.systemSizeKw ? (
                                        <p className="text-xs text-[#048a05] dark:text-emerald-400 font-medium">{details.systemSizeKw} kW Capacity</p>
                                      ) : null}
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Assigned Technician</span>
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        {details.installerName || "Assigned Fortsolar Technician"}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Certified Solar Engineer</p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Installation Site</span>
                                      <p className="font-bold text-slate-900 dark:text-white break-words">
                                        {locationStr || "Address on File"}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Scheduled Date</span>
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        {details.scheduledDate ? formatDate(details.scheduledDate) : "To be scheduled"}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status / Completed</span>
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        {details.completedDate ? formatDate(details.completedDate) : humanizeStatus(details.displayStatus || details.status)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Booked On</span>
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        {formatDate(details.createdAt)}
                                      </p>
                                    </div>
                                  </div>

                                  {photos.length > 0 && (
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Proof of Work Photos</p>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{photos.length} photos uploaded</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {photos.map((p: any) => {
                                          const isVideo =
                                            p.mediaType === "video" ||
                                            p.media_type === "video" ||
                                            /\.(mp4|mov|webm|m4v|avi)$/i.test(p.url || "");
                                          return (
                                            <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-2xs">
                                              {isVideo ? (
                                                <video src={p.url} controls preload="metadata" className="w-full h-32 bg-black object-contain rounded-lg" />
                                              ) : (
                                                <a href={p.url} target="_blank" rel="noreferrer" className="block">
                                                  <img src={p.url} alt={p.type || "Installation proof photo"} className="w-full h-32 object-cover rounded-lg" />
                                                </a>
                                              )}
                                              <div className="p-1.5 text-[11px] text-slate-600 dark:text-slate-300 text-center capitalize font-medium truncate">
                                                {p.caption || (p.type ? `${p.type} ${isVideo ? "Video" : "Photo"}` : "Installation Media")}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : null}
                        </div>
                      ))}

                      <PaginationControls
                        className="pt-2"
                        page={installationsPayload?.pagination.page ?? installationsPage}
                        totalPages={installationsPayload?.pagination.totalPages ?? 1}
                        totalItems={installationsPayload.data.length}
                        onPageChange={setInstallationsPage}
                      />
                    </div>
                  ) : (
                    <EmptyState message="No installations were found for this account." />
                  )}
                </div>
              ) : null}

              {activeTab === "package_requests" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Package Requests</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Review solar package requests connected to your account.
                    </p>
                  </div>

                  {isLoadingPackageRequests ? (
                    <EmptyState message="Loading your package requests..." />
                  ) : packageRequestsPayload?.data.length ? (
                    <div className="space-y-4">
                      {packageRequestsPayload.data.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {request.packageName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {request.requestId} • {formatDate(request.date)}
                              </p>
                            </div>
                            <span className="inline-flex rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                              {humanizeStatus(request.displayStatus || request.status)}
                            </span>
                          </div>
                          {request.financing_requested && (
                            <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Financing Status:</span>
                                <span className={`font-bold uppercase ${
                                  request.financing_status === "approved"
                                    ? "text-[#048A05] dark:text-emerald-400"
                                    : request.financing_status === "rejected"
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-amber-600 dark:text-amber-400"
                                }`}>
                                  {humanizeStatus(request.financing_status || "Pending assessment")}
                                </span>
                              </div>
                              {request.financing_status === "approved" && request.financing_terms && (
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 grid grid-cols-3 gap-2">
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Downpayment:</span>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                                      {formatCurrency(request.financing_terms.downpayment_amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Monthly Installment:</span>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                                      {formatCurrency(request.financing_terms.installment)} / mo
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Tenure:</span>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                                      {request.financing_terms.tenure} Months
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {(request.status === "processing" || (request.financing_requested && request.financing_status === "approved" && request.status === "pending")) ? (
                            <div className="mt-4 flex justify-end">
                              <Button
                                onClick={() => handleAcceptAndPay(request.id)}
                                disabled={isPayingRequestId !== null || isVerifyingPayment}
                                className="rounded-xl bg-[#048a05] hover:bg-[#036B04] px-6 py-2 text-sm font-semibold text-white shadow-xs"
                              >
                                {isPayingRequestId === request.id ? "Processing..." : "Accept & Pay"}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}

                      <PaginationControls
                        className="pt-2"
                        page={packageRequestsPayload?.pagination.page ?? packageRequestsPage}
                        totalPages={packageRequestsPayload?.pagination.totalPages ?? 1}
                        totalItems={packageRequestsPayload.data.length}
                        onPageChange={setPackageRequestsPage}
                      />
                    </div>
                  ) : (
                    <EmptyState message="No package requests were found for this account." />
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
