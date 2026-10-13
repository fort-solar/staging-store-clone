"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  ShieldCheck,
  Check,
  AlertCircle,
  Phone,
  Calendar,
  MapPin,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Camera,
  Package as PackageIcon,
  ChevronRight,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { getCustomerOrderDetail } from "@/lib/customer";
import { cn } from "@/lib/utils";

function humanizeStatus(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value: number | string | null | undefined, currency = "NGN") {
  const num = typeof value === "string" ? parseFloat(value) : Number(value || 0);
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface OrderTrackingClientProps {
  orderId: string;
}

export default function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setIsLoading(true);
      setError(null);
      try {
        const res: any = await getCustomerOrderDetail(orderId);
        if (!cancelled) {
          if (res?.data) {
            setOrder(res.data);
          } else {
            setError("Order details could not be found.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load order details.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (orderId) {
      void loadOrder();
    }

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <DashboardHeader query="" onQueryChange={() => {}} />
        <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-4 pt-28 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#048A05]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Retrieving Order Tracking...</h2>
          <p className="mt-1 text-sm text-gray-500">Checking live status and fulfillment timeline.</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <DashboardHeader query="" onQueryChange={() => {}} />
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 pt-28 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="mt-2 text-sm text-gray-600">{error || "We couldn't retrieve the tracking details for this order."}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/settings/orders")}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              View All Orders
            </button>
            <Link
              href="/"
              className="rounded-xl bg-[#048A05] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#036B04]"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPackage = Boolean(order.isPackageOrder || order.type === "QUOTE");
  const stages = order.stepperStages || [
    { key: "processing", label: "Payment Confirmed", description: "Order confirmed and being prepared.", completed: true, status: "current" },
    { key: "shipped", label: "Equipment Shipped", description: "Package dispatched from warehouse.", completed: false, status: "upcoming" },
    { key: "installer_assigned", label: "Installer Assigned", description: "Technician allocated.", completed: false, status: "upcoming" },
    { key: "installation_in_progress", label: "Installation In Progress", description: "On site wiring & setup.", completed: false, status: "upcoming" },
    { key: "installation_completed", label: "Installation Completed", description: "System verified and commissioned.", completed: false, status: "upcoming" },
  ];

  const activeIndex = order.activeStageIndex ?? 0;
  const progressPercent = Math.min(100, Math.round(((activeIndex + 1) / stages.length) * 100));

  const installation = order.installation;
  const photos = installation?.photos || [];

  const stageIcons: Record<string, React.ReactNode> = {
    processing: <ShieldCheck className="h-5 w-5" />,
    packed: <PackageIcon className="h-5 w-5" />,
    shipped: <Truck className="h-5 w-5" />,
    installer_assigned: <Wrench className="h-5 w-5" />,
    installation_in_progress: <Clock className="h-5 w-5" />,
    installation_completed: <CheckCircle2 className="h-5 w-5" />,
    delivered: <CheckCircle2 className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-gray-900">
      <DashboardHeader query="" onQueryChange={() => {}} />

      <main className="mx-auto max-w-6xl px-4 pt-28">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/settings/orders")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
              title="Back to Orders"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Link href="/" className="hover:text-gray-600">Store</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/settings/orders" className="hover:text-gray-600">My Orders</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-600 font-semibold">{order.orderNumber}</span>
              </div>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Order Tracking & Fulfillment
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {humanizeStatus(order.displayStatus || order.status)}
            </span>
            <a
              href={`https://wa.me/2348000000000?text=${encodeURIComponent(`Hello Fortsolar Support, I have a question regarding my order ${order.orderNumber}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              Need Help?
            </a>
          </div>
        </div>

        {/* Hero Card: Stepper & Real-time Progress */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-950 via-[#034A04] to-emerald-900 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-300">
                  {isPackage ? "Solar Package Installation" : "Retail Product Delivery"}
                </p>
                <h2 className="mt-1 text-xl font-bold sm:text-2xl text-white">
                  {stages[activeIndex]?.label || "Order In Progress"}
                </h2>
                <p className="mt-1 text-sm text-emerald-100/90 max-w-xl">
                  {stages[activeIndex]?.description || "Your order is progressing smoothly through our fulfillment pipeline."}
                </p>
              </div>

              <div className="flex flex-col items-start rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10 sm:items-end">
                <span className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">Overall Progress</span>
                <span className="text-2xl font-black text-white">{progressPercent}%</span>
                <span className="text-xs text-emerald-200/90">Stage {activeIndex + 1} of {stages.length}</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stepper Timeline Bar */}
          <div className="px-6 py-8 sm:px-8">
            <div className="relative">
              {/* Connecting Desktop Line */}
              <div className="absolute top-6 left-8 right-8 hidden h-0.5 bg-gray-200 lg:block -z-0" />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 relative z-10">
                {stages.map((stage: any, index: number) => {
                  const isDone = stage.completed && index < activeIndex;
                  const isCurrent = index === activeIndex;
                  const isUpcoming = index > activeIndex;

                  return (
                    <div key={stage.key} className="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                      <div
                        className={cn(
                          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all shadow-sm",
                          isDone && "bg-[#048A05] text-white",
                          isCurrent && "bg-white text-[#048A05] border-2 border-[#048A05] ring-4 ring-emerald-100 shadow-md",
                          isUpcoming && "bg-gray-100 text-gray-400 border border-gray-200"
                        )}
                      >
                        {isDone ? (
                          <Check className="h-6 w-6 stroke-[2.5]" />
                        ) : isCurrent ? (
                          <div className="relative">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#048A05] animate-ping absolute -top-1 -right-1" />
                            {stageIcons[stage.key] || <Clock className="h-5 w-5" />}
                          </div>
                        ) : (
                          stageIcons[stage.key] || <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>

                      <div className="lg:mt-3">
                        <span
                          className={cn(
                            "inline-block text-xs font-bold uppercase tracking-wider",
                            isDone && "text-[#048A05]",
                            isCurrent && "text-[#048A05] font-extrabold",
                            isUpcoming && "text-gray-400"
                          )}
                        >
                          Step {index + 1}
                        </span>
                        <h3
                          className={cn(
                            "text-sm font-semibold mt-0.5",
                            isCurrent ? "text-gray-900 font-bold" : isDone ? "text-gray-800" : "text-gray-400"
                          )}
                        >
                          {stage.label}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2 max-w-[200px]">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Grid: Details, Technician, Proof Photos */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Left Column (2 Cols) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Assigned Installer Card (If available) */}
            {installation && (
              <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-100/70 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#048A05] text-white shadow-sm">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Assigned Professional</span>
                      <h3 className="text-base font-bold text-gray-900">
                        {installation.installerName || "Certified Solar Technician"}
                      </h3>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <Sparkles className="h-3 w-3" /> Certified
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
                    <span className="block text-gray-400 font-medium">Installation Status</span>
                    <span className="mt-1 font-semibold text-gray-800 capitalize">
                      {humanizeStatus(installation.status || "Scheduled")}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
                    <span className="block text-gray-400 font-medium">Scheduled Date</span>
                    <span className="mt-1 font-semibold text-gray-800">
                      {installation.scheduledDate
                        ? new Date(installation.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "To be confirmed with you"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-2xs">
                    <span className="block text-gray-400 font-medium">Technician Contact</span>
                    {installation.installerPhone ? (
                      <a
                        href={`tel:${installation.installerPhone}`}
                        className="mt-1 inline-flex items-center gap-1 font-semibold text-[#048A05] hover:underline"
                      >
                        <Phone className="h-3 w-3" /> {installation.installerPhone}
                      </a>
                    ) : (
                      <span className="mt-1 text-gray-500">Contact via operations</span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Proof of Work Photo Gallery */}
            {photos.length > 0 && (
              <section className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#048A05]" />
                    <h3 className="text-base font-bold text-gray-900">
                      Installation Proof Photos ({photos.length})
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Uploaded by technician</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {photos.map((photo: any) => (
                    <div
                      key={photo.id}
                      onClick={() => setPreviewPhoto(photo.url)}
                      className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 transition hover:shadow-md"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.description || "Installation Photo"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 transition group-hover:opacity-100 flex items-center justify-center">
                        <Maximize2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="inline-block rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white capitalize backdrop-blur-xs">
                          {photo.photoType || "Proof Photo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Order Items & Specifications */}
            <section className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4">
                Items In This Order
              </h3>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200/70 text-gray-600">
                        <PackageIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} • Unit Price: {formatCurrency(item.unitPrice, order.currency)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(item.lineTotal, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* System Specs breakdown if package */}
              {isPackage && order.shipping?.address && (
                <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200/60 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Installation Location
                  </h4>
                  <p className="text-xs font-medium text-gray-700">
                    {[
                      order.shipping.address.addressLine1 || order.shipping.address.address,
                      order.shipping.address.city,
                      order.shipping.address.state,
                      order.shipping.address.country || "Nigeria",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Timeline & Payment Summary */}
          <div className="space-y-8">
            {/* Payment & Financial Summary Card */}
            <section className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Payment Summary
              </h3>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.totals?.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery & Logistics</span>
                  <span className="font-semibold text-gray-900">
                    {order.totals?.shipping > 0 ? formatCurrency(order.totals.shipping, order.currency) : "Included"}
                  </span>
                </div>
                {order.totals?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied</span>
                    <span className="font-semibold">-{formatCurrency(order.totals.discount, order.currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold text-gray-900">
                  <span>Total Paid</span>
                  <span className="text-emerald-700">{formatCurrency(order.totals?.total, order.currency)}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Payment Verified Successfully</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-800">
                  Transaction secured via Paystack gateway.
                </p>
              </div>
            </section>

            {/* Audit Event Timeline */}
            <section className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Tracking History
              </h3>

              <div className="mt-5 relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {order.timeline?.map((event: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span
                      className={cn(
                        "absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white",
                        event.completed ? "bg-[#048A05]" : "bg-gray-300"
                      )}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{event.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{event.message}</p>
                      {event.at && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(event.at).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Photo Zoom Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt="Installation Full Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
