export const DEFAULT_BASE_MONTHLY_RATE_PCT = 4.0; // 4% monthly flat rate (48% p.a.)
export const DEFAULT_MIN_DOWNPAYMENT_PCT = 30; // 30% minimum equity
export const DEFAULT_AVAILABLE_TENURES = [3, 6, 9, 12]; // Standard tenure options in months

export interface AmortizationRow {
  month: number;
  beginningBalance: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  endingBalance: number;
}

export interface CalculationResult {
  systemPrice: number;
  downPaymentPct: number;
  downPaymentAmount: number;
  principalAmount: number;
  tenureMonths: number;
  monthlyRatePct: number;
  annualRatePct: number;
  interestType: "flat";
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  totalCostWithFinancing: number;
  schedule: AmortizationRow[];
}

/**
 * Standard Solar Financing Breakdown
 * Calculates flat monthly installment at standard 4% monthly flat rate (48% p.a.).
 */
export function calculateFinancingBreakdown(
  systemPrice: number,
  downPaymentPct: number = DEFAULT_MIN_DOWNPAYMENT_PCT,
  tenureMonths: number = 12,
  monthlyRatePct: number = DEFAULT_BASE_MONTHLY_RATE_PCT
): CalculationResult {
  const safePrice = Math.max(0, systemPrice);
  const safeDownPct = Math.min(90, Math.max(10, downPaymentPct));
  const safeTenure = Math.max(1, tenureMonths);
  const safeRate = Math.max(0, monthlyRatePct);

  const downPaymentAmount = Math.round(safePrice * (safeDownPct / 100));
  const principalAmount = Math.max(0, safePrice - downPaymentAmount);

  if (principalAmount <= 0) {
    return {
      systemPrice: safePrice,
      downPaymentPct: safeDownPct,
      downPaymentAmount,
      principalAmount: 0,
      tenureMonths: safeTenure,
      monthlyRatePct: safeRate,
      annualRatePct: safeRate * 12,
      interestType: "flat",
      monthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      totalCostWithFinancing: safePrice,
      schedule: [],
    };
  }

  // Standard flat rate: Total Interest = Principal * (monthlyRatePct / 100) * tenureMonths
  const totalInterest = Math.round(principalAmount * (safeRate / 100) * safeTenure);
  const totalRepayment = principalAmount + totalInterest;
  const monthlyPayment = Math.round(totalRepayment / safeTenure);

  const schedule: AmortizationRow[] = [];
  const monthlyPrincipalPortion = Math.round(principalAmount / safeTenure);
  const monthlyInterestPortion = Math.round(totalInterest / safeTenure);
  let currentBalance = principalAmount;

  for (let m = 1; m <= safeTenure; m++) {
    const ending = Math.max(0, currentBalance - monthlyPrincipalPortion);
    schedule.push({
      month: m,
      beginningBalance: currentBalance,
      monthlyPayment: monthlyPayment,
      principalPayment: monthlyPrincipalPortion,
      interestPayment: monthlyInterestPortion,
      endingBalance: m === safeTenure ? 0 : ending,
    });
    currentBalance = ending;
  }

  return {
    systemPrice: safePrice,
    downPaymentPct: safeDownPct,
    downPaymentAmount,
    principalAmount,
    tenureMonths: safeTenure,
    monthlyRatePct: safeRate,
    annualRatePct: safeRate * 12,
    interestType: "flat",
    monthlyPayment,
    totalInterest,
    totalRepayment,
    totalCostWithFinancing: downPaymentAmount + totalRepayment,
    schedule,
  };
}

export interface FuelSavingsResult {
  monthlyFuelSpend: number;
  monthlyMaintenanceSpend: number;
  totalMonthlyGeneratorSpend: number;
  annualGeneratorSpend: number;
  solarMonthlyInstallment: number;
  netMonthlyCashflow: number; // positive = saves money every month compared to generator
  paybackPeriodMonths: number;
  paybackPeriodYears: number;
  fiveYearSavings: number;
  tenYearSavings: number;
  annualFuelLitersSaved: number;
  annualCo2AvoidedKg: number;
}

export function calculateFuelVsSolarROI(
  systemPrice: number,
  monthlyInstallment: number,
  monthlyFuelSpend: number,
  monthlyMaintenanceSpend: number = 0,
  estimatedFuelCostPerLiter: number = 1150
): FuelSavingsResult {
  const safeFuel = Math.max(0, monthlyFuelSpend);
  const safeMaint = Math.max(0, monthlyMaintenanceSpend);
  const totalMonthlyGen = safeFuel + safeMaint;
  const annualGen = totalMonthlyGen * 12;

  const netMonthlyCashflow = totalMonthlyGen - monthlyInstallment;
  const paybackPeriodMonths =
    totalMonthlyGen > 0 ? Math.max(1, Math.round((systemPrice / totalMonthlyGen) * 10) / 10) : 0;
  const paybackPeriodYears = Math.round((paybackPeriodMonths / 12) * 10) / 10;

  // Assuming modest 8% annual fuel inflation over 5 and 10 years
  let cumulativeGenSpend5 = 0;
  let cumulativeGenSpend10 = 0;
  let currentAnnualGen = annualGen;
  for (let yr = 1; yr <= 10; yr++) {
    if (yr <= 5) cumulativeGenSpend5 += currentAnnualGen;
    cumulativeGenSpend10 += currentAnnualGen;
    currentAnnualGen *= 1.08;
  }

  // Solar maintenance assumption: System Price + modest 2% annual solar maintenance after year 2
  const solarCost5 = systemPrice * 1.05;
  const solarCost10 = systemPrice * 1.15;

  const fiveYearSavings = Math.max(0, Math.round(cumulativeGenSpend5 - solarCost5));
  const tenYearSavings = Math.max(0, Math.round(cumulativeGenSpend10 - solarCost10));

  const annualFuelLitersSaved = Math.round(
    (safeFuel * 12) / Math.max(500, estimatedFuelCostPerLiter)
  );
  // ~2.31 kg of CO2 per liter of petrol burned
  const annualCo2AvoidedKg = Math.round(annualFuelLitersSaved * 2.31);

  return {
    monthlyFuelSpend: safeFuel,
    monthlyMaintenanceSpend: safeMaint,
    totalMonthlyGeneratorSpend: totalMonthlyGen,
    annualGeneratorSpend: annualGen,
    solarMonthlyInstallment: monthlyInstallment,
    netMonthlyCashflow,
    paybackPeriodMonths,
    paybackPeriodYears,
    fiveYearSavings,
    tenYearSavings,
    annualFuelLitersSaved,
    annualCo2AvoidedKg,
  };
}
