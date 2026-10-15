import { calculatePayroll, calculatePIT } from '../../src/services/payroll/calc.js';

describe('Payroll Engine 2026 Unit Tests', () => {
  const mockCompanySettings = {
    region: 'I',
    taxPolicies: [
      {
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-06-30',
        personalDeduction: 15500000,
        dependentDeduction: 6200000,
        mealAllowanceExemptCap: 730000,
      },
      {
        effectiveFrom: '2026-07-01',
        effectiveTo: null,
        personalDeduction: 15500000,
        dependentDeduction: 6200000,
        mealAllowanceExemptCap: 1200000,
      },
    ],
    insuranceRates: [
      {
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-06-30',
        employeeRate: 0.105,
        employerRate: 0.215,
        capBhxhBhyt: 46800000,
        capBhtn: 'LOOKUP_MIN_WAGE',
      },
      {
        effectiveFrom: '2026-07-01',
        effectiveTo: null,
        employeeRate: 0.105,
        employerRate: 0.215,
        capBhxhBhyt: 50600000,
        capBhtn: 'LOOKUP_MIN_WAGE',
      },
    ],
    minWageByRegion: [
      {
        effectiveFrom: '2026-01-01',
        effectiveTo: null,
        wages: { I: 5310000, II: 4730000, III: 4140000, IV: 3700000 },
      },
    ],
  };

  test('Biểu thuế 5 bậc mới 2026: 10M, 30M, 60M, 100M', () => {
    // 0đ -> 0đ
    expect(calculatePIT(0)).toBe(0);

    // 10M -> 5% = 500k
    expect(calculatePIT(10000000)).toBe(500000);

    // 25M -> 10M * 5% + 15M * 10% = 500k + 1.5M = 2.000.000đ
    expect(calculatePIT(25000000)).toBe(2000000);

    // 30M -> 10M * 5% + 20M * 10% = 500k + 2M = 2.500.000đ
    expect(calculatePIT(30000000)).toBe(2500000);

    // 50M -> 2.5M + 20M * 20% = 6.500.000đ
    expect(calculatePIT(50000000)).toBe(6500000);
  });

  test('Case 1: Lương cơ bản 20M, không OT, không phụ thuộc (Kỳ 2026-03)', () => {
    const result = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 20000000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      dependentsCount: 0,
    });

    // BHXH 10.5% của 20M = 2.100.000đ
    expect(result.totalInsuranceEmployee).toBe(2100000);

    // Thu nhập chịu thuế = 20M
    expect(result.taxableIncome).toBe(20000000);

    // Thu nhập tính thuế = 20M - 2.1M - 15.5M (bản thân) = 2.400.000đ
    expect(result.assessableIncome).toBe(2400000);

    // Thuế TNCN = 2.4M * 5% = 120.000đ
    expect(result.personalIncomeTax).toBe(120000);

    // Lương Net = 20M - 2.1M - 120k = 17.780.000đ
    expect(result.netSalary).toBe(17780000);
  });

  test('Case 17a vs 18a: Trần ăn ca 730k trước 1/7 và 1.2M từ 1/7/2026', () => {
    // Tháng 5/2026: Tiền ăn ca 1.000.000đ -> Trần miễn thuế là 730.000đ
    const resMay = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-05',
      baseSalary: 15000000,
      mealAllowance: 1000000,
    });
    expect(resMay.taxExemptMeal).toBe(730000);

    // Tháng 8/2026: Tiền ăn ca 1.000.000đ -> Trần miễn thuế là 1.200.000đ -> Miễn đủ 1.000.000đ
    const resAug = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-08',
      baseSalary: 15000000,
      mealAllowance: 1000000,
    });
    expect(resAug.taxExemptMeal).toBe(1000000);
  });
});
