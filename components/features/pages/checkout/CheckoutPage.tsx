"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import { Input } from "@/components/ui/input";
import { NigeriaLocationFields } from "@/components/ui/nigeria-location-fields";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import {
  clearCustomerCart,
  createCustomerOrder,
  initializeCustomerOrderPayment,
  verifyCustomerPayment,
  uploadFile,
  getDraftOrder,
  saveDraftOrder,
  getFinancingSettings,
  submitCustomerQuoteRequest,
} from "@/lib/customer";
import { sessionSnapshotToMockUser } from "@/lib/localAuth";
import {
  buildPaystackInlineOptions,
  isCheckoutDisabledState,
  verifyCheckoutPaymentFlow,
  type CheckoutAddress,
  type CheckoutItem,
} from "@/lib/checkout";
import {
  useStorePackagesByIds,
  useStoreProductsByIds,
} from "@/lib/store-catalog";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CatalogId } from "@/types/common.types";

type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
  quantity?: number;
};

type AddressFormState = CheckoutAddress;

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const EMPTY_ADDRESS: AddressFormState = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  country: "Nigeria",
};

function getOrderId(value: Record<string, unknown>) {
  const candidates = [
    value.id,
    value.orderId,
    typeof value.order === "object" && value.order !== null
      ? (value.order as Record<string, unknown>).id
      : null,
  ];

  return candidates.find((item): item is string => typeof item === "string" && item.length > 0) ?? null;
}

