"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Fuel,
  TrendingDown,
  Sparkles,
  Zap,
  Leaf,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  calculateFuelVsSolarROI,
  type FuelSavingsResult,
} from "./financingCalculator";

interface FuelSavingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  packageTitle: string;
  packagePrice: number;
  monthlyInstallment?: number;
  onSelectPlan?: () => void;
}

export default function FuelSavingsDrawer({
  isOpen,
  onClose,
  packageTitle,
  packagePrice,
  monthlyInstallment,
  onSelectPlan,
}: FuelSavingsDrawerProps) {
  // Default estimate: 12-month installment at 30% down, ~2.5% monthly flat
  const defaultMonthlyInstallment = useMemo(() => {
    if (monthlyInstallment && monthlyInstallment > 0) return monthlyInstallment;
    const principal = packagePrice * 0.7;
    const interest = principal * 0.025 * 12;
    return Math.round((principal + interest) / 12);
  }, [monthlyInstallment, packagePrice]);

  const [fuelSpend, setFuelSpend] = useState<number>(120000);
  const [maintenanceSpend, setMaintenanceSpend] = useState<number>(25000);

  const roi: FuelSavingsResult = useMemo(() => {
    return calculateFuelVsSolarROI(
      packagePrice,
      defaultMonthlyInstallment,
      fuelSpend,
      maintenanceSpend
    );
  }, [packagePrice, defaultMonthlyInstallment, fuelSpend, maintenanceSpend]);

  if (!isOpen) return null;

  const isNetCashPositive = roi.netMonthlyCashflow > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-700">
              <Fuel className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Generator Fuel vs Solar ROI
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Calculate how quickly <span className="font-semibold text-gray-800">{packageTitle}</span> pays for itself
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Inputs Section */}
          <div className="space-y-4">
            {/* Monthly Fuel Spend */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Monthly Petrol / Diesel Spend</span>
                <span className="text-sm font-bold text-amber-700">
                  ₦{fuelSpend.toLocaleString()} / mo
                </span>
              </div>
              <input
                type="range"
                min={20000}
                max={600000}
                step={10000}
                value={fuelSpend}
                onChange={(e) => setFuelSpend(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[50000, 100000, 150000, 250000, 400000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFuelSpend(amt)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition ${
                      fuelSpend === amt
                        ? "border-amber-600 bg-amber-50 text-amber-800 font-bold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    ₦{(amt / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Generator Servicing & Oil */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Monthly Generator Servicing & Oil Repairs</span>
                <span className="text-sm font-bold text-gray-800">
                  ₦{maintenanceSpend.toLocaleString()} / mo
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100000}
                step={5000}
                value={maintenanceSpend}
                onChange={(e) => setMaintenanceSpend(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[0, 15000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMaintenanceSpend(amt)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium cursor-pointer transition ${
                      maintenanceSpend === amt
                        ? "border-gray-700 bg-gray-100 text-gray-900 font-bold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {amt === 0 ? "₦0" : `₦${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4.5">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                Current Monthly Gen Spend
              </span>
              <div className="text-2xl font-black text-rose-950 mt-1">
                ₦{roi.totalMonthlyGeneratorSpend.toLocaleString()}
                <span className="text-xs font-normal text-rose-600"> / mo</span>
              </div>
              <p className="text-xs text-rose-700/80 mt-1">
                Annual generator drain: <strong>₦{roi.annualGeneratorSpend.toLocaleString()}</strong>
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4.5">
              <span className="text-xs font-semibold text-[#048A05] uppercase tracking-wider block">
                Solar Monthly Installment
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                ₦{roi.solarMonthlyInstallment.toLocaleString()}
                <span className="text-xs font-normal text-emerald-700"> / mo</span>
              </div>
              <p className="text-xs text-emerald-700/80 mt-1">
                Zero fuel, silent power, 100% owned after completion
              </p>
            </div>
          </div>

          {/* Instant Monthly Cashflow Callout */}
          <div
            className={`rounded-2xl p-4.5 border ${
              isNetCashPositive
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-blue-50 border-blue-200 text-blue-950"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isNetCashPositive ? "bg-emerald-500/20 text-[#048A05]" : "bg-blue-500/20 text-blue-700"
                }`}
              >
                {isNetCashPositive ? <TrendingDown className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {isNetCashPositive
                    ? `Instant Positive Cashflow: Save ₦${roi.netMonthlyCashflow.toLocaleString()} Every Month!`
                    : `Slight difference during installment period; 100% Free Power Thereafter`}
                </h4>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {isNetCashPositive
                    ? `Your current fuel & maintenance spend (₦${roi.totalMonthlyGeneratorSpend.toLocaleString()}/mo) is higher than your monthly solar installment (₦${roi.solarMonthlyInstallment.toLocaleString()}/mo). Financing solar actually leaves more money in your pocket starting in month 1.`
                    : `Your monthly solar installment is ₦${roi.solarMonthlyInstallment.toLocaleString()}/mo. Once your 12-month tenure completes, you have zero recurring fuel bills for 25+ years.`}
                </p>
              </div>
            </div>
          </div>

          {/* Payback & Long-term Savings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-500 block">Break-even Payback</span>
              <strong className="text-base font-black text-gray-900 block mt-1">
                {roi.paybackPeriodYears} Yrs
              </strong>
              <span className="text-[10px] text-gray-500">({roi.paybackPeriodMonths} Months)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-500 block">5-Year Net Savings</span>
              <strong className="text-base font-black text-[#048A05] block mt-1">
                ₦{(roi.fiveYearSavings / 1000000).toFixed(1)}M
              </strong>
              <span className="text-[10px] text-gray-500">Cumulative cash saved</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-500 block">10-Year Net Savings</span>
              <strong className="text-base font-black text-[#048A05] block mt-1">
                ₦{(roi.tenYearSavings / 1000000).toFixed(1)}M
              </strong>
              <span className="text-[10px] text-gray-500">Cumulative cash saved</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-500 block">Fuel Avoided / Year</span>
              <strong className="text-base font-black text-gray-900 block mt-1">
                {roi.annualFuelLitersSaved.toLocaleString()} L
              </strong>
              <span className="text-[10px] text-gray-500">~{roi.annualCo2AvoidedKg}kg CO₂ saved</span>
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
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPlan?.();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <span>Lock in Solar Financing</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
