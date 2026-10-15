/**
 * Resolves tax and insurance policies based on payroll period (YYYY-MM).
 * In 2026:
 * - Period < "2026-07": BHXH cap = 46.8M, Meal Allowance exempt cap = 730k.
 * - Period >= "2026-07": BHXH cap = 50.6M, Meal Allowance exempt cap = 1.2M.
 */
export const resolvePolicy = (companySettings, period) => {
  const periodDate = `${period}-01`;

  const taxPolicy = companySettings.taxPolicies?.find((p) => {
    const fromOk = p.effectiveFrom <= periodDate;
    const toOk = !p.effectiveTo || p.effectiveTo >= periodDate;
    return fromOk && toOk;
  }) || {
    personalDeduction: 15500000,
    dependentDeduction: 6200000,
    mealAllowanceExemptCap: period >= '2026-07' ? 1200000 : 730000,
    brackets: [
      { bracket: 1, maxIncome: 10000000, rate: 0.05 },
      { bracket: 2, maxIncome: 30000000, rate: 0.10 },
      { bracket: 3, maxIncome: 60000000, rate: 0.20 },
      { bracket: 4, maxIncome: 100000000, rate: 0.30 },
      { bracket: 5, maxIncome: Infinity, rate: 0.35 },
    ],
  };

  const insuranceRate = companySettings.insuranceRates?.find((r) => {
    const fromOk = r.effectiveFrom <= periodDate;
    const toOk = !r.effectiveTo || r.effectiveTo >= periodDate;
    return fromOk && toOk;
  }) || {
    employeeRate: 0.105,
    employerRate: 0.215,
    capBhxhBhyt: period >= '2026-07' ? 50600000 : 46800000,
    capBhtn: 'LOOKUP_MIN_WAGE',
  };

  const region = companySettings.region || 'I';
  const minWageRecord = companySettings.minWageByRegion?.find((m) => {
    const fromOk = m.effectiveFrom <= periodDate;
    const toOk = !m.effectiveTo || m.effectiveTo >= periodDate;
    return fromOk && toOk;
  });

  const regionalMinWage = minWageRecord?.wages?.[region] || 5310000;
  const capBhtn = 20 * regionalMinWage; // 20 x 5.310.000 = 106.200.000 VNĐ cho Vùng I

  return {
    taxPolicy,
    insuranceRate,
    regionalMinWage,
    capBhtn,
  };
};