const CheckoutPage = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { isRefreshing, requireCustomerLogin } = useCustomerLoginGate();
  const currentUser = useMemo(() => sessionSnapshotToMockUser(session), [session]);
  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  const [requestFinancing, setRequestFinancing] = useState(false);
  const [notes, setNotes] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const cartItems = useGeneralStore((state) => state.cartItems);
  const replaceCart = useGeneralStore((state) => state.replaceCart);
  const productIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "product").map((item) => item.id),
    [cartItems],
  );
  const packageIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "package").map((item) => item.id),
    [cartItems],
  );
  const { items: products } = useStoreProductsByIds(productIds);
  const { items: packages } = useStorePackagesByIds(packageIds);
  const productMap = useMemo(
    () => new Map(products.map((item) => [String(item.id), item])),
    [products],
  );
  const packageMap = useMemo(
    () => new Map(packages.map((item) => [String(item.id), item])),
    [packages],
  );

  const [shippingAddress, setShippingAddress] = useState<AddressFormState>(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState<AddressFormState>(EMPTY_ADDRESS);

  // Load draft from localStorage on mount, and backend if logged in
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [draftPayload, setDraftPayload] = useState<any>(null);

  // Define installation states
  const [requestInstallation, setRequestInstallation] = useState(false);
  const [installationType, setInstallationType] = useState("");
  const [roofType, setRoofType] = useState("metal");
  const [shading, setShading] = useState("none");
  const [roofSize, setRoofSize] = useState("");
  const [roofOrientation, setRoofOrientation] = useState("flat");
  const [monthlyBill, setMonthlyBill] = useState("");
  const [dailyUsageKwh, setDailyUsageKwh] = useState("");

  // Define financing calculator states
  const [downpaymentPct, setDownpaymentPct] = useState(30);
  const [tenureMonths, setTenureMonths] = useState(12);

  // Profile type and BVN/Legal consent
  const [profileType, setProfileType] = useState<"individual" | "salary_earner" | "business">("individual");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [bvnConsent, setBvnConsent] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);

  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [govIdUploadId, setGovIdUploadId] = useState<string | null>(null);
  const [isUploadingGovId, setIsUploadingGovId] = useState(false);
  const [govIdProgress, setGovIdProgress] = useState<number | null>(null);
  const [govIdError, setGovIdError] = useState<string | null>(null);

  const [utilityBillFile, setUtilityBillFile] = useState<File | null>(null);
  const [utilityBillUploadId, setUtilityBillUploadId] = useState<string | null>(null);
  const [isUploadingUtilityBill, setIsUploadingUtilityBill] = useState(false);
  const [utilityBillProgress, setUtilityBillProgress] = useState<number | null>(null);
  const [utilityBillError, setUtilityBillError] = useState<string | null>(null);

  const [bankStatementFile, setBankStatementFile] = useState<File | null>(null);
  const [bankStatementUploadId, setBankStatementUploadId] = useState<string | null>(null);
  const [isUploadingBankStatement, setIsUploadingBankStatement] = useState(false);
  const [bankStatementProgress, setBankStatementProgress] = useState<number | null>(null);
  const [bankStatementError, setBankStatementError] = useState<string | null>(null);

  const [cacDocumentFile, setCacDocumentFile] = useState<File | null>(null);
  const [cacDocumentUploadId, setCacDocumentUploadId] = useState<string | null>(null);
  const [isUploadingCacDocument, setIsUploadingCacDocument] = useState(false);
  const [cacDocumentProgress, setCacDocumentProgress] = useState<number | null>(null);
  const [cacDocumentError, setCacDocumentError] = useState<string | null>(null);

  // Financing configuration loaded from backend
  const [financingSettings, setFinancingSettings] = useState<{
    min_downpayment_pct: number;
    short_term_rate: number;
    long_term_rate: number;
    tenures: number[];
    individual_rate: number;
    salary_earner_rate: number;
    business_rate: number;
  } | null>(null);

  useEffect(() => {
    getFinancingSettings()
      .then((res) => {
        if (res?.success && res.data) {
          setFinancingSettings(res.data);
          setDownpaymentPct(res.data.min_downpayment_pct);
          if (res.data.tenures && res.data.tenures.length > 0) {
            setTenureMonths(res.data.tenures[0]);
          }
        }
      })
      .catch((err) => console.error("Error loading financing settings:", err));
  }, []);

  const performUploadWithProgress = (
    file: File,
    onProgress: (percent: number) => void,
    onSuccess: (uploadId: string) => void,
    onError: (errMessage: string) => void
  ) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data?.id) {
            onSuccess(res.data.id);
          } else {
            onError(res.message || "Failed to upload file.");
          }
        } catch (e) {
          onError("Invalid response from server.");
        }
      } else {
        let errMsg = "File upload failed.";
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.message) errMsg = res.message;
        } catch (e) {}
        onError(errMsg);
      }
    };

    xhr.onerror = () => {
      onError("Network error. Check your connection.");
    };

    xhr.ontimeout = () => {
      onError("Upload timed out (120s limit exceeded). Please try a smaller file or faster connection.");
    };

    xhr.timeout = 120000; // 120 seconds (2 minutes)
    xhr.open("POST", "/api/proxy/api/v1/uploads");
    xhr.send(formData);

    return () => {
      xhr.abort();
    };
  };

  // Document upload handler
  const handleDocumentChange = async (file: File, docType: 'govId' | 'utilityBill' | 'bankStatement' | 'cac') => {
    const MAX_SIZE = 5242880; // 5MB

    if (docType === 'govId') {
      setGovIdFile(file);
      setGovIdUploadId(null);
      setGovIdProgress(0);
      setGovIdError(null);
      
      if (file.size > MAX_SIZE) {
        setGovIdError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingGovId(true);
      performUploadWithProgress(
        file,
        (pct) => setGovIdProgress(pct),
        (id) => {
          setGovIdUploadId(id);
          setIsUploadingGovId(false);
          setGovIdProgress(100);
        },
        (errMsg) => {
          setGovIdError(errMsg);
          setIsUploadingGovId(false);
          setGovIdProgress(null);
        }
      );
    } else if (docType === 'utilityBill') {
      setUtilityBillFile(file);
      setUtilityBillUploadId(null);
      setUtilityBillProgress(0);
      setUtilityBillError(null);
      
      if (file.size > MAX_SIZE) {
        setUtilityBillError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingUtilityBill(true);
      performUploadWithProgress(
        file,
        (pct) => setUtilityBillProgress(pct),
        (id) => {
          setUtilityBillUploadId(id);
          setIsUploadingUtilityBill(false);
          setUtilityBillProgress(100);
        },
        (errMsg) => {
          setUtilityBillError(errMsg);
          setIsUploadingUtilityBill(false);
          setUtilityBillProgress(null);
        }
      );
    } else if (docType === 'bankStatement') {
      setBankStatementFile(file);
      setBankStatementUploadId(null);
      setBankStatementProgress(0);
      setBankStatementError(null);
      
      if (file.size > MAX_SIZE) {
        setBankStatementError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingBankStatement(true);
      performUploadWithProgress(
        file,
        (pct) => setBankStatementProgress(pct),
        (id) => {
          setBankStatementUploadId(id);
          setIsUploadingBankStatement(false);
          setBankStatementProgress(100);
        },
        (errMsg) => {
          setBankStatementError(errMsg);
          setIsUploadingBankStatement(false);
          setBankStatementProgress(null);
        }
      );
    } else if (docType === 'cac') {
      setCacDocumentFile(file);
      setCacDocumentUploadId(null);
      setCacDocumentProgress(0);
      setCacDocumentError(null);
      
      if (file.size > MAX_SIZE) {
        setCacDocumentError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingCacDocument(true);
      performUploadWithProgress(
        file,
        (pct) => setCacDocumentProgress(pct),
        (id) => {
          setCacDocumentUploadId(id);
          setIsUploadingCacDocument(false);
          setCacDocumentProgress(100);
        },
        (errMsg) => {
          setCacDocumentError(errMsg);
          setIsUploadingCacDocument(false);
          setCacDocumentProgress(null);
        }
      );
    }
  };

  const serializeDraft = () => {
    return {
      shippingAddress,
      billingAddress,
      useShippingAsBilling,
      notes,
      requestFinancing,
      requestInstallation,
      installationType,
      roofType,
      shading,
      roofSize,
      roofOrientation,
      monthlyBill,
      dailyUsageKwh,
      downpaymentPct,
      tenureMonths,
      profileType,
      bvn,
      nin,
      bvnConsent,
      legalConsent,
      govIdUploadId,
      utilityBillUploadId,
      bankStatementUploadId,
      cacDocumentUploadId,
    };
  };

  // Sync draft details
  useEffect(() => {
    const payload = serializeDraft();
    localStorage.setItem("fortsolar:checkout_draft", JSON.stringify(payload));

    if (session) {
      const timer = setTimeout(() => {
        saveDraftOrder(payload).catch((err) => console.warn("Backend draft save failed:", err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    shippingAddress,
    billingAddress,
    useShippingAsBilling,
    notes,
    requestFinancing,
    requestInstallation,
    installationType,
    roofType,
    shading,
    roofSize,
    roofOrientation,
    monthlyBill,
    dailyUsageKwh,
    downpaymentPct,
    tenureMonths,
    profileType,
    bvn,
    nin,
    bvnConsent,
    legalConsent,
    govIdUploadId,
    utilityBillUploadId,
    bankStatementUploadId,
    cacDocumentUploadId,
    session,
  ]);

  // Load draft order on mount
  useEffect(() => {
    const localDraft = localStorage.getItem("fortsolar:checkout_draft");
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft);
        setDraftPayload(parsed);
        setShowResumePrompt(true);
      } catch (err) {
        console.error("Failed to parse local checkout draft:", err);
      }
    }

    if (session) {
      getDraftOrder()
        .then((res) => {
          if (res?.success && res.data) {
            setDraftPayload(res.data);
            setShowResumePrompt(true);
          }
        })
        .catch((err) => console.warn("Failed to load backend draft order:", err));
    }
  }, [session]);

  const resumeDraft = () => {
    if (!draftPayload) return;
    if (draftPayload.shippingAddress) setShippingAddress(draftPayload.shippingAddress);
    if (draftPayload.billingAddress) setBillingAddress(draftPayload.billingAddress);
    if (draftPayload.useShippingAsBilling !== undefined) setUseShippingAsBilling(draftPayload.useShippingAsBilling);
    if (draftPayload.notes !== undefined) setNotes(draftPayload.notes);
    if (draftPayload.requestFinancing !== undefined) setRequestFinancing(draftPayload.requestFinancing);
    if (draftPayload.requestInstallation !== undefined) setRequestInstallation(draftPayload.requestInstallation);
    if (draftPayload.installationType) setInstallationType(draftPayload.installationType);
    if (draftPayload.roofType) setRoofType(draftPayload.roofType);
    if (draftPayload.shading) setShading(draftPayload.shading);
    if (draftPayload.roofSize) setRoofSize(draftPayload.roofSize);
    if (draftPayload.roofOrientation) setRoofOrientation(draftPayload.roofOrientation);
    if (draftPayload.monthlyBill) setMonthlyBill(draftPayload.monthlyBill);
    if (draftPayload.dailyUsageKwh) setDailyUsageKwh(draftPayload.dailyUsageKwh);
    if (draftPayload.downpaymentPct) setDownpaymentPct(draftPayload.downpaymentPct);
    if (draftPayload.tenureMonths) setTenureMonths(draftPayload.tenureMonths);
    if (draftPayload.profileType) setProfileType(draftPayload.profileType);
    if (draftPayload.bvn) setBvn(draftPayload.bvn);
    if (draftPayload.nin) setNin(draftPayload.nin);
    if (draftPayload.bvnConsent !== undefined) setBvnConsent(draftPayload.bvnConsent);
    if (draftPayload.legalConsent !== undefined) setLegalConsent(draftPayload.legalConsent);
    if (draftPayload.govIdUploadId) setGovIdUploadId(draftPayload.govIdUploadId);
    if (draftPayload.utilityBillUploadId) setUtilityBillUploadId(draftPayload.utilityBillUploadId);
    if (draftPayload.bankStatementUploadId) setBankStatementUploadId(draftPayload.bankStatementUploadId);
    if (draftPayload.cacDocumentUploadId) setCacDocumentUploadId(draftPayload.cacDocumentUploadId);

    setShowResumePrompt(false);
  };

  useEffect(() => {
    if (!session && !isRefreshing) {
      requireCustomerLogin({ redirectTo: "/checkout" });
    }
  }, [isRefreshing, requireCustomerLogin, session]);

  useEffect(() => {
    const fullName = currentUser?.fullName ?? "";
    const email = currentUser?.email ?? "";
    const phone = currentUser?.phone ?? "";
    const addressLine1 = currentUser?.address ?? "";

    setShippingAddress({
      fullName,
      email,
      phone,
      addressLine1,
      city: "",
      state: "",
      country: "Nigeria",
    });
    setBillingAddress({
      fullName,
      email,
      phone,
      addressLine1,
      city: "",
      state: "",
      country: "Nigeria",
    });
  }, [currentUser?.address, currentUser?.email, currentUser?.fullName, currentUser?.phone]);

  const cartDetails = useMemo(() => {
    return cartItems
      .map((item) => {
        const product =
          item.itemType === "product"
            ? productMap.get(String(item.id))
            : packageMap.get(String(item.id));

        if (!product) {
          return null;
        }

        return {
          id: String(item.id),
          itemType: item.itemType,
          quantity: item.quantity,
          title: product.title,
          price: product.price,
          image: product.image,
          sourceType: product.sourceType,
          sourceId: product.sourceId,
          eligibleForInstallation: item.itemType === "product" ? (product as any).eligibleForInstallation : false,
        };
      })
      .filter((item): item is (CheckoutItem & { eligibleForInstallation: boolean }) => Boolean(item));
  }, [cartItems, packageMap, productMap]);

  const hasEligibleProduct = useMemo(() => {
    return cartDetails.some((item) => item.itemType === "product" && item.eligibleForInstallation);
  }, [cartDetails]);

  const hasPackage = useMemo(() => {
    return cartDetails.some((item) => item.itemType === "package");
  }, [cartDetails]);

  useEffect(() => {
    setRequestInstallation(true);
  }, []);

  const missingCartItems = cartItems.length - cartDetails.length;

  const subtotal = useMemo(
    () => cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartDetails],
  );
  const shippingAmount = useMemo(() => {
    return hasPackage ? 0 : 168224;
  }, [hasPackage]);

  const taxAmount = useMemo(() => {
    return hasPackage ? 0 : subtotal * 0.075;
  }, [subtotal, hasPackage]);

  const discountAmount = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      if (item.itemType === "package") {
        const pkg = packageMap.get(item.id);
        const pct = pkg?.discountPercentage ?? 0;
        return sum + (item.price * (pct / 100)) * item.quantity;
      }
      return sum;
    }, 0);
  }, [cartDetails, packageMap]);

  const installationFee = useMemo(() => {
    if (!requestInstallation) return 0;
    return hasPackage ? 0 : 150000;
  }, [requestInstallation, hasPackage]);

  const total = subtotal + shippingAmount + taxAmount + installationFee - discountAmount;

  const calculatorResults = useMemo(() => {
    if (!financingSettings) return null;
    const downpaymentVal = (total * downpaymentPct) / 100;
    const financedAmount = total - downpaymentVal;
    let monthlyInstallment = 0;
    let interest = 0;
    let apr = 0;

    if (financingSettings) {
      if (profileType === "individual") {
        apr = financingSettings.individual_rate ?? financingSettings.short_term_rate ?? 25.20;
        const tenureInYears = tenureMonths / 12;
        interest = financedAmount * (apr / 100) * tenureInYears;
        const totalRepayable = financedAmount + interest;
        monthlyInstallment = totalRepayable / tenureMonths;
      } else {
        apr = profileType === "salary_earner" 
          ? (financingSettings.salary_earner_rate ?? 20.00) 
          : (financingSettings.business_rate ?? 18.00);
        const r = (apr / 100) / 12;
        const n = tenureMonths;
        if (r > 0) {
          monthlyInstallment = (financedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else {
          monthlyInstallment = financedAmount / n;
        }
      }
    }

    return {
      downpaymentVal,
      financedAmount,
      monthlyInstallment,
      apr,
    };
  }, [total, downpaymentPct, tenureMonths, financingSettings, profileType]);

  const quoteProducts = useMemo(() => {
    return cartDetails
      .filter((item) => item.itemType === "product")
      .map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })) satisfies QuoteProduct[];
  }, [cartDetails]);

  const primaryPackage = useMemo(
    () => cartDetails.find((item) => item.itemType === "package") ?? null,
    [cartDetails],
  );

  const isCheckoutDisabled = isCheckoutDisabledState({
    isSubmitting,
    isVerifyingPayment,
    cartDetails,
    missingCartItems,
    shippingAddress,
  });

  async function handlePaymentVerification(reference: string) {
    setIsVerifyingPayment(true);
    setCheckoutStatus({
      tone: "info",
      message: "Verifying your payment...",
    });

    try {
      const nextStatus = await verifyCheckoutPaymentFlow({
        reference,
        verifyCustomerPayment,
        clearCustomerCart,
        replaceCart,
        onVerified: async () => {
          router.push("/settings/orders");
          router.refresh();
        },
      });
      setCheckoutStatus(nextStatus);
    } catch {
      setCheckoutStatus({
        tone: "error",
        message: "Unable to verify your payment.",
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  }

  async function handleCheckout() {
    const errors: Record<string, boolean> = {};

    // 1. Validate Shipping Address
    if (!shippingAddress.fullName.trim()) errors.shippingFullName = true;
    if (!shippingAddress.email.trim()) errors.shippingEmail = true;
    if (!shippingAddress.phone.trim()) errors.shippingPhone = true;
    if (!shippingAddress.addressLine1.trim()) errors.shippingAddressLine1 = true;

    // 2. Validate Billing Address (if not same as shipping)
    if (!useShippingAsBilling) {
      if (!billingAddress.fullName.trim()) errors.billingFullName = true;
      if (!billingAddress.email.trim()) errors.billingEmail = true;
      if (!billingAddress.phone.trim()) errors.billingPhone = true;
      if (!billingAddress.addressLine1.trim()) errors.billingAddressLine1 = true;
    }

    // 3. Validate Financing (if requestFinancing is true and hasPackage is true)
    if (hasPackage && requestFinancing) {
      if (!bvn || bvn.trim().length < 11) errors.bvn = true;
      if (!nin || nin.trim().length < 11) errors.nin = true;
      if (!bvnConsent) errors.bvnConsent = true;
      if (!govIdUploadId) errors.uploadsGovId = true;
      if (!utilityBillUploadId) errors.uploadsUtilityBill = true;
      if (!bankStatementUploadId) errors.uploadsBankStatement = true;
      if (profileType === "business" && !cacDocumentUploadId) errors.uploadsCac = true;
    }

    // 4. Validate Legal Consent / Terms
    if (!legalConsent) errors.legalConsent = true;

    // If there are errors, set state and abort
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      let primaryErrorMessage = "Please correct the highlighted errors on the form before proceeding.";
      
      if (errors.legalConsent) {
        primaryErrorMessage = "You must agree to the Terms of Service, Refund Policy, and data consent to proceed.";
      } else if (hasPackage && requestFinancing) {
        if (errors.bvn) {
          primaryErrorMessage = "Please enter a valid 11-digit BVN.";
        } else if (errors.nin) {
          primaryErrorMessage = "Please enter a valid 11-digit NIN.";
        } else if (errors.bvnConsent) {
          primaryErrorMessage = "You must consent to BVN verification to apply for financing.";
        } else if (errors.uploadsGovId || errors.uploadsUtilityBill || errors.uploadsBankStatement || errors.uploadsCac) {
          primaryErrorMessage = "Please upload all required files to continue.";
        }
      } else if (errors.shippingFullName || errors.shippingEmail || errors.shippingPhone || errors.shippingAddressLine1) {
        primaryErrorMessage = "Please fill in all required shipping address fields.";
      } else if (errors.billingFullName || errors.billingEmail || errors.billingPhone || errors.billingAddressLine1) {
        primaryErrorMessage = "Please fill in all required billing address fields.";
      }

      setCheckoutStatus({
        tone: "error",
        message: primaryErrorMessage,
      });

      // Scroll to first invalid section
      const firstErrorKey = Object.keys(errors)[0];
      let elementId = "";
      if (firstErrorKey.startsWith("shipping")) {
        elementId = "shipping-section";
      } else if (firstErrorKey.startsWith("billing")) {
        elementId = "billing-section";
      } else if (firstErrorKey === "bvn" || firstErrorKey === "bvnConsent" || firstErrorKey.startsWith("uploads")) {
        elementId = "financing-section";
      } else if (firstErrorKey === "legalConsent") {
        elementId = "terms-section";
      }

      if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setValidationErrors({});

    if (!hasPackage) {
      setIsSubmitting(true);
      setCheckoutStatus(null);
      try {
        const quotePayload = {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.addressLine1,
          location: shippingAddress.city,
          roofSize: roofSize,
          roofOrientation: roofOrientation,
          shading: shading,
          monthlyBill: monthlyBill ? Number(monthlyBill) : undefined,
          dailyUsageKwh: dailyUsageKwh ? Number(dailyUsageKwh) : undefined,
          requestInstallation: true,
          agreeToTerms: legalConsent,
          products: quoteProducts.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            quantity: p.quantity
          }))
        };

        await submitCustomerQuoteRequest(quotePayload);

        setCheckoutStatus({
          tone: "success",
          message: "Your installation quote request has been submitted successfully! Redirecting you to your quotes history...",
        });

        localStorage.removeItem("fortsolar:checkout_draft");
        await clearCustomerCart().catch(() => null);
        replaceCart([]);

        setTimeout(() => {
          router.push("/settings/quotes");
        }, 3000);
      } catch (err: any) {
        setCheckoutStatus({
          tone: "error",
          message: err.message || "Failed to submit quote request.",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    setCheckoutStatus(null);

    try {
      const resolvedBillingAddress = useShippingAsBilling ? shippingAddress : billingAddress;
      
      let finalNotes = notes.trim();
      if (requestInstallation) {
        const installationInfo = `
[Professional Installation Site Details]
Installation Type: ${installationType || "Not specified"}
Roof Type: ${roofType}
Roof Orientation: ${roofOrientation}
Shading Level: ${shading}
Estimated Roof Size: ${roofSize || "Not specified"} sqm
Monthly Bill: ${monthlyBill || "Not specified"}
Daily Usage: ${dailyUsageKwh || "Not specified"} kWh/day
`;
        finalNotes = finalNotes ? `${finalNotes}\n${installationInfo}` : installationInfo;
      }

      const orderPayload = {
        items: cartDetails.map((item) => ({
          item_type: item.itemType,
          item_id: item.id,
          name: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          metadata: {
            sourceType: item.sourceType,
            sourceId: item.sourceId,
          },
        })),
        shipping_address: shippingAddress,
        billing_address: resolvedBillingAddress,
        notes: finalNotes || undefined,
        subtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: total,
        currency: "NGN",
        create_bundle_request: primaryPackage
          ? {
              bundle_id: primaryPackage.sourceId,
              financing_requested: requestFinancing,
              financing_id_upload_id: govIdUploadId,
              financing_statement_upload_id: bankStatementUploadId,
              financing_cac_upload_id: profileType === "business" ? cacDocumentUploadId : null,
              financing_utility_bill_upload_id: utilityBillUploadId,
              financing_bvn: bvn,
              financing_nin: nin,
              financing_bvn_consent: bvnConsent,
              financing_profile_type: profileType,
            }
          : undefined,
      };

      const orderPayloadResponse = await createCustomerOrder(orderPayload);
      const orderId = getOrderId(orderPayloadResponse.data);

      if (!orderId) {
        throw new Error("The order was created, but the order id is missing from the response.");
      }

      if (requestFinancing) {
        setCheckoutStatus({
          tone: "success",
          message: "Your order and financing application have been submitted successfully! Our partners are reviewing your documents, and we will update you soon.",
        });
        clearCustomerCart();
        replaceCart([]);
        localStorage.removeItem("fortsolar:checkout_draft");
        setTimeout(() => {
          router.push("/settings");
        }, 4000);
        return;
      }

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
            email: shippingAddress.email,
            onSuccess: (nextReference) => {
              localStorage.removeItem("fortsolar:checkout_draft");
              void handlePaymentVerification(nextReference);
            },
            onClose: () => {
              setCheckoutStatus({
                tone: "info",
                message: "Payment window closed before completion.",
              });
            },
          }),
        );

        handler.openIframe();
        setCheckoutStatus({
          tone: "info",
          message: "Order created. Complete the payment in the Paystack popup.",
        });
      } else {
        setCheckoutStatus({
          tone: "info",
          message: "Redirecting to Paystack to complete your payment.",
        });
        localStorage.removeItem("fortsolar:checkout_draft");
        window.location.assign(authorizationUrl);
      }
    } catch (error) {
      setCheckoutStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to start checkout.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderAddressForm = (
    value: AddressFormState,
    onChange: (field: keyof AddressFormState, nextValue: string) => void,
    errorPrefix: "shipping" | "billing",
  ) => {
    const hasError = (field: keyof AddressFormState) => {
      const key = `${errorPrefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
      return !!validationErrors[key];
    };

    const handleInputChange = (field: keyof AddressFormState, val: string) => {
      onChange(field, val);
      const key = `${errorPrefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
      if (validationErrors[key]) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          value={value.fullName}
          onChange={(event) => handleInputChange("fullName", event.target.value)}
          placeholder="Full name *"
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            hasError("fullName") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
        <Input
          value={value.email}
          onChange={(event) => handleInputChange("email", event.target.value)}
          placeholder="Email address *"
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            hasError("email") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
        <Input
          value={value.phone}
          onChange={(event) => handleInputChange("phone", event.target.value)}
          placeholder="Phone number *"
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            hasError("phone") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
        <NigeriaLocationFields state={value.state} city={value.city} onStateChange={(next) => handleInputChange("state", next)} onCityChange={(next) => handleInputChange("city", next)} />
        <Input
          value={value.addressLine1}
          onChange={(event) => handleInputChange("addressLine1", event.target.value)}
          placeholder="Street address *"
          className={cn(
            "h-11 rounded-xl md:col-span-2 transition-all duration-200",
            hasError("addressLine1") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
      </div>
    );
  };

  const renderDocumentUpload = (
    label: string,
    file: File | null,
    uploadId: string | null,
    isUploading: boolean,
    onFileChange: (file: File) => void,
    accept = "image/*,application/pdf",
    hasError = false,
    progress: number | null = null,
    errorMsg: string | null = null,
  ) => {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-dashed p-4 transition-all duration-200",
          hasError || errorMsg
            ? "border-red-500 bg-red-50/30 shadow-sm"
            : "border-[#B0BABF] bg-gray-50/50",
        )}
      >
        <span className="text-xs font-semibold text-[#252C32]">{label}</span>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) {
                onFileChange(selected);
                
                let key = "";
                if (label.includes("ID")) key = "uploadsGovId";
                else if (label.includes("Utility")) key = "uploadsUtilityBill";
                else if (label.includes("Statement")) key = "uploadsBankStatement";
                else if (label.includes("CAC")) key = "uploadsCac";
                if (key && validationErrors[key]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }
              }
            }}
            className="hidden"
            id={`file-upload-${label.replace(/[^a-zA-Z0-9]+/g, "-")}`}
          />
          <label
            htmlFor={`file-upload-${label.replace(/[^a-zA-Z0-9]+/g, "-")}`}
            className="cursor-pointer rounded-lg border border-[#B0BABF] bg-white px-3 py-2 text-xs font-semibold text-[#252C32] hover:bg-gray-50 transition"
          >
            Choose File
          </label>
          <span className="text-xs text-[#5A646B] truncate max-w-[150px]">
            {file ? file.name : "No file chosen"}
          </span>
        </div>
        
        {isUploading && (
          <div className="space-y-1 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#1FA21B] font-medium animate-pulse">
                {progress === 100 ? "Processing file..." : "Uploading..."}
              </span>
              <span className="text-[#1FA21B] font-bold">{progress ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#1FA21B] h-1.5 rounded-full transition-all duration-200" 
                style={{ width: `${progress ?? 0}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {!isUploading && uploadId && (
          <span className="text-xs text-[#048A05] font-semibold flex items-center gap-1 mt-1">
            ✓ Upload complete
          </span>
        )}
        
        {errorMsg && (
          <span className="text-xs text-red-500 font-semibold mt-1">
            ⚠ {errorMsg}
          </span>
        )}
      </div>
    );
  };

  if (!session && !isRefreshing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-24">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
        onLoad={() => setIsPaystackReady(true)}
      />
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="text-sm text-[#5A646B]">Store / Checkout</div>

        {showResumePrompt && draftPayload && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#048A0580] bg-[#EBFAEB] p-4 text-[#048A05] shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-xl">✍️</span>
              <div>
                <p className="font-semibold text-sm">You have an incomplete checkout</p>
                <p className="text-xs text-[#048A05]/80 font-normal">Resume your saved details (address, site options, and uploads).</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resumeDraft}
                className="rounded-lg bg-[#048A05] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#048a05]/90"
              >
                Resume Purchase
              </button>
              <button
                type="button"
                onClick={() => setShowResumePrompt(false)}
                className="rounded-lg border border-[#048a05]/20 px-2.5 py-1.5 text-xs font-semibold hover:bg-[#048a05]/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {checkoutStatus && checkoutStatus.tone !== "error" ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  checkoutStatus.tone === "success"
                    ? "bg-[#EAF7E8] text-[#168416]"
                    : "bg-[#EEF5FF] text-[#1D4ED8]"
                }`}
              >
                {checkoutStatus.message}
              </div>
            ) : null}

            {missingCartItems > 0 ? (
              <div className="rounded-2xl border border-[#F7D8D8] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
                Some cart items could not be resolved from the live catalog. Refresh the catalog or remove the missing items before checkout.
              </div>
            ) : null}



            <section id="shipping-section" className="rounded-2xl border border-[#E9EEF0] p-5">
              <h1 className="text-2xl font-semibold text-[#252C32]">Shipping Address</h1>
              <p className="mt-1 text-sm text-[#5A646B]">
                Use a valid delivery address and contact details for order updates.
              </p>
              <div className="mt-5">
                {renderAddressForm(
                  shippingAddress,
                  (field, value) =>
                    setShippingAddress((current) => ({ ...current, [field]: value })),
                  "shipping",
                )}
              </div>
            </section>

            <section id="billing-section" className="rounded-2xl border border-[#E9EEF0] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#252C32]">Billing Address</h2>
                  <p className="mt-1 text-sm text-[#5A646B]">
                    Match this to the cardholder or company billing details.
                  </p>
                </div>
                <GradientCheckbox
                  checked={useShippingAsBilling}
                  onChange={(event) => setUseShippingAsBilling(event.target.checked)}
                  label="Same as shipping"
                  labelClassName="text-sm text-[#252C32]"
                />
              </div>

              {!useShippingAsBilling ? (
                <div className="mt-5">
                  {renderAddressForm(
                    billingAddress,
                    (field, value) =>
                      setBillingAddress((current) => ({ ...current, [field]: value })),
                    "billing",
                  )}
                </div>
              ) : null}
             </section>

            {requestInstallation && (
              <section className="rounded-2xl border border-[#E9EEF0] p-5">
                <h2 className="text-xl font-semibold text-[#252C32]">Installation Site Details</h2>
                <p className="mt-1 text-sm text-[#5A646B]">
                  Please provide structural details of the installation site to help our engineers plan your custom setup.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Installation Type *</label>
                    <input list="installation-types" value={installationType} onChange={(e) => setInstallationType(e.target.value)} placeholder="Search installation type" className="w-full h-11 px-3 rounded-xl border border-[#E4E9EC] text-sm bg-white outline-none" />
                    <datalist id="installation-types"><option value="Residential" /><option value="Commercial" /><option value="Industrial" /></datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Roof Type *</label>
                    <select
                      value={roofType}
                      onChange={(e) => setRoofType(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#E4E9EC] text-sm bg-white outline-none"
                    >
                      <option value="metal">Metal / Tin / Longspan</option>
                      <option value="concrete">Concrete slab (Decking)</option>
                      <option value="tile">Tile Roof</option>
                      <option value="shingle">Asphalt Shingles</option>
                      <option value="other">Other / Not sure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Roof Orientation *</label>
                    <select
                      value={roofOrientation}
                      onChange={(e) => setRoofOrientation(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#E4E9EC] text-sm bg-white outline-none"
                    >
                      <option value="flat">Flat Roof (No tilt)</option>
                      <option value="south">Facing South (Optimized)</option>
                      <option value="east_west">Facing East/West split</option>
                      <option value="north">Facing North</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Shading Level *</label>
                    <select
                      value={shading}
                      onChange={(e) => setShading(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#E4E9EC] text-sm bg-white outline-none"
                    >
                      <option value="none">No Shading (Full sun exposure)</option>
                      <option value="partial">Partial Shading (Trees, nearby buildings)</option>
                      <option value="heavy">Heavy Shading (Significant obstruction)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Estimated Roof Size (sqm)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={roofSize}
                      onChange={(e) => setRoofSize(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Monthly Electricity Bill (₦)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={monthlyBill}
                      onChange={(e) => setMonthlyBill(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A646B] mb-2">Daily Usage Estimate (kWh)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      value={dailyUsageKwh}
                      onChange={(e) => setDailyUsageKwh(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </section>
            )}

            {requestFinancing && (
              <section id="financing-section" className="rounded-2xl border border-[#E9EEF0] p-5 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#252C32]">Financing Calculator & Application</h2>
                  <p className="mt-1 text-sm text-[#5A646B]">
                    Select your target downpayment and terms, then upload required documentation.
                  </p>
                </div>

                {financingSettings && calculatorResults && (() => {
                  const tenuresList = [3, 6, 9, 12, 15, 18, 21, 24];
                  const currentTenureIndex = tenuresList.indexOf(tenureMonths) !== -1 ? tenuresList.indexOf(tenureMonths) : 2;
                  
                  return (
                    <div className="rounded-xl border border-[#048A0530] bg-[#EBFAEB]/20 p-4 space-y-4">
                      <h3 className="font-semibold text-sm text-[#048A05]">
                        Repayment Estimator ({profileType === "individual" ? "Flat Rate APR" : "Reducing Balance"})
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-[#5A646B] mb-2">
                            Down Payment Percentage: <span className="font-bold text-[#252C32]">{downpaymentPct}%</span>
                          </label>
                          <input
                            type="range"
                            min={financingSettings.min_downpayment_pct}
                            max="80"
                            step="5"
                            value={downpaymentPct}
                            onChange={(e) => setDownpaymentPct(Number(e.target.value))}
                            className="w-full accent-[#1FA21B]"
                          />
                          <span className="text-[10px] text-[#5A646B]">Minimum: {financingSettings.min_downpayment_pct}%</span>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#5A646B] mb-1">
                            Select tenure: <span className="font-bold text-[#252C32]">{tenureMonths} Months</span>
                          </label>
                          <div className="py-2">
                            <input
                              type="range"
                              min="0"
                              max={tenuresList.length - 1}
                              step="1"
                              value={currentTenureIndex}
                              onChange={(e) => {
                                const idx = Number(e.target.value);
                                setTenureMonths(tenuresList[idx]);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FA21B]"
                            />
                            <div className="flex justify-between text-[10px] text-[#5A646B] font-semibold mt-1 px-1">
                              {tenuresList.map((t) => (
                                <span
                                  key={t}
                                  className={`cursor-pointer hover:text-[#048A05] transition ${
                                    tenureMonths === t ? "text-[#048A05] font-bold" : ""
                                  }`}
                                  onClick={() => setTenureMonths(t)}
                                >
                                  {t} mo
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#048A0515] pt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#5A646B]">Down Payment Amount:</span>
                          <p className="font-bold text-sm text-[#252C32]">{formatNaira(calculatorResults.downpaymentVal)}</p>
                        </div>
                        <div>
                          <span className="text-[#5A646B]">Amount Financed:</span>
                          <p className="font-bold text-sm text-[#252C32]">{formatNaira(calculatorResults.financedAmount)}</p>
                        </div>
                        <div>
                          <span className="text-[#5A646B]">Monthly Installment:</span>
                          <p className="font-bold text-lg text-[#048A05]">{formatNaira(calculatorResults.monthlyInstallment)} / mo</p>
                        </div>
                        <div>
                          <span className="text-[#5A646B]">Interest APR ({profileType === "individual" ? "Flat-Rate" : "Reducing Balance"}):</span>
                          <p className="font-bold text-sm text-[#252C32]">{calculatorResults.apr}% APR</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-[#E9EEF0] pt-5">
                  <span className="block text-sm font-semibold text-[#252C32] mb-3">Applicant Profile Type</span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === "individual"}
                        onChange={() => setProfileType("individual")}
                        className="accent-[#1FA21B]"
                      />
                      Individual
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === "salary_earner"}
                        onChange={() => setProfileType("salary_earner")}
                        className="accent-[#1FA21B]"
                      />
                      Salary Earner
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === "business"}
                        onChange={() => setProfileType("business")}
                        className="accent-[#1FA21B]"
                      />
                      Registered Business / Corporate
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {renderDocumentUpload(
                    "Government-issued ID *",
                    govIdFile,
                    govIdUploadId,
                    isUploadingGovId,
                    (file) => handleDocumentChange(file, "govId"),
                    "image/*,application/pdf",
                    !!validationErrors.uploadsGovId,
                    govIdProgress,
                    govIdError,
                  )}
                  {renderDocumentUpload(
                    "Utility Bill *",
                    utilityBillFile,
                    utilityBillUploadId,
                    isUploadingUtilityBill,
                    (file) => handleDocumentChange(file, "utilityBill"),
                    "image/*,application/pdf",
                    !!validationErrors.uploadsUtilityBill,
                    utilityBillProgress,
                    utilityBillError,
                  )}
                  {renderDocumentUpload(
                    "6-Month Bank Statement *",
                    bankStatementFile,
                    bankStatementUploadId,
                    isUploadingBankStatement,
                    (file) => handleDocumentChange(file, "bankStatement"),
                    "image/*,application/pdf",
                    !!validationErrors.uploadsBankStatement,
                    bankStatementProgress,
                    bankStatementError,
                  )}
                  {profileType === "business" &&
                    renderDocumentUpload(
                      "CAC Registration Documents *",
                      cacDocumentFile,
                      cacDocumentUploadId,
                      isUploadingCacDocument,
                      (file) => handleDocumentChange(file, "cac"),
                      "image/*,application/pdf",
                      !!validationErrors.uploadsCac,
                      cacDocumentProgress,
                      cacDocumentError,
                    )}
                </div>

                <div className="border-t border-[#E9EEF0] pt-5 space-y-4">
                  <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A646B] mb-2">Bank Verification Number (BVN) *</label>
                      <Input
                        type="text"
                        maxLength={11}
                        placeholder="Enter 11-digit BVN"
                        value={bvn}
                        onChange={(e) => {
                          setBvn(e.target.value.replace(/\D/g, ""));
                          if (validationErrors.bvn) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.bvn;
                              return next;
                            });
                          }
                        }}
                        className={cn(
                          "h-11 rounded-xl w-full transition-all duration-200",
                          validationErrors.bvn && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A646B] mb-2">National Identification Number (NIN) *</label>
                      <Input
                        type="text"
                        maxLength={11}
                        placeholder="Enter 11-digit NIN"
                        value={nin}
                        onChange={(e) => {
                          setNin(e.target.value.replace(/\D/g, ""));
                          if (validationErrors.nin) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.nin;
                              return next;
                            });
                          }
                        }}
                        className={cn(
                          "h-11 rounded-xl w-full transition-all duration-200",
                          validationErrors.nin && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
                        )}
                      />
                    </div>
                  </div>
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-xl transition-all duration-200",
                      validationErrors.bvnConsent && "bg-red-50 border border-red-200 shadow-sm",
                    )}
                  >
                    <GradientCheckbox
                      checked={bvnConsent}
                      onChange={(event) => {
                        setBvnConsent(event.target.checked);
                        if (validationErrors.bvnConsent) {
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.bvnConsent;
                            return next;
                          });
                        }
                      }}
                      label="I hereby consent to Fortsolar performing legal verification of my BVN for credit scoring purposes."
                      labelClassName="text-xs text-[#5A646B] leading-relaxed"
                      indicatorClassName={validationErrors.bvnConsent ? "border-red-500 bg-red-50" : ""}
                    />
                  </div>
                </div>
              </section>
            )}

            <section id="terms-section" className="rounded-2xl border border-[#E9EEF0] p-5">
              <h2 className="text-xl font-semibold text-[#252C32]">Order Notes</h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add delivery notes or payment context for this order."
                className="mt-4 min-h-28 w-full rounded-2xl border border-[#E4E9EC] px-4 py-3 text-sm outline-none"
              />

              {primaryPackage ? (
                <GradientCheckbox
                  className="mt-4"
                  checked={requestFinancing}
                  onChange={(event) => setRequestFinancing(event.target.checked)}
                  label="Request financing for this package order"
                  labelClassName="text-sm text-[#252C32]"
                />
              ) : null}

              <div className="mt-6 border-t border-[#E4E9EC] pt-4 space-y-3">
                <div
                  className={cn(
                    "p-3 rounded-xl transition-all duration-200",
                    validationErrors.legalConsent && "bg-red-50 border border-red-200 shadow-sm",
                  )}
                >
                  <GradientCheckbox
                    checked={legalConsent}
                    onChange={(event) => {
                      setLegalConsent(event.target.checked);
                      if (validationErrors.legalConsent) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.legalConsent;
                          return next;
                        });
                      }
                    }}
                    label="I agree to the Terms of Service, Refund Policy, and consent to the collection and secure handling of my personal and financial data."
                    labelClassName="text-xs text-[#5A646B]"
                    indicatorClassName={validationErrors.legalConsent ? "border-red-500 bg-red-50" : ""}
                  />
                </div>
                
                <p className="text-[10px] text-[#5A646B] leading-normal font-normal">
                  <strong>Refund & Verification Policy:</strong> By completing this transaction, you agree to Fortsolar's standardized return and replacement guidelines. Verification documents and financial application materials will be processed and stored securely in accordance with standard data privacy guidelines and transmitted via encrypted pathways only.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#E9EEF0] p-4">
              <p className="font-semibold text-[#252C32]">Order Summary</p>
              <div className="mt-4 space-y-4">
                {cartDetails.map((item) => (
                  <div key={`${item.itemType}-${item.id}`} className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl bg-cover bg-center bg-no-repeat bg-[#D9D9D9]"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    <div className="flex-1 text-sm">
                      <p className="text-[#252C32]">{item.title}</p>
                      <p className="font-semibold text-[#252C32]">
                        {formatNaira(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#252C32]">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#E9EEF0] pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Sub Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Shipping</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(shippingAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Tax</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(taxAmount)}
                  </span>
                </div>
                {requestInstallation && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A646B]">Professional Installation</span>
                    <span className="font-semibold text-[#252C32]">
                      {installationFee === 0 ? "Free" : formatNaira(installationFee)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Discount</span>
                  <span className="font-semibold text-[#252C32]">
                    -{formatNaira(discountAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E9EEF0] pt-3">
                  <span className="font-semibold text-[#252C32]">Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || isVerifyingPayment || cartDetails.length === 0 || missingCartItems > 0}
                className="mt-5 w-full rounded-xl bg-[#1FA21B] py-3 text-center font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? (hasPackage
                      ? (requestFinancing ? "Submitting application..." : "Starting payment...")
                      : "Submitting request...")
                  : isVerifyingPayment
                    ? "Verifying payment..."
                    : (hasPackage
                        ? (requestFinancing ? "Apply for Financing" : "Pay Now")
                        : "Get Quote")}
              </button>

              {checkoutStatus && checkoutStatus.tone === "error" && (
                <div className="mt-3 rounded-xl bg-[#FDECEC] p-3 text-xs text-[#C73939] border border-[#F5C2C2] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span className="text-sm">⚠️</span> Checkout failed
                  </div>
                  <p>{checkoutStatus.message}</p>
                </div>
              )}

              <div className="mt-8 text-sm text-[#5A646B]">
                <p className="mb-2">Good to know</p>
                <p className="font-semibold text-[#252C32]">
                  Packages remain available during checkout
                </p>
                <p className="mt-2">
                  Need a full installation-ready setup instead of individual components?{" "}
                  <Link
                    href="/packages"
                    className="inline-flex items-center gap-1 font-medium text-[#252C32] underline"
                  >
                    Browse packages
                    <span>↗</span>
                  </Link>
                  .
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isQuoteModalOpen && quoteProducts.length > 0 ? (
        <GetQuoteModal
          open={isQuoteModalOpen}
          products={quoteProducts}
          onClose={() => setIsQuoteModalOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default CheckoutPage;
