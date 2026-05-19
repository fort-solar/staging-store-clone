"use client";

import { useMemo, useState } from "react";
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
import { getMockCurrentUser, getMockSession } from "@/lib/localAuth";
import type { CatalogId } from "@/types/common.types";

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

type StoredQuoteRequest = QuoteFormState & {
  createdAt: string;
  product: QuoteProduct;
  products: QuoteProduct[];
};

const QUOTE_REQUESTS_KEY = "fortsolar_quote_requests_v1";

const CONTACT_METHODS: ContactMethod[] = [
  "Phone Call",
  "WhatsApp",
  "Email",
  "Office Visit",
];

const readQuoteRequests = (): StoredQuoteRequest[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUOTE_REQUESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredQuoteRequest[];
  } catch {
    return [];
  }
};

const writeQuoteRequests = (requests: StoredQuoteRequest[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUOTE_REQUESTS_KEY, JSON.stringify(requests));
};

const createDefaultState = (product?: QuoteProduct): QuoteFormState => {
  const session = getMockSession();
  const user = getMockCurrentUser();

  return {
    quantity: 1,
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
  const quoteProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return product ? [product] : [];
  }, [product, products]);

  const isMultiProductQuote = quoteProducts.length > 1;
  const primaryProduct = quoteProducts[0];

  const [form, setForm] = useState<QuoteFormState>(() => {
    const base = createDefaultState(primaryProduct);
    if (isMultiProductQuote) {
      return {
        ...base,
        additionalInfo: `Requesting quote for ${quoteProducts.length} products in my cart.`,
      };
    }
    return base;
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalPrice = useMemo(() => {
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
    form.location.trim().length > 0 &&
    form.installationAddress.trim().length > 0 &&
    form.agreeToTerms;

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
                  <label className="text-sm text-[#3E3F43]">Location</label>
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
                <label className="text-sm text-[#3E3F43]">Installation Address</label>
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
                  <label className="text-sm text-[#3E3F43]">Full Name</label>
                  <Input value={form.fullName} readOnly  className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">Email Address</label>
                  <Input value={form.email} readOnly  className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#3E3F43]">Phone Number</label>
                  <Input value={form.phone} readOnly  className="h-9 w-full rounded-xl bg-[#F2F4F7] px-4 text-sm outline-none ring-0 placeholder:text-[#98A2B3]" />
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
                        ? "border-[#22A128] bg-[#EBFAEB] text-[#058A05]"
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
                <label className="flex items-center gap-3 text-base text-[#3E3F43]">
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, agreeToTerms: event.target.checked }))
                    }
                    className="h-5 w-5 rounded border-[#DADDE2]"
                  />
                  I agree to the terms of service to receive a call/email regarding my quote.
                </label>
                <label className="flex items-center gap-3 text-base text-[#3E3F43]">
                  <input
                    type="checkbox"
                    checked={form.requestInstallation}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, requestInstallation: event.target.checked }))
                    }
                    className="h-5 w-5 rounded border-[#DADDE2]"
                  />
                  Request Installation
                </label>
              </div>
            </section>

            <div className="rounded-2xl border border-[#C5E6C5] bg-[#EBFAEB] p-4">
              <p className="text-2xl font-semibold text-[#058A05]">What happens Next??</p>
              <p className="mt-2 text-sm text-[#556070]">
                Our solar experts will review your request and give you a call back in 24 hours with a detailed quote, including pricing, installation timeline and financing options.
              </p>
            </div>

            {isSubmitted && (
              <p className="rounded-lg bg-[#EBFAEB] px-4 py-3 text-base text-[#058A05]">
                Quote request submitted successfully. We saved it locally for now.
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
                disabled={!canSubmit}
                onClick={() => {
                  const requests = readQuoteRequests();
                  writeQuoteRequests([
                    ...requests,
                    {
                      ...form,
                      product: {
                        ...primaryProduct,
                        quantity: isMultiProductQuote ? primaryProduct.quantity : form.quantity,
                      },
                      products: quoteProducts.map((item, index) => ({
                        ...item,
                        quantity: isMultiProductQuote
                          ? Math.max(1, item.quantity ?? 1)
                          : index === 0
                            ? form.quantity
                            : Math.max(1, item.quantity ?? 1),
                      })),
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                  setIsSubmitted(true);
                  window.setTimeout(() => {
                    onClose();
                  }, 700);
                }}
                className="h-12 rounded-2xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-8 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Get My Final Quote
              </button>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
};

export default GetQuoteModal;
