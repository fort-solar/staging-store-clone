export interface FinancingProfileOption {
  id: string;
  label: string;
  subtitle: string;
  icon: "salary" | "business" | "individual";
  targetAudience: "salary_earner" | "business" | "individual";
  defaultMonthlyRatePct: number;
  minDownpaymentPct: number;
  availableTenures: number[];
  defaultInterestType: "flat" | "reducing";
  recommendedPartner: string;
}

export const FINANCING_PROFILES: FinancingProfileOption[] = [
  {
    id: "salary_earner",
    label: "Salary Earner",
    subtitle: "Low monthly interest (~2.5%) for verified corporate & civil service employees",
    icon: "salary",
    targetAudience: "salary_earner",
    defaultMonthlyRatePct: 2.5,
    minDownpaymentPct: 30,
    availableTenures: [6, 12, 18, 24],
    defaultInterestType: "flat",
    recommendedPartner: "CheckOff Solar Credit",
  },
  {
    id: "business",
    label: "Registered Business / SME",
    subtitle: "Low commercial rate (~2.0%) for registered enterprises, clinics & schools",
    icon: "business",
    targetAudience: "business",
    defaultMonthlyRatePct: 2.0,
    minDownpaymentPct: 30,
    availableTenures: [6, 12, 18, 24],
    defaultInterestType: "reducing",
    recommendedPartner: "Altpower SME Financing",
  },
  {
    id: "individual",
    label: "Individual / Retail",
    subtitle: "Flexible consumer solar credit (~4.0% flat) for general private buyers",
    icon: "individual",
    targetAudience: "individual",
    defaultMonthlyRatePct: 4.0,
    minDownpaymentPct: 30,
    availableTenures: [6, 12],
    defaultInterestType: "flat",
    recommendedPartner: "Fortsolar Standard",
  },
];

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
  interestType: "flat" | "reducing";
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  schedule: AmortizationRow[];
}

export function calculateFinancingBreakdown(
  systemPrice: number,
  downPaymentPct: number,
  tenureMonths: number,
  monthlyRatePct: number,
  interestType: "flat" | "reducing" = "flat"
): CalculationResult {
  const safePrice = Math.max(0, systemPrice);
  const safeDownPct = Math.min(90, Math.max(10, downPaymentPct));
  const safeTenure = Math.max(1, tenureMonths);
  const safeRate = Math.max(0, monthlyRatePct);

  const downPaymentAmount = Math.round(safePrice * (safeDownPct / 100));
  const principalAmount = Math.max(0, safePrice - downPaymentAmount);

  let monthlyPayment = 0;
  let totalInterest = 0;
  const schedule: AmortizationRow[] = [];

  if (principalAmount <= 0) {
    return {
      systemPrice: safePrice,
      downPaymentPct: safeDownPct,
      downPaymentAmount,
      principalAmount: 0,
      tenureMonths: safeTenure,
      monthlyRatePct: safeRate,
      annualRatePct: safeRate * 12,
      interestType,
      monthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      schedule: [],
    };
  }

  if (interestType === "reducing") {
    const monthlyRate = safeRate / 100;
    if (monthlyRate === 0) {
      monthlyPayment = principalAmount / safeTenure;
      totalInterest = 0;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, safeTenure);
      monthlyPayment = principalAmount * ((monthlyRate * compoundFactor) / (compoundFactor - 1));
    }

    let currentBalance = principalAmount;
    for (let m = 1; m <= safeTenure; m++) {
      const interestForMonth = currentBalance * (safeRate / 100);
      let principalForMonth = monthlyPayment - interestForMonth;
      if (m === safeTenure || currentBalance - principalForMonth < 0) {
        principalForMonth = currentBalance;
      }
      const ending = Math.max(0, currentBalance - principalForMonth);
      totalInterest += interestForMonth;

      schedule.push({
        month: m,
        beginningBalance: currentBalance,
        monthlyPayment: principalForMonth + interestForMonth,
        principalPayment: principalForMonth,
        interestPayment: interestForMonth,
        endingBalance: ending,
      });

      currentBalance = ending;
    }
  } else {
    // Flat Rate (Amortization Calculator default pattern)
    // Total Interest = Principal * (Rate/100) * (Tenure/12)
    // Rate is annual rate = monthlyRatePct * 12
    totalInterest = principalAmount * (safeRate / 100) * safeTenure;
    monthlyPayment = (principalAmount + totalInterest) / safeTenure;

    const monthlyPrincipalPortion = principalAmount / safeTenure;
    const monthlyInterestPortion = totalInterest / safeTenure;
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
  }

  return {
    systemPrice: safePrice,
    downPaymentPct: safeDownPct,
    downPaymentAmount,
    principalAmount,
    tenureMonths: safeTenure,
    monthlyRatePct: safeRate,
    annualRatePct: safeRate * 12,
    interestType,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(principalAmount + totalInterest),
    schedule,
  };
}

export interface FuelSavingsResult {
  monthlyFuelSpend: number;
  monthlyMaintenanceSpend: number;
  totalMonthlyGeneratorSpend: number;
  annualGeneratorSpend: number;
  solarMonthlyInstallment: number;
  netMonthlyCashflow: number; // positive = saves money every month compared to gen
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

  // Solar cost: System Price + modest 2% annual solar maintenance after year 2
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
