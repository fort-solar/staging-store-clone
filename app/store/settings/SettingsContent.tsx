"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useAuth } from "@/components/auth/auth-provider";
import { createLoginRedirectHref } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/ui/pagination-controls";
import { SmartTabs, type TabKey } from "@/lib/smartTabs";
import { getNotifications } from "@/lib/notifications";
import {
  approveCustomerInstallation,
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
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
    return <span className="text-sm text-[#9A9A9A]">N/A</span>;
  }

  if (Array.isArray(value) || isRecord(value)) {
    return (
      <pre className="overflow-x-auto rounded-xl bg-[#F7F8FA] p-3 text-xs text-[#404040]">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span className="text-sm text-[#202020]">{String(value)}</span>;
}

function ProfileInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#F0F0F0] py-3 text-sm">
      <span className="text-[#7C7C7C]">{label}</span>
      <span className="font-medium text-[#202020]">{value}</span>
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
    <div className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] p-4">
      <p className="text-xs text-[#5B5B5B]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#202020]">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#E4E9EC] bg-[#FAFAFA] px-6 py-10 text-center text-sm text-[#5A646B]">
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
  const { session, isRefreshing, isSigningOut } = useAuth();
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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
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

    setProfileForm({
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
      address: currentUser?.address ?? "",
    });
  }, [currentUser?.address, currentUser?.email, currentUser?.fullName, currentUser?.phone]);

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

    try {
      await updateCurrentUserProfile({
        name: fullName,
        phone: profileForm.phone,
        address: profileForm.address,
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
          message: "Order generated. Complete payment in the Paystack popup.",
        });
      } else {
        setPageStatus({
          tone: "info",
          message: "Redirecting to Paystack to complete payment...",
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
        ? "Accepting proposal and generating package request..."
        : "Submitting rejection feedback...",
    });

    try {
      await submitCustomerQuoteFeedback(id, { response, feedback: note });
      setPageStatus({
        tone: "success",
        message: response === "approved"
          ? "Proposal accepted! Check the 'Package Requests' tab to complete deposit payment."
          : "Proposal rejected successfully. Our engineers will follow up soon.",
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
        router.push("/settings/package-requests");
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
          message: "Complete payment in the Paystack popup.",
        });
      } else {
        setPageStatus({
          tone: "info",
          message: "Redirecting to Paystack to complete payment...",
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
      <div className="grid min-h-screen place-items-center bg-white text-sm text-[#5A646B]">
        Redirecting to sign in...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-20">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />
      <DashboardHeader query={query} onQueryChange={setQuery} />
      <div className="mx-auto mt-20 w-full max-w-6xl px-6 py-6 lg:mt-0">
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-t-3xl border border-[#ECECEC] bg-white p-6 lg:py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-[#E3E3E3] bg-[#F3F4F6] text-4xl font-semibold text-[#5B5B5B]">
                {currentUser?.fullName?.charAt(0)?.toUpperCase() ?? "C"}
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#202020]">
                  {currentUser?.fullName ?? "Customer User"}
                </p>
                <span className="mt-2 inline-flex items-center rounded-full bg-[#EAF7E8] px-4 py-1 text-sm font-medium text-[#1E8E1E]">
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
              <p className="mt-4 text-sm text-[#7C7C7C]">Refreshing your account summary...</p>
            ) : null}
          </aside>

          <section
            className="rounded-t-3xl border border-[#ECECEC] bg-white p-6 sm:p-8"
            id="section"
          >
            <div className="flex flex-col gap-6">
              <SmartTabs tabs={tabsWithUnread} activeTab={activeTab} onChange={setActiveTab} />

              {pageStatus ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    pageStatus.tone === "success"
                      ? "bg-[#EAF7E8] text-[#168416]"
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
                    <h2 className="text-2xl font-semibold text-[#202020]">Personal Details</h2>
                    <p className="text-sm text-[#7C7C7C]">
                      Keep your contact and delivery details up to date.
                    </p>
                  </div>

                  {profileStatus ? (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        profileStatus.tone === "success"
                          ? "bg-[#EAF7E8] text-[#168416]"
                          : "bg-[#FDECEC] text-[#C73939]"
                      }`}
                    >
                      {profileStatus.message}
                    </div>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Input
                      value={profileForm.firstName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                      placeholder="First name"
                      className="h-12 rounded-xl"
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
                      className="h-12 rounded-xl"
                    />
                    <Input value={profileForm.email} readOnly className="h-12 rounded-xl" />
                    <Input
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Phone number"
                      className="h-12 rounded-xl"
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
                      className="h-12 rounded-xl lg:col-span-2"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleProfileSave}
                      disabled={isSavingProfile}
                      className="rounded-xl bg-[#1D9A1D] px-8 py-6 text-base font-semibold text-white hover:bg-[#168416] lg:w-fit w-full"
                    >
                      {isSavingProfile ? "Saving..." : "Save Details"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTab === "quotes" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#202020]">My Quotes</h2>
                    <p className="text-sm text-[#7C7C7C]">
                      Track submitted energy assessments and quote requests.
                    </p>
                  </div>

                  {localQuoteRequests.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#202020]">Pending Local Quote Requests</h3>
                      {paginatedLocalQuoteRequests.map((quote) => (
                        <div key={quote.createdAt} className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] p-5">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-[#202020]">
                                Saved {formatDate(quote.createdAt)}
                              </p>
                              <p className="text-xs text-[#7C7C7C]">
                                Preferred contact: {quote.preferredContactMethod}
                              </p>
                            </div>
                            <span className="inline-flex rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-medium text-[#B26B00]">
                              Pending Sync
                            </span>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-[#404040]">
                            <p>Location: {quote.location || "N/A"}</p>
                            <p>Installation address: {quote.installationAddress || "N/A"}</p>
                            <p>Installation requested: {quote.requestInstallation ? "Yes" : "No"}</p>
                            <p>Items: {quote.products.map((item) => `${item.title} x${item.quantity ?? 1}`).join(", ")}</p>
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
                        <div key={quote.id} className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-[#202020]">{quote.id}</p>
                              <p className="text-xs text-[#7C7C7C]">{formatDate(quote.createdAt)}</p>
                            </div>
                            <span className="inline-flex rounded-full bg-[#E8F4FF] px-3 py-1 text-xs font-medium text-[#2A7DD1]">
                              {humanizeStatus(quote.status)}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2 text-sm text-[#404040]">
                              <p>Total Load: {quote.energySummary.totalLoad || "N/A"}</p>
                              <p>Total Watt Hours / Day: {quote.energySummary.totalWattHoursPerDay || "N/A"}</p>
                              <p>Daily Usage: {quote.energySummary.dailyUsage || "N/A"}</p>
                              <p>Monthly Usage: {quote.energySummary.monthlyUsage || "N/A"}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-[#202020]">Appliances</p>
                              <div className="flex flex-wrap gap-2">
                                {quote.appliances.length > 0 ? (
                                  quote.appliances.map((item) => (
                                    <span
                                      key={`${quote.id}-${item}`}
                                      className="rounded-full bg-white px-3 py-1 text-xs text-[#5B5B5B]"
                                    >
                                      {item}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-[#7C7C7C]">No appliances supplied.</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {quote.status === "quoted" && (
                            (() => {
                              const validityDays = Number(quote.formExtras?.validity_days) || 7;
                              const createdDate = new Date(quote.updatedAt);
                              const expirationDate = new Date(createdDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
                              const now = new Date();
                              const isExpired = now.getTime() > expirationDate.getTime();
                              const remainingMs = expirationDate.getTime() - now.getTime();
                              const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

                              return (
                                <div className="mt-4 p-4 border border-[#EAECF0] rounded-xl bg-white space-y-3">
                                  <h4 className="text-sm font-semibold text-[#101828]">Proposal Details</h4>
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <span className="text-[#7C7C7C]">Custom System Sizing:</span>
                                      <p className="font-semibold text-sm text-[#202020]">{quote.recommendedSystemSize ? `${quote.recommendedSystemSize} kW` : "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-[#7C7C7C]">Price Quote:</span>
                                      <p className="font-semibold text-sm text-[#202020]">{quote.estimatedCost ? formatCurrency(quote.estimatedCost) : "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-[#7C7C7C]">Est. Payback Period:</span>
                                      <p className="font-semibold text-sm text-[#202020]">{quote.paybackPeriodYears ? `${quote.paybackPeriodYears} Years` : "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-[#7C7C7C]">Quote Validity:</span>
                                      <p className={`font-semibold text-sm ${isExpired ? "text-[#E11D48]" : "text-[#048A05]"}`}>
                                        {isExpired ? "Expired" : `${remainingDays} days remaining`}
                                      </p>
                                    </div>
                                  </div>
                                  {quote.adminNotes && (
                                    <div className="mt-2 text-xs text-[#5A646B] bg-gray-50 p-2 rounded-lg">
                                      <strong>Designer's Note: </strong> {quote.adminNotes}
                                    </div>
                                  )}
                                  {quote.quoteAssetUrl && (
                                    <a
                                      href={quote.quoteAssetUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#048A05] hover:underline pt-1"
                                    >
                                      Download Official Proposal PDF / Document
                                    </a>
                                  )}

                                  <div className="mt-4 pt-4 border-t border-[#EAECF0] flex flex-col gap-2 sm:flex-row sm:justify-end">
                                    {isExpired ? (
                                      <p className="text-xs text-[#B26B00] italic">This proposal is expired. Please contact support to request a reissue.</p>
                                    ) : (
                                      <>
                                        {showRejectionFormQuoteId === quote.id ? (
                                          <div className="w-full space-y-2 text-left">
                                            <textarea
                                              className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#048A05]"
                                              placeholder="Enter reason for rejection or request revisions..."
                                              value={rejectionNotes[quote.id] || ""}
                                              onChange={(e) => setRejectionNotes(prev => ({ ...prev, [quote.id]: e.target.value }))}
                                            />
                                            <div className="flex gap-2 justify-end">
                                              <Button
                                                onClick={() => setShowRejectionFormQuoteId(null)}
                                                variant="outline"
                                                className="px-3 py-1.5 text-xs rounded-lg bg-white text-gray-700"
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                onClick={() => handleQuoteFeedback(quote.id, "rejected")}
                                                className="px-3 py-1.5 text-xs rounded-lg bg-[#E11D48] text-white hover:bg-[#BE123C]"
                                                disabled={isFeedbackSubmittingQuoteId === quote.id}
                                              >
                                                Submit Rejection
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <Button
                                              onClick={() => setShowRejectionFormQuoteId(quote.id)}
                                              className="px-4 py-2 text-xs font-semibold border border-gray-200 text-[#475467] hover:bg-gray-50 bg-white rounded-lg w-full sm:w-fit"
                                              disabled={isFeedbackSubmittingQuoteId === quote.id}
                                            >
                                              Reject & Request Revision
                                            </Button>
                                            <Button
                                              onClick={() => handleQuoteFeedback(quote.id, "approved")}
                                              className="px-4 py-2 text-xs font-semibold text-white bg-[#048A05] hover:bg-[#036B04] rounded-lg w-full sm:w-fit"
                                              disabled={isFeedbackSubmittingQuoteId === quote.id}
                                            >
                                              Accept Proposal
                                            </Button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
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
                    <h2 className="text-2xl font-semibold text-[#202020]">My Orders</h2>
                    <p className="text-sm text-[#7C7C7C]">
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
                        <div key={order.id} className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-[#202020]">
                                {order.orderNumber || order.id}
                              </p>
                              <p className="text-xs text-[#7C7C7C]">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex rounded-full bg-[#EAF7E8] px-3 py-1 text-xs font-medium text-[#168416]">
                                {humanizeStatus(order.displayStatus || order.status)}
                              </span>
                              <p className="mt-2 text-lg font-semibold text-[#202020]">
                                {formatCurrency(order.totalAmount, order.currency || "NGN")}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 text-sm text-[#404040] lg:grid-cols-4">
                            <p>Type: {humanizeStatus(order.type)}</p>
                            <p>Fulfillment: {humanizeStatus(order.fulfillmentStatus)}</p>
                            <p>Quantity: {order.qty}</p>
                            <p>Primary Item: {order.primaryItemName || "N/A"}</p>
                          </div>

                          <div className="flex gap-4 items-center mt-4">
                            <button
                              type="button"
                              onClick={() => void toggleOrderDetail(order.id)}
                              className="text-sm font-semibold text-[#168416]"
                            >
                              {expandedOrderId === order.id ? "Hide Order Detail" : "View Order Detail"}
                            </button>

                            {order.status === "pending" && (
                              <Button
                                onClick={() => handlePayOrder(order.id)}
                                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#048A05] hover:bg-[#036B04] rounded-lg"
                                disabled={isPayingOrderId === order.id}
                              >
                                {isPayingOrderId === order.id ? "Processing Payment..." : "Pay Order Deposit"}
                              </Button>
                            )}
                          </div>

                          {expandedOrderId === order.id && orderDetails[order.id] ? (
                            <div className="mt-4 rounded-2xl bg-[#FAFAFA] p-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                {Object.entries(orderDetails[order.id]).map(([key, value]) => (
                                  <div key={key} className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7C7C7C]">
                                      {humanizeStatus(key)}
                                    </p>
                                    <DetailValue value={value} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
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
                    <h2 className="text-2xl font-semibold text-[#202020]">My Installations</h2>
                    <p className="text-sm text-[#7C7C7C]">
                      Follow installation progress and respond to approvals or issues.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Active Installations"
                      value={installationSummary.activeInstallations}
                    />
                    <StatCard
                      label="Pending Approval"
                      value={installationSummary.pendingApproval}
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
                        <div key={installation.id} className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-[#202020]">
                                {installation.packageLabel}
                              </p>
                              <p className="text-xs text-[#7C7C7C]">
                                Created {formatDate(installation.createdAt)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full bg-[#EAF7E8] px-3 py-1 text-xs font-medium text-[#168416]">
                                  {humanizeStatus(installation.displayStatus || installation.status)}
                                </span>
                                <span className="inline-flex rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-medium text-[#1D4ED8]">
                                  {humanizeStatus(installation.paymentStatus)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-[#7C7C7C]">
                                Installer: {installation.installerName || "Unassigned"}
                              </p>
                              <p className="text-lg font-semibold text-[#202020]">
                                {formatCurrency(installation.totalCost)}
                              </p>
                              <p className="text-xs text-[#7C7C7C]">
                                Approval: {humanizeStatus(installation.customerApprovalStatus)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-[#7C7C7C]">
                              <span>Progress</span>
                              <span>{installation.progressPercent}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-[#E9EEF1]">
                              <div
                                className="h-2 rounded-full bg-[#168ABD]"
                                style={{ width: `${Math.max(0, Math.min(100, installation.progressPercent))}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => void toggleInstallationDetail(installation.id)}
                              className="text-sm font-semibold text-[#168416]"
                            >
                              {expandedInstallationId === installation.id
                                ? "Hide Installation Detail"
                                : "View Installation Detail"}
                            </button>

                            {installation.requiresApproval ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleApproveInstallation(installation.id)}
                                  className="rounded-xl bg-[#1D9A1D] px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Approve Installation
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleReportInstallationIssue(installation.id)}
                                  className="rounded-xl border border-[#BEBEBE] px-4 py-2 text-sm font-semibold text-[#202020]"
                                >
                                  Report Issue
                                </button>
                              </>
                            ) : null}
                          </div>

                          {expandedInstallationId === installation.id &&
                          installationDetails[installation.id] ? (
                            <div className="mt-4 rounded-2xl bg-[#FAFAFA] p-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                {Object.entries(installationDetails[installation.id])
                                  .filter(([key]) => key !== "proofOfWork" && key !== "id" && key !== "requiresApproval")
                                  .map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7C7C7C]">
                                        {humanizeStatus(key)}
                                      </p>
                                      <DetailValue value={value} />
                                    </div>
                                  ))}

                                {(() => {
                                  const details = installationDetails[installation.id] as any;
                                  const photos = details?.proofOfWork || [];
                                  if (!photos.length) return null;
                                  return (
                                    <div className="mt-4 border-t border-gray-200 pt-4 col-span-2 space-y-3">
                                      <p className="text-sm font-semibold text-[#202020]">Proof of Work Photos</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {photos.map((p: any) => (
                                          <div key={p.id} className="rounded-lg overflow-hidden border border-gray-200 bg-white p-1">
                                            <img src={p.url} alt={p.type || "photo"} className="w-full h-24 object-cover rounded-md" />
                                            <div className="p-1 mt-1 text-[10px] text-[#7C7C7C] text-center capitalize font-medium">
                                              {p.type} Photo
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
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
                    <h2 className="text-2xl font-semibold text-[#202020]">Package Requests</h2>
                    <p className="text-sm text-[#7C7C7C]">
                      Review bundle and package requests connected to your account.
                    </p>
                  </div>

                  {isLoadingPackageRequests ? (
                    <EmptyState message="Loading your package requests..." />
                  ) : packageRequestsPayload?.data.length ? (
                    <div className="space-y-4">
                      {packageRequestsPayload.data.map((request) => (
                        <div key={request.id} className="rounded-2xl border border-[#E7E7E7] bg-white p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-[#202020]">
                                {request.packageName}
                              </p>
                              <p className="text-xs text-[#7C7C7C]">
                                {request.requestId} • {formatDate(request.date)}
                              </p>
                            </div>
                            <span className="inline-flex rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-medium text-[#1D4ED8]">
                              {humanizeStatus(request.displayStatus || request.status)}
                            </span>
                          </div>
                          {request.financing_requested && (
                            <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs border border-[#E7E7E7] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#5A646B]">Financing Status:</span>
                                <span className={`font-bold uppercase ${
                                  request.financing_status === "approved"
                                    ? "text-[#048A05]"
                                    : request.financing_status === "rejected"
                                      ? "text-[#E11D48]"
                                      : "text-amber-500"
                                }`}>
                                  {humanizeStatus(request.financing_status || "Pending assessment")}
                                </span>
                              </div>
                              {request.financing_status === "approved" && request.financing_terms && (
                                <div className="border-t border-gray-200 pt-2 grid grid-cols-3 gap-2">
                                  <div>
                                    <span className="text-[#7C7C7C]">Downpayment:</span>
                                    <p className="font-semibold text-sm text-[#202020]">
                                      {formatCurrency(request.financing_terms.downpayment_amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[#7C7C7C]">Monthly Installment:</span>
                                    <p className="font-semibold text-sm text-[#202020]">
                                      {formatCurrency(request.financing_terms.installment)} / mo
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[#7C7C7C]">Tenure:</span>
                                    <p className="font-semibold text-sm text-[#202020]">
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
                                className="rounded-xl bg-[#1D9A1D] px-6 py-2 text-sm font-semibold text-white hover:bg-[#168416]"
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
