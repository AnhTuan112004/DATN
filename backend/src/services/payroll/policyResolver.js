/**
 * Tra cứu chính sách Thuế và Bảo hiểm dựa trên kỳ lương (period: YYYY-MM) và ngày chi trả (payDate: YYYY-MM-DD).
 * Không hard-code bất kỳ con số cụ thể nào vào hàm tính toán.
 * - Bảo hiểm (BHXH/BHYT/BHTN): Tra cứu theo tháng phát sinh tiền lương (periodDate).
 * - Thuế & Trần ăn ca: Tra cứu theo ngày thực tế chi trả thu nhập (paymentDate).
 */
export const resolvePolicy = (companySettings = {}, period = '2026-01', payDate = null) => {
  const periodDate = `${period}-01`;
  const paymentDate = payDate || (period >= '2026-07' ? `${period}-05` : `${period}-28`);

  // 1. Tra cứu chính sách Thuế theo paymentDate (thời điểm chi trả thu nhập)
  const taxPolicy = companySettings.taxPolicies?.find((p) => {
    const fromOk = p.effectiveFrom <= paymentDate;
    const toOk = !p.effectiveTo || p.effectiveTo >= paymentDate;
    return fromOk && toOk;
  });

  if (!taxPolicy) {
    throw new Error(`MISSING_TAX_POLICY: Chưa có chính sách thuế cho ngày thanh toán ${paymentDate}`);
  }

  // 2. Tra cứu tỷ lệ Bảo hiểm theo periodDate (tháng công)
  const insuranceRate = companySettings.insuranceRates?.find((r) => {
    const fromOk = r.effectiveFrom <= periodDate;
    const toOk = !r.effectiveTo || r.effectiveTo >= periodDate;
    return fromOk && toOk;
  });

  if (!insuranceRate) {
    throw new Error(`MISSING_INSURANCE_POLICY: Chưa có chính sách bảo hiểm cho kỳ ${periodDate}`);
  }

  // 3. Tra cứu lương tối thiểu vùng theo periodDate
  const region = companySettings.region || 'I';
  const minWageRecord = companySettings.minWageByRegion?.find((m) => {
    const fromOk = m.effectiveFrom <= periodDate;
    const toOk = !m.effectiveTo || m.effectiveTo >= periodDate;
    return fromOk && toOk;
  });

  const regionalMinWage = minWageRecord?.wages?.[region];
  if (!regionalMinWage) {
    throw new Error(`MISSING_MIN_WAGE: Chưa có cấu hình lương tối thiểu vùng ${region} cho kỳ ${periodDate}`);
  }

  const capBhtn = 20 * regionalMinWage;

  return {
    taxPolicy,
    insuranceRate,
    regionalMinWage,
    capBhtn,
    paymentDate,
    periodDate,
  };
};
