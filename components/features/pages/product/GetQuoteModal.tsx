"use client";

import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ComboboxField } from "@/components/ui/combobox-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import { getMockCurrentUser, getMockSession } from "@/lib/localAuth";
import type { CatalogId } from "@/types/common.types";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitCustomerQuoteRequest } from "@/lib/customer";

type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
  quantity?: number;
};

type ContactMethod = "Phone Call" | "WhatsApp" | "Email" | "Office Visit";

type QuoteFormState = {
  quantity: number;
  projectType: string;
  installationTimeline: string;
  buildingType: string;
  location: string;
  installationAddress: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  preferredContactMethod: ContactMethod;
  additionalInfo: string;
  agreeToTerms: boolean;
  requestInstallation: boolean;
};

const CONTACT_METHODS: ContactMethod[] = [
  "Phone Call",
  "WhatsApp",
  "Email",
  "Office Visit",
];

const createDefaultState = (product?: QuoteProduct): QuoteFormState => {
  const session = getMockSession();
  const user = getMockCurrentUser();
  const quantity = Math.max(1, Number(product?.quantity) || 1);

  return {
    quantity,
    projectType: "Residential",
    installationTimeline: "Within 2 Weeks",
    buildingType: "Bungalow",
    location: "",
    installationAddress: user?.address ?? "",
    fullName: user?.fullName ?? session?.fullName ?? "",
    email: user?.email ?? session?.email ?? "",
    phone: user?.phone ?? "",
    whatsappNumber: user?.phone ?? "",
    preferredContactMethod: "Phone Call",
    additionalInfo: product
      ? `Requesting quote for ${product.title}.`
      : "Requesting product quote.",
    agreeToTerms: false,
    requestInstallation: true,
  };
};

