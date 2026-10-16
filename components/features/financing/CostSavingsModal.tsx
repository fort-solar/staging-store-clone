"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateFinancingBreakdown,
  calculateFuelVsSolarROI,
  DEFAULT_AVAILABLE_TENURES,
  DEFAULT_BASE_MONTHLY_RATE_PCT,
  DEFAULT_MIN_DOWNPAYMENT_PCT,
} from "./financingCalculator";

export interface CostSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrice: number;
  packageName: string;
  packageSlug?: string;
  onBuyOutright?: () => void;
  onBuyWithFinancing?: (terms: { downPaymentPct: number; tenureMonths: number; monthlyInstallment: number }) => void;
}

export function CostSavingsModal({
  isOpen,
  onClose,
  systemPrice,
  packageName,
  packageSlug,
  onBuyOutright,
  onBuyWithFinancing,
}: CostSavingsModalProps) {
  const router = useRouter();

  // Financing options state
  const [downPaymentPct, setDownPaymentPct] = useState<number>(DEFAULT_MIN_DOWNPAYMENT_PCT);
  const [tenureMonths, setTenureMonths] = useState<number>(12);

  // Generator fuel, NEPA/grid electricity & maintenance inputs (NUMBER INPUTS, NOT sliders)
  const [fuelSpendInput, setFuelSpendInput] = useState<string>("85000");
  const [gridSpendInput, setGridSpendInput] = useState<string>("35000");
  const [maintSpendInput, setMaintSpendInput] = useState<string>("15000");

  const monthlyFuel = Math.max(0, Number(fuelSpendInput) || 0);
  const monthlyGrid = Math.max(0, Number(gridSpendInput) || 0);
  const monthlyMaint = Math.max(0, Number(maintSpendInput) || 0);

  // Financing calculation
  const financingResult = useMemo(() => {
    return calculateFinancingBreakdown(
      systemPrice,
      downPaymentPct,
      tenureMonths,
      DEFAULT_BASE_MONTHLY_RATE_PCT
    );
  }, [systemPrice, downPaymentPct, tenureMonths]);

  // Fuel & Grid vs Solar ROI calculation
  const roiResult = useMemo(() => {
    return calculateFuelVsSolarROI(
      systemPrice,
      financingResult.monthlyPayment,
      monthlyFuel,
      monthlyMaint,
      monthlyGrid
    );
  }, [systemPrice, financingResult.monthlyPayment, monthlyFuel, monthlyMaint, monthlyGrid]);

  if (!isOpen) return null;

  const handleOutrightClick = () => {
    if (onBuyOutright) {
      onBuyOutright();
    } else {
      router.push(`/checkout?packageId=${encodeURIComponent(packageSlug || "")}&financing=0`);
    }
    onClose();
  };

  const handleFinancingClick = () => {
    if (onBuyWithFinancing) {
      onBuyWithFinancing({
        downPaymentPct,
        tenureMonths,
        monthlyInstallment: financingResult.monthlyPayment,
      });
    } else {
      router.push(
        `/checkout?packageId=${encodeURIComponent(packageSlug || "")}&financing=1&downpayment=${downPaymentPct}&tenure=${tenureMonths}`
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="pr-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            Cost & Savings Calculator
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">
            Payment Options & Fuel Savings
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Compare paying outright versus spreading your investment with solar financing for <strong>{packageName}</strong>.
          </p>
        </div>

        {/* Section 1: Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* Option A: Pay Outright */}
          <div className="rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 p-6 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Option 1
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  Zero Interest
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-2">Pay Outright</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Single upfront purchase with full system ownership and immediate warranty activation.
              </p>

              <div className="mt-5 pb-5 border-b border-neutral-200 dark:border-neutral-800">
                <div className="text-3xl font-black text-neutral-900 dark:text-white">
                  ₦{systemPrice.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  1-time payment • No monthly recurring commitment
                </div>
              </div>

              <ul className="space-y-2 mt-4 text-xs text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Lowest total cost of ownership (₦0 interest)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Fastest path to positive ROI & fuel elimination</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Immediate dispatch and installation scheduling</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleOutrightClick}
              className="mt-6 w-full py-3 px-4 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 transition-colors shadow-sm"
            >
              Order System Package (Pay Outright)
            </button>
          </div>

          {/* Option B: Spread Payments (Financing) */}
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/10 p-6 flex flex-col justify-between relative shadow-sm">
            <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
              Most Flexible
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Option 2
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  4% / mo flat rate
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mt-2">
                Spread Payments (Financing)
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Structured monthly installments with vetted institutional partners.
              </p>

              {/* Installment Highlight */}
              <div className="mt-5 pb-5 border-b border-emerald-200 dark:border-emerald-800/40">
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  ₦{financingResult.monthlyPayment.toLocaleString()}
                  <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400"> / month</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Down Payment: <strong>₦{financingResult.downPaymentAmount.toLocaleString()}</strong> ({downPaymentPct}%) • Tenure:{" "}
                  <strong>{tenureMonths} Months</strong>
                </div>
              </div>

              {/* Interactive Downpayment & Tenure Selectors */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Equity Down Payment:
                  </label>
                  <select
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="w-full text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-neutral-900 dark:text-white"
                  >
                    <option value={30}>30% (Standard Minimum)</option>
                    <option value={40}>40%</option>
                    <option value={50}>50%</option>
                    <option value={60}>60%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Repayment Tenure:
                  </label>
                  <select
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-neutral-900 dark:text-white"
                  >
                    {DEFAULT_AVAILABLE_TENURES.map((t) => (
                      <option key={t} value={t}>
                        {t} Months
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                Total repayment: ₦{financingResult.totalCostWithFinancing.toLocaleString()} (Principal: ₦{financingResult.principalAmount.toLocaleString()} + Interest: ₦{financingResult.totalInterest.toLocaleString()})
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinancingClick}
              className="mt-6 w-full py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Buy with Financing →
            </button>
          </div>
        </div>

        {/* Section 2: Generator Fuel, NEPA Grid & Power Bill Offset Engine */}
        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                How Much Are You Currently Spending on Power?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Enter your monthly generator fuel, NEPA / grid bill, and maintenance expenses to calculate your net savings.
              </p>
            </div>
            <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Total Current Monthly Energy Cost:{" "}
              <strong className="text-rose-600 dark:text-rose-400 text-sm">
                ₦{roiResult.totalMonthlyCurrentSpend.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Number Inputs (NO SLIDERS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Monthly Generator Fuel (₦) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₦</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={fuelSpendInput}
                  onChange={(e) => setFuelSpendInput(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">Petrol or diesel generator burn</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Monthly NEPA / Grid Spend (₦) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₦</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={gridSpendInput}
                  onChange={(e) => setGridSpendInput(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">Prepaid meter units or DisCo bill</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Generator Servicing & Oil (₦) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">₦</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={maintSpendInput}
                  onChange={(e) => setMaintSpendInput(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">Oil changes, repairs & filters</span>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Annual Power Burn</span>
              <strong className="text-base text-neutral-900 dark:text-white mt-1 block">
                ₦{roiResult.annualCurrentSpend.toLocaleString()}
              </strong>
              <span className="text-[10px] text-neutral-400">12 mo fuel + NEPA + service</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Monthly Cashflow Shift</span>
              <strong
                className={`text-base mt-1 block ${
                  roiResult.netMonthlyCashflow >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-900 dark:text-white"
                }`}
              >
                {roiResult.netMonthlyCashflow >= 0 ? "+" : ""}₦
                {roiResult.netMonthlyCashflow.toLocaleString()}
              </strong>
              <span className="text-[10px] text-neutral-400">vs monthly solar payment</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Estimated Payback</span>
              <strong className="text-base text-neutral-900 dark:text-white mt-1 block">
                {roiResult.paybackPeriodYears > 0 ? `${roiResult.paybackPeriodYears} Years` : "—"}
              </strong>
              <span className="text-[10px] text-neutral-400">Break-even on system</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">5-Year Net Savings</span>
              <strong className="text-base text-emerald-600 dark:text-emerald-400 mt-1 block">
                ₦{roiResult.fiveYearSavings.toLocaleString()}
              </strong>
              <span className="text-[10px] text-neutral-400">Cumulative energy savings</span>
            </div>
          </div>
        </div>

        {/* Footer Fine Print */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <p className="max-w-xl">
            * Estimates based on standard 4% monthly flat rate. Final financing terms, tenure, and approved rates are confirmed upon partner review.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-600 dark:text-neutral-300 hover:underline font-medium self-end sm:self-auto shrink-0"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
}
