"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Calculator,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Briefcase,
  User,
  Building,
  ArrowRight,
  Sparkles,
  Info,
  Fuel,
} from "lucide-react";
import {
  FINANCING_PROFILES,
  calculateFinancingBreakdown,
  type FinancingProfileOption,
  type CalculationResult,
} from "./financingCalculator";
import { appGet } from "@/lib/api/client";

interface FinancingBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageTitle: string;
  packagePrice: number;
  packageId?: string | number;
  onProceedToApply: (plan: {
    profileType: string;
    downPaymentPct: number;
    downPaymentAmount: number;
    tenureMonths: number;
    monthlyPayment: number;
    interestType: "flat" | "reducing";
    partnerName: string;
  }) => void;
  onOpenFuelComparison?: () => void;
}

export default function FinancingBreakdownModal({
  isOpen,
  onClose,
  packageTitle,
  packagePrice,
  packageId,
  onProceedToApply,
  onOpenFuelComparison,
}: FinancingBreakdownModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("salary_earner");
  const [downPaymentPct, setDownPaymentPct] = useState<number>(30);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [interestType, setInterestType] = useState<"flat" | "reducing">("flat");
  const [showSchedule, setShowSchedule] = useState(false);
  const [partnerRates, setPartnerRates] = useState<Record<string, { rate: number; name: string }>>({});

  // Fetch active partner rates from backend if available
  useEffect(() => {
    if (!isOpen) return;
    appGet<{ success: boolean; data: any[] }>("/api/v1/customer/financing-partners")
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          const map: Record<string, { rate: number; name: string }> = {};
          res.data.forEach((p) => {
            if (p.target_audience && Array.isArray(p.target_audience)) {
              p.target_audience.forEach((aud: string) => {
                if (!map[aud] || p.monthly_interest_rate_pct < map[aud].rate) {
                  map[aud] = {
                    rate: Number(p.monthly_interest_rate_pct),
                    name: p.name,
                  };
                }
              });
            }
          });
          setPartnerRates(map);
        }
      })
      .catch((e) => {
        console.warn("Using preset financing rates", e);
      });
  }, [isOpen]);

  const activeProfile: FinancingProfileOption = useMemo(() => {
    return (
      FINANCING_PROFILES.find((p) => p.id === selectedProfileId) || FINANCING_PROFILES[0]
    );
  }, [selectedProfileId]);

  // Sync profile defaults when profile changes
  const effectiveMonthlyRate = useMemo(() => {
    if (partnerRates[activeProfile.targetAudience]) {
      return partnerRates[activeProfile.targetAudience].rate;
    }
    return activeProfile.defaultMonthlyRatePct;
  }, [activeProfile, partnerRates]);

  const effectivePartnerName = useMemo(() => {
    if (partnerRates[activeProfile.targetAudience]) {
      return partnerRates[activeProfile.targetAudience].name;
    }
    return activeProfile.recommendedPartner;
  }, [activeProfile, partnerRates]);

  useEffect(() => {
    setInterestType(activeProfile.defaultInterestType);
    if (!activeProfile.availableTenures.includes(tenureMonths)) {
      setTenureMonths(activeProfile.availableTenures[0] || 12);
    }
    if (downPaymentPct < activeProfile.minDownpaymentPct) {
      setDownPaymentPct(activeProfile.minDownpaymentPct);
    }
  }, [activeProfile]);

  const calculation: CalculationResult = useMemo(() => {
    return calculateFinancingBreakdown(
      packagePrice,
      downPaymentPct,
      tenureMonths,
      effectiveMonthlyRate,
      interestType
    );
  }, [packagePrice, downPaymentPct, tenureMonths, effectiveMonthlyRate, interestType]);

  if (!isOpen) return null;

  const handleApply = () => {
    onProceedToApply({
      profileType: activeProfile.id,
      downPaymentPct: calculation.downPaymentPct,
      downPaymentAmount: calculation.downPaymentAmount,
      tenureMonths: calculation.tenureMonths,
      monthlyPayment: calculation.monthlyPayment,
      interestType: calculation.interestType,
      partnerName: effectivePartnerName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#048A05]/10 flex items-center justify-center text-[#048A05]">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Solar Financing Breakdown
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Transparent amortization estimates for <span className="font-semibold text-gray-700">{packageTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Target Applicant Profile Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">
              Select Your Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {FINANCING_PROFILES.map((profile) => {
                const isSelected = profile.id === selectedProfileId;
                const dynamicRate = partnerRates[profile.targetAudience]?.rate ?? profile.defaultMonthlyRatePct;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#048A05] bg-emerald-50/60 ring-2 ring-[#048A05]/20 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {profile.icon === "salary" && <Briefcase className={`h-4 w-4 ${isSelected ? "text-[#048A05]" : "text-gray-500"}`} />}
                        {profile.icon === "business" && <Building className={`h-4 w-4 ${isSelected ? "text-[#048A05]" : "text-gray-500"}`} />}
                        {profile.icon === "individual" && <User className={`h-4 w-4 ${isSelected ? "text-[#048A05]" : "text-gray-500"}`} />}
                        <span className={`text-xs font-bold ${isSelected ? "text-[#048A05]" : "text-gray-900"}`}>
                          {profile.label}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-[#048A05] text-white" : "bg-gray-100 text-gray-700"
                      }`}>
                        {dynamicRate}%/mo
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {profile.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Sliders & Tenure Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4.5 rounded-2xl bg-gray-50 border border-gray-100">
            {/* Downpayment Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Down Payment (Equity)</span>
                <span className="text-sm font-bold text-[#048A05]">
                  {downPaymentPct}% (₦{calculation.downPaymentAmount.toLocaleString()})
                </span>
              </div>
              <input
                type="range"
                min={activeProfile.minDownpaymentPct}
                max={70}
                step={5}
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#048A05]"
              />
              <div className="flex items-center gap-2 mt-2.5">
                {[20, 30, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    disabled={pct < activeProfile.minDownpaymentPct}
                    onClick={() => setDownPaymentPct(pct)}
                    className={`flex-1 py-1 text-xs rounded-lg border font-medium cursor-pointer transition ${
                      downPaymentPct === pct
                        ? "border-[#048A05] bg-white text-[#048A05] shadow-xs font-bold"
                        : pct < activeProfile.minDownpaymentPct
                        ? "opacity-30 cursor-not-allowed border-gray-200"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure & Interest Type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Repayment Period</span>
                <span className="text-sm font-bold text-gray-900">{tenureMonths} Months</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {activeProfile.availableTenures.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTenureMonths(m)}
                    className={`py-2 text-xs rounded-xl border text-center font-medium cursor-pointer transition ${
                      tenureMonths === m
                        ? "border-[#048A05] bg-[#048A05] text-white shadow-xs font-bold"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              {/* Calculation Type Toggle */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/80">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  Amortization Type:
                </span>
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white text-xs">
                  <button
                    type="button"
                    onClick={() => setInterestType("flat")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      interestType === "flat"
                        ? "bg-[#048A05] text-white font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Flat Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestType("reducing")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      interestType === "reducing"
                        ? "bg-[#048A05] text-white font-semibold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Reducing Balance
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Result Spotlight Card */}
          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#048A05]">
                  Estimated Monthly Installment
                </span>
                <div className="text-3xl sm:text-4xl font-black text-gray-950 mt-1">
                  ₦{calculation.monthlyPayment.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-gray-500">/ month</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600">
                  <span>Matched Underwriter:</span>
                  <strong className="text-gray-900">{effectivePartnerName}</strong>
                  <span>• {effectiveMonthlyRate}%/mo</span>
                </div>
              </div>

              {onOpenFuelComparison && (
                <button
                  type="button"
                  onClick={onOpenFuelComparison}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20 transition cursor-pointer"
                >
                  <Fuel className="h-4 w-4 text-amber-600" />
                  <span>Cheaper than your Gen Fuel?</span>
                </button>
              )}
            </div>

            {/* Sub-metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-200/50 text-xs">
              <div>
                <span className="text-gray-500 block">Package Price</span>
                <strong className="text-gray-900 text-sm">₦{packagePrice.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Initial Down Payment</span>
                <strong className="text-[#048A05] text-sm">₦{calculation.downPaymentAmount.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Financed Principal</span>
                <strong className="text-gray-900 text-sm">₦{calculation.principalAmount.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Total Repayment</span>
                <strong className="text-gray-900 text-sm">₦{calculation.totalRepayment.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Full Amortization Schedule Drawer Accordion */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#048A05]" />
                <span className="text-xs font-semibold text-gray-800">
                  Full Monthly Amortization Schedule ({calculation.schedule.length} Months)
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{showSchedule ? "Hide Schedule" : "View Breakdown Table"}</span>
                {showSchedule ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {showSchedule && (
              <div className="max-h-64 overflow-y-auto border-t border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Mo</th>
                      <th className="py-2 px-3">Beginning Balance</th>
                      <th className="py-2 px-3">Monthly Payment</th>
                      <th className="py-2 px-3">Principal</th>
                      <th className="py-2 px-3">Interest</th>
                      <th className="py-2 px-3">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {calculation.schedule.map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-semibold text-gray-900">{row.month}</td>
                        <td className="py-2 px-3 text-gray-600">₦{Math.round(row.beginningBalance).toLocaleString()}</td>
                        <td className="py-2 px-3 font-semibold text-[#048A05]">₦{Math.round(row.monthlyPayment).toLocaleString()}</td>
                        <td className="py-2 px-3 text-gray-600">₦{Math.round(row.principalPayment).toLocaleString()}</td>
                        <td className="py-2 px-3 text-gray-600">₦{Math.round(row.interestPayment).toLocaleString()}</td>
                        <td className="py-2 px-3 text-gray-600">₦{Math.round(row.endingBalance).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Underwriting Transparency Reassurance */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-semibold block">Frictionless Institutional Application</strong>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                No BVN or sensitive bank statement uploads are requested on the public website. Once you submit, Fortsolar matches your profile with the appropriate lender (CheckOff, Altpower, or Sterling Bank) and our desk coordinates directly with you.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <span>Proceed with this Plan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