const GetQuoteModal = ({
  open,
  product,
  products,
  onClose,
}: {
  open: boolean;
  product?: QuoteProduct;
  products?: QuoteProduct[];
  onClose: () => void;
}) => {
  const router = useRouter();
  const quoteProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return product ? [product] : [];
  }, [product, products]);

  const isMultiProductQuote = quoteProducts.length > 1;
  const primaryProduct = quoteProducts[0];

  const [form, setForm] = useState<QuoteFormState>(() => createDefaultState(primaryProduct));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize and reset form when modal opens
  useEffect(() => {
    if (open && primaryProduct) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setErrorMsg(null);
      const base = createDefaultState(primaryProduct);
      if (isMultiProductQuote) {
        setForm({
          ...base,
          additionalInfo: `Requesting quote for ${quoteProducts.length} products in my cart.`,
        });
      } else {
        setForm(base);
      }
    }
  }, [open, primaryProduct, isMultiProductQuote, quoteProducts.length]);

  const totalPrice = useMemo(() => {
    if (!primaryProduct) return 0;
    if (isMultiProductQuote) {
      return quoteProducts.reduce(
        (sum, item) => sum + item.price * Math.max(1, item.quantity ?? 1),
        0
      );
    }
    return primaryProduct.price * form.quantity;
  }, [form.quantity, isMultiProductQuote, primaryProduct, quoteProducts]);

  if (!primaryProduct) return null;

  const canSubmit =
    form.fullName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.location.trim().length > 0 &&
    form.installationAddress.trim().length > 0 &&
    form.agreeToTerms;

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent
          showCloseButton
          className="p-8 sm:max-w-130 rounded-3xl overflow-hidden bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        >
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#048A05] dark:text-emerald-400 ring-4 ring-emerald-500/20 mb-2">
              <CheckCircle2 className="h-10 w-10 animate-bounce text-[#048A05] dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quote Request Submitted!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              We have received your request for a personalized solar quote. Here is what happens next:
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-left">
              Next Steps Checklist
            </h4>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300 text-left">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#048A05] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-through text-slate-400 dark:text-slate-500">Quote request received and logged</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 bg-white dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-300 font-semibold flex-col justify-center">2</div>
                <span>Solar design expert reviews building &amp; load profile</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 bg-white dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-300 font-semibold flex-col justify-center">3</div>
                <span>Initial design and sizing calculations</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5 bg-white dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-300 font-semibold flex-col justify-center">4</div>
                <span>Detailed pricing, savings and quote sent to your email</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <button
              onClick={() => {
                onClose();
                router.push("/settings/quotes");
              }}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#048A05] to-[#168ABD] hover:from-[#037304] hover:to-[#12729D] text-sm font-semibold text-white transition shadow-sm cursor-pointer"
            >
              View My Quotes
            </button>
            <button
              onClick={onClose}
              className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className="p-0 sm:max-w-130 max-h-[90vh] rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
      >
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-slate-900 dark:text-white">
              Ready to Go Solar? Let’s Get Started!
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Please confirm your details and project location so our team can prepare your
              personalized final quote and installation schedule.
            </DialogDescription>
            <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-3 text-xs">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Ready to purchase your hardware today?
              </p>
              <p className="text-emerald-800/90 dark:text-emerald-300/80 text-[11px] mt-0.5 leading-relaxed">
                You do not need to wait for a quote! You can proceed directly to checkout to secure your equipment right away. Fortsolar engineers can coordinate installation upon delivery.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/checkout");
                }}
                className="mt-2 text-xs font-bold text-[#048A05] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Proceed directly to Checkout instead</span>
                <span>→</span>
              </button>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {isMultiProductQuote ? (
            <div className="mt-6 space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              {quoteProducts.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-3"
                >
                  <div
                    className="h-14 w-14 rounded-lg bg-cover bg-center bg-no-repeat bg-[#CFCFCF] dark:bg-slate-700"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">x{Math.max(1, item.quantity ?? 1)}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    ₦{(item.price * Math.max(1, item.quantity ?? 1)).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">₦{totalPrice.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-[56px_1fr_auto_auto] items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              <div
                className="h-14 w-14 rounded-lg bg-cover bg-center bg-no-repeat bg-[#CFCFCF] dark:bg-slate-700"
                style={{ backgroundImage: `url(${primaryProduct.image})` }}
              />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{primaryProduct.title}</p>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    quantity: Math.max(1, Number(event.target.value) || 1),
                  }))
                }
                className="h-9 w-14 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <p className="text-sm font-bold text-slate-900 dark:text-white">₦{totalPrice.toLocaleString()}</p>
            </div>
          )}

          <div className="mt-6 space-y-8">
            <section>
              <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Project Location &amp; Details</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Type</label>
                  <ComboboxField
                    value={form.projectType}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, projectType: value }))}
                    options={["Residential", "Commercial", "Industrial"].map((value) => ({ value, label: value }))}
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-none focus:ring-0"
                    contentClassName="z-120 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Installation Timeline</label>
                  <ComboboxField
                    value={form.installationTimeline}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, installationTimeline: value }))}
                    options={["Within 2 Weeks", "Within 1 Month", "Flexible"].map((value) => ({ value, label: value }))}
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-none focus:ring-0"
                    contentClassName="z-120 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Building Type</label>
                  <ComboboxField
                    value={form.buildingType}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, buildingType: value }))}
                    options={["Bungalow", "Duplex", "Apartment", "Office"].map((value) => ({ value, label: value }))}
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-none focus:ring-0"
                    contentClassName="z-120 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Location <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.location}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="City"
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-white outline-none ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Installation Address <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  value={form.installationAddress}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, installationAddress: event.target.value }))
                  }
                  placeholder="e.g. 24 Admiralty Way, Lekki Phase 1"
                  className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-white outline-none ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </section>

            <section>
              <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Contact Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-white outline-none ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-white outline-none ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone Number <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-white outline-none ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp Number</label>
                  <Input
                    value={form.whatsappNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))
                    }
                    placeholder="+234"
                    className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 text-sm text-slate-900 dark:text-white outline-none ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Preferred Contact Method</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {CONTACT_METHODS.map((method) => {
                  const isActive = form.preferredContactMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, preferredContactMethod: method }))}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                        isActive
                          ? "border-[#048A05] bg-emerald-50 dark:bg-emerald-950/40 text-[#048A05] dark:text-emerald-400 font-semibold"
                          : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      <span className="text-sm font-medium">{method}</span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isActive
                            ? "border-[#048A05] bg-[#048A05]"
                            : "border-slate-400 dark:border-slate-500"
                        }`}
                      >
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Additional Information</h3>
              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Special Requirements / Questions (Optional)
                </label>
                <textarea
                  value={form.additionalInfo}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, additionalInfo: event.target.value }))
                  }
                  placeholder="Tell us about your load, roof type, or specific preferences..."
                  className="min-h-28 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#048A05] transition-colors"
                />
              </div>

              <div className="mt-4 space-y-3">
                <GradientCheckbox
                  checked={form.agreeToTerms}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, agreeToTerms: event.target.checked }))
                  }
                  label="I agree to the terms of service to receive a call/email regarding my quote."
                  labelClassName="text-sm text-slate-700 dark:text-slate-300"
                />
                <GradientCheckbox
                  checked={form.requestInstallation}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, requestInstallation: event.target.checked }))
                  }
                  label="Request Professional Installation"
                  labelClassName="text-sm text-slate-700 dark:text-slate-300"
                />
              </div>
            </section>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-2xl border border-slate-300 dark:border-slate-700 px-8 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmit || isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  setErrorMsg(null);
                  try {
                    const payload = {
                      name: form.fullName,
                      email: form.email,
                      phone: form.phone,
                      location: form.location,
                      address: form.installationAddress,
                      quantity: isMultiProductQuote ? undefined : form.quantity,
                      projectType: form.projectType,
                      installationTimeline: form.installationTimeline,
                      buildingType: form.buildingType,
                      whatsappNumber: form.whatsappNumber,
                      preferredContactMethod: form.preferredContactMethod,
                      additionalInfo: form.additionalInfo,
                      agreeToTerms: form.agreeToTerms,
                      requestInstallation: form.requestInstallation,
                      product: isMultiProductQuote ? undefined : {
                        id: primaryProduct.id,
                        title: primaryProduct.title,
                        image: primaryProduct.image,
                        price: primaryProduct.price,
                        quantity: form.quantity
                      },
                      products: quoteProducts.map((item, index) => ({
                        id: item.id,
                        title: item.title,
                        image: item.image,
                        price: item.price,
                        quantity: isMultiProductQuote
                          ? Math.max(1, item.quantity ?? 1)
                          : index === 0
                            ? form.quantity
                            : Math.max(1, item.quantity ?? 1),
                      }))
                    };

                    await submitCustomerQuoteRequest(payload);
                    setIsSubmitted(true);
                  } catch (error) {
                    setErrorMsg(
                      error instanceof Error
                        ? error.message
                        : "Failed to submit quote request. Please check your network connection and try again."
                    );
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="h-12 rounded-2xl bg-gradient-to-r from-[#048A05] to-[#168ABD] px-8 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin animate-duration-1000" />
                    Submitting...
                  </>
                ) : (
                  "Get My Final Quote"
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GetQuoteModal;
