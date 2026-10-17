import { calculatePayroll, calculatePIT } from '../../src/services/payroll/calc.js';

describe('Payroll Engine 2026 — Bộ 22 Test Cases Chuẩn Pháp Lý', () => {
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

  // ==========================================
  // CASE 1: Lương dưới ngưỡng chịu thuế
  // ==========================================
  test('Case 1: Lương dưới ngưỡng chịu thuế (Gross 15M, 0 phụ thuộc, lương đóng 10M, Net 13.95M)', () => {
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 10000000,
      otherBonus: 5000000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      dependentsCount: 0,
    });

    expect(res.grossIncome).toBe(15000000);
    expect(res.insurableSalary).toBe(10000000);
    // BH 10.5% của 10M = 1.050.000đ
    expect(res.totalInsuranceEmployee).toBe(1050000);
    expect(res.taxableIncome).toBe(15000000);
    // TNTT = max(0, 15M - 1.05M - 15.5M) = 0
    expect(res.assessableIncome).toBe(0);
    expect(res.personalIncomeTax).toBe(0);
    // Net = 15M - 1.05M - 0 = 13.950.000đ
    expect(res.netSalary).toBe(13950000);
  });

  // ==========================================
  // CASE 2: Lương Bậc 1
  // ==========================================
  test('Case 2: Lương bậc 1 (Gross 25M, 1 phụ thuộc, lương đóng 20M, Net 22.84M)', () => {
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 20000000,
      otherBonus: 5000000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      dependentsCount: 1,
    });

    expect(res.grossIncome).toBe(25000000);
    expect(res.insurableSalary).toBe(20000000);
    // BH 10.5% của 20M = 2.100.000đ
    expect(res.totalInsuranceEmployee).toBe(2100000);
    expect(res.taxableIncome).toBe(25000000);
    // TNTT = 25M - 2.1M - (15.5M + 6.2M) = 1.200.000đ
    expect(res.assessableIncome).toBe(1200000);
    // Thuế 5% = 60.000đ
    expect(res.personalIncomeTax).toBe(60000);
    // Net = 25M - 2.1M - 60k = 22.840.000đ
    expect(res.netSalary).toBe(22840000);
  });

  // ==========================================
  // CASE 3: OT Ngày thường (Miễn thuế 100%)
  // ==========================================
  test('Case 3: Làm thêm giờ ngày thường (10h OT x 150%, toàn bộ 150% tiền OT được miễn thuế TNCN)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekday: 10,
    });

    // Tiền OT = 10 * 100k * 1.5 = 1.500.000đ
    expect(res.otPayTotal).toBe(1500000);
    // Toàn bộ 150% tiền OT được miễn thuế TNCN từ 2026
    expect(res.taxExemptOt).toBe(1500000);
    expect(res.taxableOt).toBe(0);
    expect(res.grossIncome).toBe(19100000);
    // Thu nhập chịu thuế loại trừ toàn bộ tiền OT
    expect(res.taxableIncome).toBe(17600000);
  });

  // ==========================================
  // CASE 4: OT Ngày nghỉ hàng tuần (Miễn thuế 100%)
  // ==========================================
  test('Case 4: Làm thêm giờ ngày nghỉ hàng tuần (16h OT x 200%, toàn bộ 200% tiền OT được miễn thuế TNCN)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekend: 16,
    });

    // Tiền OT = 16 * 100k * 2.0 = 3.200.000đ
    expect(res.otPayTotal).toBe(3200000);
    expect(res.taxExemptOt).toBe(3200000);
    expect(res.taxableOt).toBe(0);
    expect(res.grossIncome).toBe(20800000);
    expect(res.taxableIncome).toBe(17600000);
  });

  // ==========================================
  // CASE 5: OT Ngày lễ, tết (Miễn thuế 100%)
  // ==========================================
  test('Case 5: Làm thêm giờ ngày lễ, tết (8h OT x 300%, toàn bộ 300% tiền OT được miễn thuế TNCN)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursHoliday: 8,
    });

    // Tiền OT = 8 * 100k * 3.0 = 2.400.000đ
    expect(res.otPayTotal).toBe(2400000);
    expect(res.taxExemptOt).toBe(2400000);
    expect(res.taxableOt).toBe(0);
    expect(res.grossIncome).toBe(20000000);
    expect(res.taxableIncome).toBe(17600000);
  });

  // ==========================================
  // CASE 6: OT vượt trần tháng (> 40h/tháng)
  // ==========================================
  test('Case 6: OT vượt ngưỡng 40h/tháng (Làm 46h OT ngày thường, 40h miễn thuế = 6M, 6h vượt = 900k chịu thuế)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekday: 46,
      monthlyOtCapHours: 40,
    });

    // Tổng tiền OT = 46 * 100k * 1.5 = 6.900.000đ
    expect(res.otPayTotal).toBe(6900000);
    // 40h trong hạn mức được miễn thuế = 40 * 100k * 1.5 = 6.000.000đ
    expect(res.taxExemptOt).toBe(6000000);
    // 6h vượt trần bị tính vào thu nhập chịu thuế = 6 * 100k * 1.5 = 900.000đ
    expect(res.taxableOt).toBe(900000);
    expect(res.grossIncome).toBe(24500000);
    expect(res.taxableIncome).toBe(18500000);
  });

  // ==========================================
  // CASE 7: OT vượt trần ngày (> 4h/ngày)
  // ==========================================
  test('Case 7: OT vượt trần ngày >4h/ngày (Làm 10h OT ngày thường, 2h vượt trần ngày bị tính chịu thuế)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekday: 10,
      dailyOverCapHours: 2, // 2 giờ vượt giới hạn 4h/ngày
    });

    // Tổng tiền OT = 10 * 100k * 1.5 = 1.500.000đ
    expect(res.otPayTotal).toBe(1500000);
    // 8h hợp lệ được miễn thuế = 8 * 100k * 1.5 = 1.200.000đ
    expect(res.taxExemptOt).toBe(1200000);
    // 2h vượt trần ngày tính chịu thuế = 2 * 100k * 1.5 = 300.000đ
    expect(res.taxableOt).toBe(300000);
    expect(res.taxableIncome).toBe(17900000);
  });

  // ==========================================
  // CASE 8: OT vượt trần năm (> 200h/năm)
  // ==========================================
  test('Case 8: OT vượt trần năm >200h/năm (Làm 15h OT ngày thường, 10h vượt trần năm bị tính chịu thuế)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekday: 15,
      yearlyOverCapHours: 10, // 10 giờ vượt ngưỡng 200h/năm
    });

    // Tổng tiền OT = 15 * 100k * 1.5 = 2.250.000đ
    expect(res.otPayTotal).toBe(2250000);
    // 5h hợp lệ được miễn thuế = 5 * 100k * 1.5 = 750.000đ
    expect(res.taxExemptOt).toBe(750000);
    // 10h vượt trần năm tính chịu thuế = 10 * 100k * 1.5 = 1.500.000đ
    expect(res.taxableOt).toBe(1500000);
    expect(res.taxableIncome).toBe(19100000);
  });

  // ==========================================
  // CASE 9: Công ty trả hệ số OT cao hơn Điều 98
  // ==========================================
  test('Case 9: Công ty trả hệ số OT cao hơn Điều 98 (Trả 180% thay vì 150%, 10h: 1.5M miễn thuế, 300k chịu thuế)', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekday: 10,
      multiplierWeekday: 1.8, // Trả 180%
    });

    // Tổng tiền OT = 10 * 100k * 1.8 = 1.800.000đ
    expect(res.otPayTotal).toBe(1800000);
    // Miễn thuế theo hệ số luật định Điều 98 (150%) = 10 * 100k * 1.5 = 1.500.000đ
    expect(res.taxExemptOt).toBe(1500000);
    // Phần hệ số chênh lệch công ty tự trả vượt luật (30%) chịu thuế = 10 * 100k * 0.3 = 300.000đ
    expect(res.taxableOt).toBe(300000);
    expect(res.taxableIncome).toBe(17900000);
  });

  // ==========================================
  // CASE 10: Làm việc ban đêm (22h - 06h)
  // ==========================================
  test('Case 10: Làm việc ban đêm (22h - 06h, 30h đêm: phụ cấp đêm 30% được miễn thuế [Cần xác minh])', () => {
    // Đơn giá giờ = 17.6M / 22 / 8 = 100.000đ/h
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      nightWorkHours: 30,
    });

    // Tiền phụ cấp đêm 30% = 30 * 100k * 0.3 = 900.000đ
    expect(res.nightPayTotal).toBe(900000);
    expect(res.taxExemptNight).toBe(900000);
    expect(res.grossIncome).toBe(18500000);
    expect(res.taxableIncome).toBe(17600000);
  });

  // ==========================================
  // CASE 11: OT đêm ngày thường (Điều 57 NĐ 145/2020)
  // ==========================================
  test('Case 11: OT đêm ngày thường theo Điều 57 NĐ 145/2020 (Nhánh 200% không làm thêm ngày vs Nhánh 210% có làm thêm ngày)', () => {
    // Nhánh 11a: Không làm thêm ban ngày trước đó -> Hệ số 200% (150% + 30% + 20%)
    const resWithoutDaytime = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursNight: 10,
      hasDaytimeOtBeforeNight: false,
    });
    // Tiền OT đêm = 10 * 100k * 2.0 = 2.000.000đ
    expect(resWithoutDaytime.otPayTotal).toBe(2000000);
    expect(resWithoutDaytime.taxExemptOt).toBe(2000000);
    expect(resWithoutDaytime.taxableOt).toBe(0);

    // Nhánh 11b: Có làm thêm ban ngày trước đó -> Hệ số 210% (150% + 30% + 20% x 150%)
    const resWithDaytime = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 17600000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursNight: 10,
      hasDaytimeOtBeforeNight: true,
    });
    // Tiền OT đêm = 10 * 100k * 2.1 = 2.100.000đ
    expect(resWithDaytime.otPayTotal).toBe(2100000);
    expect(resWithDaytime.taxExemptOt).toBe(2100000);
    expect(resWithDaytime.taxableOt).toBe(0);
  });

  // ==========================================
  // CASE 12: Bồi thường tiền phép năm chưa nghỉ
  // ==========================================
  test('Case 12: Bồi thường ngày phép năm chưa nghỉ (dư 3 ngày phép: 3.0M được miễn thuế TNCN)', () => {
    // Lương 22M, 22 ngày công chuẩn -> Đơn giá ngày = 1.000.000đ/ngày
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 22000000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      unusedLeaveDays: 3,
    });

    // Tiền phép chưa nghỉ = 3 * 1.000.000 = 3.000.000đ
    expect(res.unusedLeavePay).toBe(3000000);
    expect(res.taxExemptLeave).toBe(3000000);
    expect(res.grossIncome).toBe(25000000);
    expect(res.taxableIncome).toBe(22000000);
  });

  // ==========================================
  // CASE 13: Đi làm giữa tháng (14/22 ngày công)
  // ==========================================
  test('Case 13: Đi làm giữa tháng (14/22 ngày công thực tế: tính tỷ lệ lương, đóng BH cả tháng vì >= 14 ngày)', () => {
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 22000000,
      standardWorkingDays: 22,
      actualWorkingDays: 14,
    });

    // Lương prorated = (22M / 22) * 14 = 14.000.000đ
    expect(res.baseSalaryProrated).toBe(14000000);
    // Đóng BH cả tháng trên insurableSalary (22M) -> 10.5% = 2.310.000đ
    expect(res.totalInsuranceEmployee).toBe(2310000);
  });

  // ==========================================
  // CASE 14: Nghỉ ốm >= 14 ngày làm việc
  // ==========================================
  test('Case 14: Nghỉ ốm >= 14 ngày làm việc trong tháng (Miễn trích đóng BHXH, BHYT, BHTN tháng đó cho cả NLĐ và NSDLĐ)', () => {
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 22000000,
      standardWorkingDays: 22,
      actualWorkingDays: 6,
      sickLeaveDays: 16, // Nghỉ ốm 16 ngày >= 14 ngày
    });

    // Lương thực tế 6 ngày = (22M / 22) * 6 = 6.000.000đ
    expect(res.baseSalaryProrated).toBe(6000000);
    // Không trích đóng BHXH, BHYT, BHTN tháng đó (theo khoản 3 Điều 85 Luật BHXH)
    expect(res.totalInsuranceEmployee).toBe(0);
    expect(res.totalInsuranceEmployer).toBe(0);
    expect(res.grossIncome).toBe(6000000);
    expect(res.taxableIncome).toBe(6000000);
    expect(res.assessableIncome).toBe(0);
    expect(res.personalIncomeTax).toBe(0);
    expect(res.netSalary).toBe(6000000);
  });

  // ==========================================
  // CASE 15: Test tham số hóa 5 bậc thuế mới 2026
  // ==========================================
  test('Case 15: Test tham số hóa 5 bậc thuế lũy tiến mới 2026 (Công thức tính nhanh)', () => {
    const testCases = [
      { tntt: 5000000, expectedTax: 250000 },      // Bậc 1: 5M * 5% = 250k
      { tntt: 20000000, expectedTax: 1500000 },    // Bậc 2: 20M * 10% - 500k = 1.5M
      { tntt: 45000000, expectedTax: 5500000 },    // Bậc 3: 45M * 20% - 3.5M = 5.5M
      { tntt: 80000000, expectedTax: 14500000 },   // Bậc 4: 80M * 30% - 9.5M = 14.5M
      { tntt: 120000000, expectedTax: 27500000 },  // Bậc 5: 120M * 35% - 14.5M = 27.5M
    ];

    for (const tc of testCases) {
      expect(calculatePIT(tc.tntt)).toBe(tc.expectedTax);
    }
  });

  // ==========================================
  // CASE 16: Test 4 giá trị đúng ngưỡng biên thuế
  // ==========================================
  test('Case 16: Test các giá trị đúng ngưỡng biên thuế (10M, 30M, 60M, 100M)', () => {
    // Biên 10M -> 500.000đ
    expect(calculatePIT(10000000)).toBe(500000);
    // Biên 30M -> 10M * 5% + 20M * 10% = 2.500.000đ
    expect(calculatePIT(30000000)).toBe(2500000);
    // Biên 60M -> 2.5M + 30M * 20% = 8.500.000đ
    expect(calculatePIT(60000000)).toBe(8500000);
    // Biên 100M -> 8.5M + 40M * 30% = 20.500.000đ
    expect(calculatePIT(100000000)).toBe(20500000);
  });

  // ==========================================
  // CASE 17: Chạm trần BHXH/BHYT Kỳ 1 & Kỳ 2
  // ==========================================
  test('Case 17: Chạm trần BHXH/BHYT Kỳ 1 (46.8M trước 01/07) và Kỳ 2 (50.6M từ 01/07/2026)', () => {
    // Kỳ 1: Tháng 04/2026, lương đóng 60M -> Trần 46.8M
    const resK1 = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-04',
      baseSalary: 60000000,
    });
    expect(resK1.cappedBhxh).toBe(46800000);
    // BHXH 8% = 3.744.000đ, BHYT 1.5% = 702.000đ -> Tổng = 4.446.000đ
    expect(resK1.bhxhEmployee).toBe(3744000);
    expect(resK1.bhytEmployee).toBe(702000);

    // Kỳ 2: Tháng 08/2026, lương đóng 60M -> Trần 50.6M
    const resK2 = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-08',
      baseSalary: 60000000,
    });
    expect(resK2.cappedBhxh).toBe(50600000);
    // BHXH 8% = 4.048.000đ, BHYT 1.5% = 759.000đ -> Tổng = 4.807.000đ
    expect(resK2.bhxhEmployee).toBe(4048000);
    expect(resK2.bhytEmployee).toBe(759000);
  });

  // ==========================================
  // CASE 18: Chạm trần BHTN Vùng I (106.2M)
  // ==========================================
  test('Case 18: Chạm trần BHTN Vùng I (20 x LTT 5.310.000đ = 106.200.000đ)', () => {
    // Lương đóng 120M -> BHTN áp trần 106.2M
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 120000000,
    });

    expect(res.cappedBhtn).toBe(106200000);
    // BHTN NLĐ 1% = 1.062.000đ
    expect(res.bhtnEmployee).toBe(1062000);
    // BHTN Doanh nghiệp 1% = 1.062.000đ
    expect(res.bhtnEmployer).toBe(1062000);
  });

  // ==========================================
  // CASE 19: Trần ăn ca Kỳ 1 (730k) & Kỳ 2 (1.2M)
  // ==========================================
  test('Case 19: Trần tiền ăn ca miễn thuế Kỳ 1 (730k) vs Kỳ 2 (1.2M theo NĐ 253/2026)', () => {
    // Kỳ 1: Tháng 04/2026, ăn ca 1.000.000đ -> Miễn 730k, chịu thuế 270k
    const resK1 = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-04',
      baseSalary: 15000000,
      mealAllowance: 1000000,
    });
    expect(resK1.taxExemptMeal).toBe(730000);
    expect(resK1.taxableMeal).toBe(270000);

    // Kỳ 2: Tháng 08/2026, ăn ca 1.500.000đ -> Miễn 1.2M, chịu thuế 300k
    const resK2 = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-08',
      baseSalary: 15000000,
      mealAllowance: 1500000,
    });
    expect(resK2.taxExemptMeal).toBe(1200000);
    expect(resK2.taxableMeal).toBe(300000);
  });

  // ==========================================
  // CASE 20: Thời điểm chi trả khác tháng công
  // ==========================================
  test('Case 20: Thời điểm chi trả khác tháng công (Lương T6 trả ngày 05/07/2026: trần BHXH tháng 6, trần ăn ca tháng 7)', () => {
    // Công tháng 6/2026 (BHXH tính theo periodDate 2026-06 -> trần 46.8M)
    // Chi trả ngày 05/07/2026 (Thuế và trần ăn ca tính theo payDate 2026-07 -> trần 1.2M)
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-06',
      payDate: '2026-07-05',
      baseSalary: 60000000,
      mealAllowance: 1000000,
    });

    // BHXH áp trần Kỳ 1 của tháng 6 = 46.8M
    expect(res.cappedBhxh).toBe(46800000);
    expect(res.bhxhEmployee).toBe(3744000);

    // Trần ăn ca áp dụng Kỳ 2 của thời điểm chi trả tháng 7 = 1.2M -> Miễn toàn bộ 1.0M
    expect(res.taxExemptMeal).toBe(1000000);
    expect(res.taxableMeal).toBe(0);
  });

  // ==========================================
  // CASE 21: Chi phí Doanh nghiệp đóng bảo hiểm & Làm tròn
  // ==========================================
  test('Case 21: Chi phí Doanh nghiệp đóng bảo hiểm (21.5%) và quy tắc làm tròn số nguyên VNĐ (half-up)', () => {
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 20000000,
    });

    // Doanh nghiệp đóng: BHXH 17.5%, BHYT 3.0%, BHTN 1.0%
    expect(res.bhxhEmployer).toBe(3500000); // 20M * 0.175
    expect(res.bhytEmployer).toBe(600000);  // 20M * 0.03
    expect(res.bhtnEmployer).toBe(200000);  // 20M * 0.01
    expect(res.totalInsuranceEmployer).toBe(4300000); // Đúng 21.5%

    // Kiểm tra làm tròn half-up với số lẻ: lương 15.333.333đ
    const resRound = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-03',
      baseSalary: 15333333,
    });
    // BHXH 8% = 15333333 * 0.08 = 1226666.64 -> làm tròn 1.226.667đ
    expect(resRound.bhxhEmployee).toBe(1226667);
    expect(Number.isInteger(resRound.totalInsuranceEmployee)).toBe(true);
    expect(Number.isInteger(resRound.netSalary)).toBe(true);
  });

  // ==========================================
  // CASE 22: Ca tổng hợp toàn diện khớp từng đồng
  // ==========================================
  test('Case 22: Ca tổng hợp toàn diện (Lương cao, OT đêm, ăn ca, 2 phụ thuộc) khớp 100% từng đồng với Excel', () => {
    // Đầu vào kiểm thử:
    // - baseSalary = 44.000.000đ, positionAllowance = 6.000.000đ -> insurableSalary = 50.000.000đ
    // - standardWorkingDays = 22, actualWorkingDays = 22 -> dailyRate = 2.000.000đ/ngày, hourlyRate = 250.000đ/h
    // - mealAllowance = 1.500.000đ (tháng 8: trần miễn 1.2M -> chịu thuế 300k)
    // - otHoursWeekday = 10 -> 10 * 250k * 1.5 = 3.750.000đ (miễn toàn bộ)
    // - otHoursNight = 6, hasDaytimeOtBeforeNight = true -> 6 * 250k * 2.1 = 3.150.000đ (miễn toàn bộ)
    // - nightWorkHours = 10 -> 10 * 250k * 0.3 = 750.000đ (miễn thuế)
    // - unusedLeaveDays = 1 -> 1 * 2.000.000 = 2.000.000đ (miễn thuế)
    // - dependentsCount = 2
    const res = calculatePayroll({
      companySettings: mockCompanySettings,
      period: '2026-08',
      payDate: '2026-08-31',
      baseSalary: 44000000,
      positionAllowance: 6000000,
      mealAllowance: 1500000,
      standardWorkingDays: 22,
      actualWorkingDays: 22,
      otHoursWeekday: 10,
      otHoursNight: 6,
      hasDaytimeOtBeforeNight: true,
      nightWorkHours: 10,
      unusedLeaveDays: 1,
      dependentsCount: 2,
    });

    // 1. Gross = 44M + 6M + 1.5M + 3.75M + 3.15M + 0.75M + 2M = 61.150.000đ
    expect(res.grossIncome).toBe(61150000);

    // 2. Miễn thuế = 3.75M + 3.15M + 0.75M + 2.0M + 1.2M = 10.850.000đ
    expect(res.taxExemptOt).toBe(6900000); // 3.75M + 3.15M
    expect(res.taxExemptNight).toBe(750000);
    expect(res.taxExemptLeave).toBe(2000000);
    expect(res.taxExemptMeal).toBe(1200000);
    expect(res.totalTaxExempt).toBe(10850000);

    // 3. Thu nhập chịu thuế = 61.150.000 - 10.850.000 = 50.300.000đ
    expect(res.taxableIncome).toBe(50300000);

    // 4. Bảo hiểm NLĐ (10.5% của 50M) = 5.250.000đ
    expect(res.insurableSalary).toBe(50000000);
    expect(res.bhxhEmployee).toBe(4000000);  // 8%
    expect(res.bhytEmployee).toBe(750000);   // 1.5%
    expect(res.bhtnEmployee).toBe(500000);   // 1%
    expect(res.totalInsuranceEmployee).toBe(5250000);

    // 5. Bảo hiểm Doanh nghiệp (21.5% của 50M) = 10.750.000đ
    expect(res.bhxhEmployer).toBe(8750000);  // 17.5%
    expect(res.bhytEmployer).toBe(1500000);  // 3%
    expect(res.bhtnEmployer).toBe(500000);   // 1%
    expect(res.totalInsuranceEmployer).toBe(10750000);

    // 6. Giảm trừ gia cảnh: 15.5M bản thân + 12.4M (2 người phụ thuộc) = 27.900.000đ
    expect(res.personalDeduction).toBe(15500000);
    expect(res.dependentDeduction).toBe(12400000);

    // 7. Thu nhập tính thuế = 50.300.000 - 5.250.000 - 27.900.000 = 17.150.000đ
    expect(res.assessableIncome).toBe(17150000);

    // 8. Thuế TNCN (Bậc 2: 17.15M * 10% - 500k) = 1.215.000đ
    expect(res.personalIncomeTax).toBe(1215000);

    // 9. Lương Net = 61.150.000 - 5.250.000 - 1.215.000 = 54.685.000đ
    expect(res.netSalary).toBe(54685000);
  });
});
