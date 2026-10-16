"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  DollarSign,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import { appRequest } from "@/lib/api/client";
import { FINANCING_PROFILES } from "./financingCalculator";

interface FinancingApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string | number;
  packageTitle: string;
  packagePrice: number;
  initialPlan?: {
    profileType: string;
    downPaymentPct: number;
    downPaymentAmount: number;
    tenureMonths: number;
    monthlyPayment: number;
    interestType: "flat" | "reducing";
    partnerName: string;
  };
  onSuccess?: () => void;
}

export default function FinancingApplicationModal({
  isOpen,
  onClose,
  packageId,
  packageTitle,
  packagePrice,
  initialPlan,
  onSuccess,
}: FinancingApplicationModalProps) {
  const { session } = useAuth();
  const { requireCustomerLogin } = useCustomerLoginGate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    referenceId: string;
    orderNumber?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Contact
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stateName, setStateName] = useState("Lagos");
  const [cityName, setCityName] = useState("");

  // Step 2: Terms
  const [profileType, setProfileType] = useState(initialPlan?.profileType || "salary_earner");
  const [downPaymentPct, setDownPaymentPct] = useState(initialPlan?.downPaymentPct || 30);
  const [tenureMonths, setTenureMonths] = useState(initialPlan?.tenureMonths || 12);

  // Step 3: Underwriting
  const [employerName, setEmployerName] = useState("");
  const [incomeRange, setIncomeRange] = useState("500k_1m");
  const [nin, setNin] = useState("");

  // Pre-fill user data if signed in
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !fullName) setFullName(session.user.name);
      if (session.user.email && !email) setEmail(session.user.email);
    }
  }, [session]);

  // Sync initialPlan when changed
  useEffect(() => {
    if (initialPlan) {
      if (initialPlan.profileType) setProfileType(initialPlan.profileType);
      if (initialPlan.downPaymentPct) setDownPaymentPct(initialPlan.downPaymentPct);
      if (initialPlan.tenureMonths) setTenureMonths(initialPlan.tenureMonths);
    }
  }, [initialPlan]);

  if (!isOpen) return null;

  // Live calculations
  const downPaymentAmount = Math.round(packagePrice * (downPaymentPct / 100));
  const principalAmount = Math.max(0, packagePrice - downPaymentAmount);
  const profileConfig = FINANCING_PROFILES.find((p) => p.id === profileType) || FINANCING_PROFILES[0];
  const monthlyRate = profileConfig.defaultMonthlyRatePct;
  const totalInterest = Math.round(principalAmount * (monthlyRate / 100) * tenureMonths);
  const estimatedMonthlyPayment = Math.round((principalAmount + totalInterest) / tenureMonths);

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage("Please provide your full name, phone number, and email.");
      return;
    }
    setErrorMessage("");
    setStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setStep(3);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerName.trim()) {
      setErrorMessage(
        profileType === "business"
          ? "Please provide your registered business or company name."
          : "Please provide your employer or organization name."
      );
      return;
    }
    setErrorMessage("");

    // If not signed in, save draft to local storage and prompt login
    if (!session) {
      const applicationDraft = {
        packageId,
        packageTitle,
        packagePrice,
        fullName,
        phone,
        email,
        state: stateName,
        city: cityName,
        profileType,
        downPaymentPct,
        tenureMonths,
        employerName,
        incomeRange,
        nin,
      };
      try {
        localStorage.setItem(
          "fortsolar:pending_finance_application",
          JSON.stringify(applicationDraft)
        );
      } catch (err) {
        console.warn(err);
      }

      requireCustomerLogin({
        redirectTo: window.location.pathname,
        onAuthenticated: () => {
          submitIntakeToBackend();
        },
      });
      return;
    }

    await submitIntakeToBackend();
  };

  const submitIntakeToBackend = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        bundle_id: String(packageId),
        quantity: 1,
        financing_requested: true,
        financing_profile_type: profileType,
        employment_or_business_name: employerName.trim(),
        estimated_monthly_income_range: incomeRange,
        preferred_downpayment_pct: downPaymentPct,
        preferred_tenure_months: tenureMonths,
        financing_nin: nin.trim() || null,
        shipping_address: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          state: stateName.trim(),
          city: cityName.trim() || stateName.trim(),
        },
        billing_address: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          state: stateName.trim(),
          city: cityName.trim() || stateName.trim(),
        },
        notes: `Storefront 3-step financing request: ${profileType} profile with ~₦${estimatedMonthlyPayment.toLocaleString()}/mo estimated installment`,
        financing_terms: {
          estimated_monthly_installment: estimatedMonthlyPayment,
          downpayment_amount: downPaymentAmount,
          principal_amount: principalAmount,
          monthly_rate_pct: monthlyRate,
        },
      };

      const res = await appRequest<{
        success: boolean;
        data: { packageRequest?: any; order?: any };
      }>("/api/v1/customer/me/package-requests", {
        method: "POST",
        body: payload,
      });

      if (res?.success) {
        const orderNum = res.data?.order?.order_number || res.data?.packageRequest?.id?.slice(0, 8);
        setSubmissionSuccess({
          referenceId: res.data?.packageRequest?.id || String(orderNum),
          orderNumber: orderNum,
        });
        onSuccess?.();
      } else {
        setErrorMessage("We could not complete your submission. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "An unexpected error occurred while submitting your application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Step Indicator */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 via-emerald-50/20 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Solar Financing Application
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Fast 3-step intake for <strong className="text-gray-800">{packageTitle}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!submissionSuccess && (
            <div className="flex items-center gap-2 mt-4">
              {[
                { s: 1, label: "Contact Info" },
                { s: 2, label: "Financing Terms" },
                { s: 3, label: "Underwriting Profile" },
              ].map((item) => (
                <div key={item.s} className="flex-1 flex items-center gap-1.5">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === item.s
                        ? "bg-[#048A05] text-white ring-2 ring-[#048A05]/20"
                        : step > item.s
                        ? "bg-emerald-100 text-[#048A05]"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > item.s ? "✓" : item.s}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:inline ${
                      step === item.s ? "text-gray-900 font-bold" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.s < 3 && <div className="flex-1 h-0.5 bg-gray-200 hidden sm:block" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm">
          {submissionSuccess ? (
            /* Success State */
            <div className="py-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-[#048A05] mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Finance Request Received!
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Reference:{" "}
                  <strong className="text-gray-900 font-mono">
                    #{submissionSuccess.orderNumber || submissionSuccess.referenceId.slice(0, 8)}
                  </strong>
                </p>
              </div>

              {/* Next Steps Timeline */}
              <div className="rounded-2xl bg-gray-50 border border-gray-200/80 p-4 text-left space-y-3 max-w-md mx-auto text-xs">
                <strong className="font-semibold text-gray-900 block mb-2">
                  What Happens Next?
                </strong>

                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-[#048A05] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-gray-800">Underwriting Match (2-4 hrs)</strong>
                    <p className="text-gray-500 text-[11px]">
                      Our desk pairs your profile with the optimal partner (CheckOff, Altpower, or Sterling Bank).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-gray-800">WhatsApp & Email Pre-Approval</strong>
                    <p className="text-gray-500 text-[11px]">
                      You receive your pre-approved repayment schedule and lender agreement directly on WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-gray-800">Site Assessment & Installation</strong>
                    <p className="text-gray-500 text-[11px]">
                      Down payment is verified, delivery dispatched, and Fortsolar engineers complete installation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/2347066524793?text=${encodeURIComponent(
                    `Hi Fortsolar, I just submitted financing request #${submissionSuccess.orderNumber || submissionSuccess.referenceId.slice(0, 8)} for ${packageTitle}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-95 transition cursor-pointer"
                >
                  <span>Chat with Underwriting Desk on WhatsApp</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Multi-step Forms */
            <form onSubmit={step === 1 ? handleNextFromStep1 : step === 2 ? handleNextFromStep2 : handleSubmitApplication}>
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* STEP 1: CONTACT */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chukwuma Olawale"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        WhatsApp Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 08012345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden bg-white"
                      >
                        {[
                          "Abia", "Abuja FCT", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
                          "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
                          "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
                          "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
                        ].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        City / LGA
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. Lekki Phase 1 / Ikeja"
                          value={cityName}
                          onChange={(e) => setCityName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: FINANCING TERMS */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Selected Package Spotlight */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <div>
                      <span className="text-[11px] text-gray-500 block">Selected Package</span>
                      <strong className="text-sm text-gray-900">{packageTitle}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-500 block">Package Price</span>
                      <strong className="text-sm font-bold text-[#048A05]">
                        ₦{packagePrice.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Profile Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Applicant Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {FINANCING_PROFILES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProfileType(p.id)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            profileType === p.id
                              ? "border-[#048A05] bg-emerald-50/50 text-[#048A05] font-bold"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-xs block">{p.label}</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">{p.defaultMonthlyRatePct}%/mo</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Downpayment & Tenure Preview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Preferred Down Payment
                      </label>
                      <select
                        value={downPaymentPct}
                        onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden bg-white"
                      >
                        <option value={20}>20% (₦{Math.round(packagePrice * 0.2).toLocaleString()})</option>
                        <option value={30}>30% (₦{Math.round(packagePrice * 0.3).toLocaleString()})</option>
                        <option value={40}>40% (₦{Math.round(packagePrice * 0.4).toLocaleString()})</option>
                        <option value={50}>50% (₦{Math.round(packagePrice * 0.5).toLocaleString()})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Preferred Tenure
                      </label>
                      <select
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden bg-white"
                      >
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months (Recommended)</option>
                        <option value={18}>18 Months</option>
                        <option value={24}>24 Months</option>
                      </select>
                    </div>
                  </div>

                  {/* Estimated Installment Summary Pill */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200">
                    <span className="text-[11px] font-semibold text-[#048A05] uppercase tracking-wider block">
                      Estimated Monthly Installment
                    </span>
                    <div className="text-2xl font-black text-gray-900 mt-1">
                      ₦{estimatedMonthlyPayment.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-gray-500">/ month</span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      Down payment: ₦{downPaymentAmount.toLocaleString()} • Principal: ₦{principalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 3: UNDERWRITING QUALIFICATION */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {profileType === "business"
                        ? "Registered Business / Company Name"
                        : "Current Employer / Workplace Name"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      {profileType === "business" ? (
                        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      ) : (
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder={
                          profileType === "business"
                            ? "e.g. Apex Health Logistics Ltd"
                            : "e.g. Zenith Bank PLC / Lagos State Judiciary"
                        }
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {profileType === "business"
                        ? "Estimated Monthly Revenue / Turnover Range"
                        : "Estimated Monthly Net Income Range"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={incomeRange}
                      onChange={(e) => setIncomeRange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden bg-white"
                    >
                      <option value="under_250k">Below ₦250,000 / month</option>
                      <option value="250k_500k">₦250,000 - ₦500,000 / month</option>
                      <option value="500k_1m">₦500,000 - ₦1,000,000 / month</option>
                      <option value="1m_3m">₦1,000,000 - ₦3,000,000 / month</option>
                      <option value="above_3m">Above ₦3,000,000 / month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      National Identity Number (NIN) <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="11-digit NIN"
                      value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#048A05]/20 focus:border-[#048A05] outline-hidden"
                    />
                  </div>

                  {/* Reassurance Callout */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#048A05] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="font-semibold block">Safe & Frictionless Intake</strong>
                      <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                        No BVN or sensitive bank statement uploads are requested on the website. Once submitted, the Fortsolar Underwriting Desk reviews your profile, pairs you with our institutional partner, and sends your official paperwork via WhatsApp and email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Buttons */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] text-white text-xs font-bold shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : step < 3 ? (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Submit Finance Request</span>
                      <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
