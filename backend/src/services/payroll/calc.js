import { resolvePolicy } from './policyResolver.js';

/**
 * Tính thuế TNCN theo biểu thuế lũy tiến từng phần 5 bậc 2026:
 * Bậc 1: <= 10M: 5%
 * Bậc 2: 10M - 30M: 10%
 * Bậc 3: 30M - 60M: 20%
 * Bậc 4: 60M - 100M: 30%
 * Bậc 5: > 100M: 35%
 */
export const calculatePIT = (assessableIncome) => {
  if (assessableIncome <= 0) return 0;

  let tax = 0;
  let remaining = assessableIncome;

  const brackets = [
    { limit: 10000000, rate: 0.05 },
    { limit: 20000000, rate: 0.10 }, // 30M - 10M
    { limit: 30000000, rate: 0.20 }, // 60M - 30M
    { limit: 40000000, rate: 0.30 }, // 100M - 60M
    { limit: Infinity, rate: 0.35 },
  ];

  for (const b of brackets) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, b.limit);
    tax += taxableInBracket * b.rate;
    remaining -= taxableInBracket;
  }

  return Math.round(tax);
};

/**
 * Công thức tính lương 3 bước chuẩn Pháp lý 2026:
 * Bước 1: Tổng thu nhập (Gross)
 * Bước 2: Thu nhập chịu thuế = Gross - Khoản miễn thuế
 * Bước 3: Thu nhập tính thuế = Thu nhập chịu thuế - Giảm trừ (BHXH 10.5% + Bản thân 15.5M + Phụ thuộc 6.2M)
 */
export const calculatePayroll = ({
  companySettings,
  period,
  baseSalary,
  positionAllowance = 0,
  mealAllowance = 0,
  otherBonus = 0,
  dependentsCount = 0,
  standardWorkingDays = 22,
  actualWorkingDays = 22,
  otHoursWeekday = 0,
  otHoursWeekend = 0,
  otHoursHoliday = 0,
  otHoursNight = 0,
  nightWorkHours = 0,
  unusedLeaveDays = 0,
}) => {
  const { taxPolicy, insuranceRate, capBhtn } = resolvePolicy(companySettings, period);

  // Lương theo ngày công thực tế
  const hourlyRate = (baseSalary / standardWorkingDays) / 8;
  const baseSalaryProrated = Math.round((baseSalary / standardWorkingDays) * actualWorkingDays);

  // 1. OT Pay & Night Pay calculations
  const otWeekdayPay = Math.round(otHoursWeekday * hourlyRate * 1.5);
  const otWeekendPay = Math.round(otHoursWeekend * hourlyRate * 2.0);
  const otHolidayPay = Math.round(otHoursHoliday * hourlyRate * 3.0);
  // OT đêm ngày thường: 210% (150% + 30% + 20% x 1.5)
  const otNightPay = Math.round(otHoursNight * hourlyRate * 2.1);
  const otPayTotal = otWeekdayPay + otWeekendPay + otHolidayPay + otNightPay;

  // Tiền làm việc ban đêm (phụ cấp 30%)
  const nightPayTotal = Math.round(nightWorkHours * hourlyRate * 0.3);

  // Tiền phép chưa nghỉ
  const unusedLeavePay = Math.round(unusedLeaveDays * (baseSalary / standardWorkingDays));

  // BƯỚC 1: TỔNG THU NHẬP (GROSS)
  const grossIncome = baseSalaryProrated +
    positionAllowance +
    mealAllowance +
    otherBonus +
    otPayTotal +
    nightPayTotal +
    unusedLeavePay;

  // BƯỚC 2: THU NHẬP CHỊU THUẾ (Trừ miễn thuế hợp lệ)
  // Miễn thuế OT: phần chênh lệch vượt 1.0 (50% ngày thường, 100% nghỉ tuần, 200% ngày lễ, 110% OT đêm)
  const taxExemptOt = Math.round(
    otHoursWeekday * hourlyRate * 0.5 +
    otHoursWeekend * hourlyRate * 1.0 +
    otHoursHoliday * hourlyRate * 2.0 +
    otHoursNight * hourlyRate * 1.1
  );

  // Tiền làm đêm miễn thuế (30% phụ cấp đêm)
  const taxExemptNight = nightPayTotal;

  // Tiền phép chưa nghỉ miễn thuế
  const taxExemptLeave = unusedLeavePay;

  // Tiền ăn ca miễn thuế (≤ 730k trước 1/7/2026, ≤ 1.2M từ 1/7/2026)
  const mealAllowanceCap = taxPolicy.mealAllowanceExemptCap || 730000;
  const taxExemptMeal = Math.min(mealAllowance, mealAllowanceCap);

  const taxableIncome = Math.max(0, grossIncome - taxExemptOt - taxExemptNight - taxExemptMeal - taxExemptLeave);

  // BƯỚC 3: THU NHẬP TÍNH THUẾ & BẢO HIỂM
  // insurableSalary loại trừ OT, tiền đêm, ăn ca, thưởng
  const insurableSalary = baseSalary + positionAllowance;
  const cappedBhxh = Math.min(insurableSalary, insuranceRate.capBhxhBhyt);
  const cappedBhtn = Math.min(insurableSalary, capBhtn);

  const bhxhEmployee = Math.round(cappedBhxh * 0.08);
  const bhytEmployee = Math.round(cappedBhxh * 0.015);
  const bhtnEmployee = Math.round(cappedBhtn * 0.01);
  const totalInsuranceEmployee = bhxhEmployee + bhytEmployee + bhtnEmployee; // 10.5%

  const personalDeduction = taxPolicy.personalDeduction || 15500000;
  const dependentDeduction = (taxPolicy.dependentDeduction || 6200000) * dependentsCount;

  // Thu nhập tính thuế = Thu nhập chịu thuế - BHXH - Giảm trừ bản thân - Giảm trừ phụ thuộc
  const assessableIncome = Math.max(0, taxableIncome - totalInsuranceEmployee - personalDeduction - dependentDeduction);

  const pit = calculatePIT(assessableIncome);

  // Net Salary = Gross - Bảo hiểm - Thuế TNCN
  const netSalary = grossIncome - totalInsuranceEmployee - pit;

  return {
    grossIncome,
    baseSalaryProrated,
    otPayTotal,
    nightPayTotal,
    unusedLeavePay,
    mealAllowanceTotal: mealAllowance,

    taxExemptOt,
    taxExemptNight,
    taxExemptMeal,
    taxExemptLeave,
    taxableIncome,

    insurableSalary,
    cappedBhxh,
    cappedBhtn,
    bhxhEmployee,
    bhytEmployee,
    bhtnEmployee,
    totalInsuranceEmployee,

    personalDeduction,
    dependentDeduction,
    assessableIncome,
    personalIncomeTax: pit,
    netSalary,
  };
};
