"use client";

import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          className="p-8 sm:max-w-130 rounded-3xl overflow-hidden"
        >
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand ring-4 ring-brand-soft/50 mb-2">
              <CheckCircle2 className="h-10 w-10 animate-bounce text-brand" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Quote Request Submitted!</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              We have received your request for a personalized solar quote. Here is what happens next:
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
              Next Steps Checklist
            </h4>
            <ul className="space-y-3 text-sm text-slate-600 text-left">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                <span className="line-through text-slate-400">Quote request received and logged</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 bg-white text-[10px] text-slate-400 font-semibold flex-col justify-center">2</div>
                <span>Solar design expert reviews building & load profile</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 bg-white text-[10px] text-slate-400 font-semibold flex-col justify-center">3</div>
                <span>Initial design and sizing calculations</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 bg-white text-[10px] text-slate-400 font-semibold flex-col justify-center">4</div>
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
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              View My Quotes
            </button>
            <button
              onClick={onClose}
              className="h-12 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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
        className="p-0 sm:max-w-130 max-h-[90vh] rounded-3xl overflow-hidden"
      >
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-[#101828]">
              Ready to Go Solar? Let’s Get Started!
            </DialogTitle>
            <DialogDescription className="text-sm text-[#667085]">
              Please confirm your details and project location so our team can prepare your
              personalized final quote and installation schedule.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {isMultiProductQuote ? (
            <div className="mt-6 space-y-2 rounded-xl border border-[#E5E7EB] p-3">
              {quoteProducts.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-3"
                >
                  <div
                    className="h-14 w-14 rounded-lg bg-cover bg-center bg-no-repeat bg-[#CFCFCF]"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <p className="text-sm font-semibold text-[#3E3F43]">{item.title}</p>
                  <p className="text-sm text-[#556070]">x{Math.max(1, item.quantity ?? 1)}</p>
                  <p className="text-sm font-semibold text-[#3E3F43]">
                    ₦{(item.price * Math.max(1, item.quantity ?? 1)).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-end border-t border-[#E5E7EB] pt-2">
                <p className="text-sm font-bold text-[#3E3F43]">₦{totalPrice.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-[56px_1fr_auto_auto] items-center gap-3 rounded-xl border border-[#E5E7EB] p-3">
              <div
                className="h-14 w-14 rounded-lg bg-cover bg-center bg-no-repeat bg-[#CFCFCF]"
                style={{ backgroundImage: `url(${primaryProduct.image})` }}
              />
              <p className="text-sm font-semibold text-[#3E3F43]">{primaryProduct.title}</p>
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
                className="h-9 w-14"
              />
              <p className="text-sm font-bold text-[#3E3F43]">₦{totalPrice.toLocaleString()}</p>
            </div>
          )}

          <div className="mt-6 space-y-8">
            <section>
              <h3 className="text-[18px] font-bold text-[#3E3F43]">Project Location &amp; Details</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">Project Type</label>
                  <Select
                    value={form.projectType}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, projectType: value }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-[#F2F4F7] border-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-120">
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">Installation Timeline</label>
                  <Select
                    value={form.installationTimeline}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, installationTimeline: value }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-[#F2F4F7] border-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-120">
                      <SelectItem value="Within 2 Weeks">Within 2 Weeks</SelectItem>
                      <SelectItem value="Within 1 Month">Within 1 Month</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">Building Type</label>
                  <Select
                    value={form.buildingType}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, buildingType: value }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-[#F2F4F7] border-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-120">
                      <SelectItem value="Bungalow">Bungalow</SelectItem>
                      <SelectItem value="Duplex">Duplex</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">
                    Location <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.location}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="City"
                    className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm text-[#3E3F43]">
                  Installation Address <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  value={form.installationAddress}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, installationAddress: event.target.value }))
                  }
                  placeholder="No 24,"
                  className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]"
                />
              </div>
            </section>

            <section>
              <h3 className="text-[18px] font-bold text-[#3E3F43]">Contact Information</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">
                    Full Name <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">
                    Email Address <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">
                    Phone Number <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">Whatsapp Number</label>
                  <Input
                    value={form.whatsappNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))
                    }
                    placeholder="+234"
                    className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[18px] font-bold text-[#3E3F43]">Preferred Contact Method</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {CONTACT_METHODS.map((method) => {
                  const isActive = form.preferredContactMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, preferredContactMethod: method }))}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left ${isActive
                        ? "border-[#22A128] bg-[#EBFAEB] text-[#048A05]"
                        : "border-[#DADDE2] bg-[#F3F4F6] text-[#3E3F43]"
                        }`}
                    >
                      <span className="text-base font-medium">{method}</span>
                      <span className={`h-4 w-4 rounded-full border ${isActive ? "border-[#22A128] bg-[#22A128]" : "border-[#737373]"}`} />
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-[18px] font-bold text-[#3E3F43]">Additional Information</h3>
              <div className="mt-3 space-y-2">
                <label className="text-sm text-[#3E3F43]">Special Requirements/ Questions (Optional)</label>
                <textarea
                  value={form.additionalInfo}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, additionalInfo: event.target.value }))
                  }
                  placeholder="Spec....."
                  className="min-h-28 w-full rounded-xl border border-[#DADDE2] bg-[#F3F4F6] px-4 py-3 text-base text-[#3E3F43] outline-none"
                />
              </div>

              <div className="mt-4 space-y-3">
                <GradientCheckbox
                  checked={form.agreeToTerms}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, agreeToTerms: event.target.checked }))
                  }
                  label="I agree to the terms of service to receive a call/email regarding my quote."
                  labelClassName="text-base text-[#3E3F43]"
                />
                <GradientCheckbox
                  checked={form.requestInstallation}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, requestInstallation: event.target.checked }))
                  }
                  label="Request Installation"
                  labelClassName="text-base text-[#3E3F43]"
                />
              </div>
            </section>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-2xl border border-[#AEB2B8] px-8 text-sm font-medium text-[#20252C]"
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
                className="h-12 rounded-2xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] px-8 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
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
