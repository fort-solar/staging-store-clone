"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Loader2, RefreshCw, Trash2, ShoppingBag, FileText, CreditCard, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  clearAllNotifications,
  deleteNotification,
  getNotificationSocketConfig,
  getNotifications,
  getRealtimeAccessToken,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import type { NotificationRecord } from "@/types/api.types";

const apiOrigin =
  process.env.NEXT_PUBLIC_FORTSOLAR_API_BASE_URL ?? "https://api.fortsolar.ng";

const DISMISSED_STORAGE_KEY = "fortsolar:customer_dismissed_notifications";

function getDismissedNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addDismissedNotificationId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getDismissedNotificationIds();
    ids.add(id);
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function addAllDismissedNotificationIds(idsToAdd: string[]) {
  if (typeof window === "undefined") return;
  try {
    const ids = getDismissedNotificationIds();
    idsToAdd.forEach((id) => ids.add(id));
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(title: string, message: string) {
  const text = `${title} ${message}`.toLowerCase();
  if (text.includes("order") || text.includes("package") || text.includes("shipment") || text.includes("waybill")) {
    return <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (text.includes("quote") || text.includes("audit") || text.includes("proposal")) {
    return <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
  }
  if (text.includes("payment") || text.includes("receipt") || text.includes("finance") || text.includes("payout")) {
    return <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
  }
  return <Bell className="w-4 h-4 text-[#048A05] dark:text-emerald-400" />;
}

export function CustomerNotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivatingBrowserPush, setIsActivatingBrowserPush] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserPushMessage, setBrowserPushMessage] = useState<string | null>(null);
  const [isBrowserPushGranted, setIsBrowserPushGranted] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsBrowserPushGranted(Notification.permission === "granted");
    }
  }, []);

  async function loadNotifications(refresh = false) {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const payload = await getNotifications();
      const dismissed = getDismissedNotificationIds();
      const visible = (payload.data || []).filter((item) => !dismissed.has(item.id));
      setNotifications(visible);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadNotifications(true);
  }, [open]);

  // Real-time socket listener
  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const [socketConfig, tokenPayload, socketClient] = await Promise.all([
          getNotificationSocketConfig(),
          getRealtimeAccessToken(),
          import("socket.io-client"),
        ]);

        if (disposed) return;

        const token = (tokenPayload as any).accessToken || (tokenPayload as any).data?.accessToken;
        if (!token) return;

        const socket = socketClient.io(apiOrigin, {
          path: socketConfig.socketPath,
          transports: ["websocket", "polling"],
          auth: { token },
        });

        const refreshRealtime = (payload?: any) => {
          void loadNotifications(true);
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const title = payload?.title || payload?.data?.title || "Fortsolar Update";
            const body = payload?.message || payload?.data?.message || "You have a new account update.";
            try {
              new Notification(title, { body, icon: "/favicon.ico" });
            } catch {}
          }
        };

        const eventNames = socketConfig.defaultEventNames?.length
          ? socketConfig.defaultEventNames
          : ["notification", "notification:new", "notification:created", "order:status_updated"];

        for (const ev of eventNames) {
          socket.on(ev, refreshRealtime);
        }

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        // Socket connection is non-blocking fallback to REST polling
      }
    })();

    return () => {
      disposed = true;
    };
  }, []);

  async function handleNotificationClick(item: NotificationRecord) {
    if (!item.is_read) {
      setNotifications((current) =>
        current.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
      );
      void markNotificationAsRead(item.id);
    }

    const metadata = item.metadata ?? {};
    const text = `${item.title} ${item.message}`.toLowerCase();

    if (metadata.orderId || metadata.order_id || text.includes("order") || text.includes("waybill") || text.includes("shipment")) {
      setOpen(false);
      router.push("/settings/orders#section");
      return;
    }

    if (metadata.quoteId || metadata.quote_id || text.includes("quote")) {
      setOpen(false);
      router.push("/settings/profile#section");
      return;
    }
  }

  async function handleDismissNotification(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    addDismissedNotificationId(id);
    setNotifications((current) => current.filter((item) => item.id !== id));
    void deleteNotification(id).catch(() => {});
  }

  async function handleMarkAllAsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    try {
      await markAllNotificationsAsRead();
    } catch {
      await Promise.all(
        notifications.filter((n) => !n.is_read).map((n) => markNotificationAsRead(n.id).catch(() => {})),
      );
    }
  }

  async function handleClearAll() {
    setIsClearingAll(true);
    const ids = notifications.map((n) => n.id);
    addAllDismissedNotificationIds(ids);
    setNotifications([]);
    try {
      await clearAllNotifications();
    } catch {
      await markAllNotificationsAsRead().catch(() => {});
    } finally {
      setIsClearingAll(false);
    }
  }

  async function activateBrowserPush() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPushMessage("Browser notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      setBrowserPushMessage("Notifications are blocked in browser permissions.");
      return;
    }

    setIsActivatingBrowserPush(true);
    try {
      let granted = Notification.permission === "granted";
      if (!granted) {
        const perm = await Notification.requestPermission();
        granted = perm === "granted";
      }
      if (granted) {
        setIsBrowserPushGranted(true);
        setBrowserPushMessage("Browser notifications enabled!");
        try {
          new Notification("Fortsolar Notifications Enabled", {
            body: "You will receive real-time order and delivery updates on this device.",
            icon: "/favicon.ico",
          });
        } catch {}
      } else {
        setBrowserPushMessage("Permission was not granted.");
      }
    } finally {
      setIsActivatingBrowserPush(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E11D48] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="p-0 sm:max-w-md max-h-[85vh] rounded-3xl overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Notifications
              </DialogTitle>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-bold text-[#048A05] dark:text-emerald-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void loadNotifications(true)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#048A05] dark:text-emerald-400 hover:underline px-2 py-1 rounded-md"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === "unread"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#048A05]" />
              <p className="mt-2 text-xs">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-500">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadNotifications(true)}
                className="mt-3 text-xs"
              >
                Try again
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {filter === "unread" ? "No unread notifications" : "All caught up!"}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-[240px] mx-auto">
                {filter === "unread"
                  ? "You've read all your notifications."
                  : "Order status updates, shipment tracking, and quote notifications will appear here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => void handleNotificationClick(item)}
                className={`group relative rounded-xl p-3 transition flex items-start gap-3 cursor-pointer ${
                  item.is_read
                    ? "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                    : "bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 text-slate-900 dark:text-slate-100"
                }`}
              >
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                  {getNotificationIcon(item.title, item.message)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold truncate">{item.title}</p>
                    {!item.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#048A05] dark:bg-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {formatTimestamp(item.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => void handleDismissNotification(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded-md transition absolute right-2 top-2"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with Push Permission & Clear all */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          {!isBrowserPushGranted ? (
            <button
              type="button"
              onClick={activateBrowserPush}
              disabled={isActivatingBrowserPush}
              className="text-[11px] font-semibold text-[#048A05] dark:text-emerald-400 hover:underline"
            >
              {isActivatingBrowserPush ? "Enabling..." : "Enable Browser Alerts"}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Alerts active
            </span>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isClearingAll}
              className="text-[11px] text-slate-500 hover:text-red-500 transition"
            >
              {isClearingAll ? "Clearing..." : "Clear all"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
