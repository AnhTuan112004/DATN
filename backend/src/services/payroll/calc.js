import { resolvePolicy } from './policyResolver.js';

/**
 * Tính thuế TNCN theo biểu thuế lũy tiến từng phần 5 bậc 2026:
 * Bậc 1: <= 10M: 5% (0.05 * TNTT)
 * Bậc 2: 10M - 30M: 10% (0.10 * TNTT - 500.000)
 * Bậc 3: 30M - 60M: 20% (0.20 * TNTT - 3.500.000)
 * Bậc 4: 60M - 100M: 30% (0.30 * TNTT - 9.500.000)
 * Bậc 5: > 100M: 35% (0.35 * TNTT - 14.500.000)
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
 * Công thức tính lương 3 bước chuẩn Pháp lý Việt Nam 2026:
 * - Bước 1: Tổng thu nhập (Gross)
 * - Bước 2: Thu nhập chịu thuế = Gross - Khoản miễn thuế hợp lệ
 *   * ĐIỂM MỚI 2026: Toàn bộ tiền OT (150%, 200%, 300%) được miễn thuế nếu nằm trong hạn mức luật định.
 * - Bước 3: Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản giảm trừ
 */
export const calculatePayroll = ({
  companySettings = {},
  period = '2026-01',
  payDate = null,
  baseSalary = 0,
  positionAllowance = 0,
  mealAllowance = 0,
  otherBonus = 0,
  dependentsCount = 0,
  standardWorkingDays = 22,
  actualWorkingDays = 22,
  paidLeaveDays = 0, // Ngày nghỉ phép năm / lễ tết hưởng nguyên lương
  unpaidLeaveDays = 0,
  sickLeaveDays = 0, // Nghỉ ốm hưởng chế độ BHXH
  // Làm thêm giờ (OT)
  otHoursWeekday = 0,
  otHoursWeekend = 0,
  otHoursHoliday = 0,
  otHoursNight = 0,
  hasDaytimeOtBeforeNight = false, // Điều 57 NĐ 145/2020: có làm thêm ban ngày trước đó không
  nightWorkHours = 0,
  unusedLeaveDays = 0,
  // Cấu hình hạn mức OT và hệ số công ty chi trả
  monthlyOtCapHours = 40,
  dailyOverCapHours = 0, // Số giờ OT vi phạm trần ngày (> 4h/ngày)
  yearlyOverCapHours = 0, // Số giờ OT vi phạm trần năm (> 200h/năm)
  multiplierWeekday = 1.5,
  multiplierWeekend = 2.0,
  multiplierHoliday = 3.0,
  multiplierNight = null,
}) => {
  const { taxPolicy, insuranceRate, capBhtn, paymentDate } = resolvePolicy(companySettings, period, payDate);

  // Đơn giá giờ làm việc chuẩn (theo số ngày công chuẩn và 8h/ngày)
  const dailyRate = baseSalary / standardWorkingDays;
  const hourlyRate = dailyRate / 8;

  // Lương theo ngày công thực tế (tính cả ngày làm việc thực tế và ngày nghỉ có hưởng lương)
  const totalPaidDays = actualWorkingDays + paidLeaveDays;
  const baseSalaryProrated = Math.round((baseSalary / standardWorkingDays) * totalPaidDays);

  // 1. TÍNH TIỀN LÀM THÊM GIỜ (OT) THEO ĐIỀU 98 BLLĐ & ĐIỀU 57 NĐ 145/2020
  // Hệ số luật định chuẩn:
  const STATUTORY_OT_WEEKDAY = 1.5;
  const STATUTORY_OT_WEEKEND = 2.0;
  const STATUTORY_OT_HOLIDAY = 3.0;
  // OT đêm ngày thường: 200% nếu không làm thêm ban ngày trước đó; 210% nếu có làm thêm ban ngày trước đó
  const STATUTORY_OT_NIGHT = hasDaytimeOtBeforeNight ? 2.1 : 2.0;

  const actualMultiplierWeekday = Math.max(multiplierWeekday, STATUTORY_OT_WEEKDAY);
  const actualMultiplierWeekend = Math.max(multiplierWeekend, STATUTORY_OT_WEEKEND);
  const actualMultiplierHoliday = Math.max(multiplierHoliday, STATUTORY_OT_HOLIDAY);
  const actualMultiplierNight = Math.max(multiplierNight || 0, STATUTORY_OT_NIGHT);

  // Tổng tiền OT thực trả cho người lao động:
  const otWeekdayPay = Math.round(otHoursWeekday * hourlyRate * actualMultiplierWeekday);
  const otWeekendPay = Math.round(otHoursWeekend * hourlyRate * actualMultiplierWeekend);
  const otHolidayPay = Math.round(otHoursHoliday * hourlyRate * actualMultiplierHoliday);
  const otNightPay = Math.round(otHoursNight * hourlyRate * actualMultiplierNight);
  const otPayTotal = otWeekdayPay + otWeekendPay + otHolidayPay + otNightPay;

  // Tiền phụ cấp làm việc ban đêm (22h - 06h, tối thiểu 30%)
  const nightPayTotal = Math.round(nightWorkHours * hourlyRate * 0.3);

  // Tiền bồi thường phép năm chưa nghỉ
  const unusedLeavePay = Math.round(unusedLeaveDays * dailyRate);

  // BƯỚC 1: TỔNG THU NHẬP (GROSS INCOME)
  const grossIncome = baseSalaryProrated +
    positionAllowance +
    mealAllowance +
    otherBonus +
    otPayTotal +
    nightPayTotal +
    unusedLeavePay;

  // BƯỚC 2: THU NHẬP CHỊU THUẾ & CƠ CHẾ MIỄN THUẾ THEO LUẬT 2026
  // Cơ chế miễn thuế OT:
  // 1. Số giờ nằm trong giới hạn luật định (<= 4h/ngày, <= 40h/tháng, <= 200h/năm): được miễn TOÀN BỘ theo hệ số luật định Điều 98 BLLĐ.
  // 2. Số giờ vượt hạn mức: toàn bộ tiền tương ứng bị tính vào thu nhập chịu thuế.
  // 3. Phần hệ số công ty tự chi trả vượt quy định Điều 98: bị tính vào thu nhập chịu thuế.

  const calculateOtExemption = (hours, actualMult, statutoryMult, capRemaining) => {
    if (hours <= 0) return { exempt: 0, taxable: 0, hoursUsed: 0 };
    const validHours = Math.min(hours, capRemaining);
    const overHours = Math.max(0, hours - capRemaining);

    // Phần tiền trong hạn mức:
    // - Miễn thuế: validHours * hourlyRate * statutoryMult
    // - Chịu thuế (nếu công ty trả cao hơn luật): validHours * hourlyRate * (actualMult - statutoryMult)
    const validExemptPay = validHours * hourlyRate * Math.min(actualMult, statutoryMult);
    const validTaxablePay = validHours * hourlyRate * Math.max(0, actualMult - statutoryMult);

    // Phần tiền của giờ vượt trần (toàn bộ tính vào thu nhập chịu thuế):
    const overPay = overHours * hourlyRate * actualMult;

    return {
      exempt: Math.round(validExemptPay),
      taxable: Math.round(validTaxablePay + overPay),
      hoursUsed: validHours,
    };
  };

  const totalOtHours = otHoursWeekday + otHoursWeekend + otHoursHoliday + otHoursNight;
  const monthlyExcessHours = Math.max(0, totalOtHours - monthlyOtCapHours);
  const totalNonStatutoryHours = Math.min(totalOtHours, monthlyExcessHours + dailyOverCapHours + yearlyOverCapHours);
  let remainingCap = Math.max(0, totalOtHours - totalNonStatutoryHours);

  const otWeekdayCalc = calculateOtExemption(otHoursWeekday, actualMultiplierWeekday, STATUTORY_OT_WEEKDAY, remainingCap);
  remainingCap = Math.max(0, remainingCap - otWeekdayCalc.hoursUsed);

  const otWeekendCalc = calculateOtExemption(otHoursWeekend, actualMultiplierWeekend, STATUTORY_OT_WEEKEND, remainingCap);
  remainingCap = Math.max(0, remainingCap - otWeekendCalc.hoursUsed);

  const otHolidayCalc = calculateOtExemption(otHoursHoliday, actualMultiplierHoliday, STATUTORY_OT_HOLIDAY, remainingCap);
  remainingCap = Math.max(0, remainingCap - otHolidayCalc.hoursUsed);

  const otNightCalc = calculateOtExemption(otHoursNight, actualMultiplierNight, STATUTORY_OT_NIGHT, remainingCap);

  const taxExemptOt = otWeekdayCalc.exempt + otWeekendCalc.exempt + otHolidayCalc.exempt + otNightCalc.exempt;
  const taxableOt = otPayTotal - taxExemptOt;

  // Tiền làm đêm miễn thuế (Khoản phụ cấp đêm 30% theo Điều 26 NĐ 253 [Cần xác minh])
  const taxExemptNight = nightPayTotal;

  // Tiền thanh toán phép chưa nghỉ được miễn thuế
  const taxExemptLeave = unusedLeavePay;

  // Tiền ăn ca miễn thuế theo thời điểm chi trả payDate
  const mealAllowanceCap = taxPolicy.mealAllowanceExemptCap ?? 0;
  const taxExemptMeal = Math.min(mealAllowance, mealAllowanceCap);
  const taxableMeal = Math.max(0, mealAllowance - taxExemptMeal);

  // Thu nhập chịu thuế:
  const totalTaxExempt = taxExemptOt + taxExemptNight + taxExemptMeal + taxExemptLeave;
  const taxableIncome = Math.max(0, grossIncome - totalTaxExempt);

  // BƯỚC 3: THU NHẬP TÍNH THUẾ & BẢO HIỂM
  // insurableSalary loại trừ OT, tiền đêm, ăn ca, thưởng hiệu quả
  const insurableSalary = baseSalary + positionAllowance;

  // Quy tắc nghỉ ốm: Nếu nghỉ ốm >= 14 ngày làm việc trong tháng -> Không phải đóng BHXH, BHYT, BHTN tháng đó
  const isExemptFromInsurance = sickLeaveDays >= 14;

  let bhxhEmployee = 0;
  let bhytEmployee = 0;
  let bhtnEmployee = 0;
  let totalInsuranceEmployee = 0;
  let bhxhEmployer = 0;
  let bhytEmployer = 0;
  let bhtnEmployer = 0;
  let totalInsuranceEmployer = 0;

  const cappedBhxh = Math.min(insurableSalary, insuranceRate.capBhxhBhyt);
  const cappedBhtn = Math.min(insurableSalary, capBhtn);

  if (!isExemptFromInsurance) {
    bhxhEmployee = Math.round(cappedBhxh * 0.08);
    bhytEmployee = Math.round(cappedBhxh * 0.015);
    bhtnEmployee = Math.round(cappedBhtn * 0.01);
    totalInsuranceEmployee = bhxhEmployee + bhytEmployee + bhtnEmployee; // 10.5%

    bhxhEmployer = Math.round(cappedBhxh * 0.175);
    bhytEmployer = Math.round(cappedBhxh * 0.03);
    bhtnEmployer = Math.round(cappedBhtn * 0.01);
    totalInsuranceEmployer = bhxhEmployer + bhytEmployer + bhtnEmployer; // 21.5%
  }

  const personalDeduction = taxPolicy.personalDeduction ?? 0;
  const dependentDeduction = (taxPolicy.dependentDeduction ?? 0) * dependentsCount;

  // Thu nhập tính thuế = Thu nhập chịu thuế - Bảo hiểm NLĐ - Giảm trừ gia cảnh
  const assessableIncome = Math.max(
    0,
    taxableIncome - totalInsuranceEmployee - personalDeduction - dependentDeduction
  );

  const pit = calculatePIT(assessableIncome);

  // Lương thực nhận (Net) = Gross - Bảo hiểm NLĐ - Thuế TNCN
  const netSalary = grossIncome - totalInsuranceEmployee - pit;

  return {
    period,
    payDate: paymentDate,
    grossIncome,
    baseSalaryProrated,
    otPayTotal,
    nightPayTotal,
    unusedLeavePay,
    mealAllowanceTotal: mealAllowance,

    // Bóc tách miễn thuế
    taxExemptOt,
    taxableOt,
    taxExemptNight,
    taxExemptMeal,
    taxableMeal,
    taxExemptLeave,
    totalTaxExempt,
    taxableIncome,

    // Bảo hiểm người lao động
    insurableSalary,
    cappedBhxh,
    cappedBhtn,
    bhxhEmployee,
    bhytEmployee,
    bhtnEmployee,
    totalInsuranceEmployee,

    // Bảo hiểm người sử dụng lao động (Doanh nghiệp)
    bhxhEmployer,
    bhytEmployer,
    bhtnEmployer,
    totalInsuranceEmployer,

    // Giảm trừ & Thuế
    personalDeduction,
    dependentDeduction,
    assessableIncome,
    personalIncomeTax: pit,
    netSalary,
  };
};
