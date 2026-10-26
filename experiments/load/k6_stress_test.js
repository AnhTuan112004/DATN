/**
 * KỊCH BẢN KIỂM THỬ TẢI K6 (100 VIRTUAL USERS CONCURRENT)
 * Phân hệ Quản trị Nhân sự & AI PeopleInsight AI (v6.1 FINAL FREEZE)
 * Tuân thủ mục tiêu Tuần 8 (04/12–10/12/2026)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// 1. Cấu hình các chỉ số đo lường tùy biến (Custom Metrics)
const durationAuthMe = new Trend('duration_auth_me', true);
const durationUsersList = new Trend('duration_users_list', true);
const durationAttendance = new Trend('duration_attendance', true);
const durationAttritionMl = new Trend('duration_attrition_ml', true);
const durationChatbot = new Trend('duration_chatbot', true);
const successRate = new Rate('success_rate');
const totalRequests = new Counter('total_custom_requests');

// 2. Kịch bản tải: Lên đến 100 Virtual Users đồng thời
export const options = {
  stages: [
    { duration: '10s', target: 25 },  // Giai đoạn 1: Khởi động 0 -> 25 VUs
    { duration: '20s', target: 100 }, // Giai đoạn 2: Tăng tốc 25 -> 100 VUs
    { duration: '30s', target: 100 }, // Giai đoạn 3: Duy trì tải cực đỉnh 100 VUs
    { duration: '10s', target: 0 },   // Giai đoạn 4: Hạ tải về 0
  ],
  thresholds: {
    // Tỷ lệ lỗi toàn hệ thống bắt buộc < 1%
    http_req_failed: ['rate<0.01'],
    // Độ trễ 95% requests phải hoàn thành dưới 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    // Tỷ lệ thành công nghiệp vụ >= 99%
    success_rate: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// 3. Setup: Đăng nhập cấp phát Token trước khi kích hoạt 100 VUs
export function setup() {
  console.log(`[k6 Setup] Đang khởi tạo phiên kiểm thử tải tại ${BASE_URL}...`);

  // Đăng nhập tài khoản CEO
  const ceoRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'ceo@peopleinsight.vn',
      password: 'Admin@123456',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Đăng nhập tài khoản HR Manager
  const hrRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'hr.huong@peopleinsight.vn',
      password: 'Admin@123456',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let ceoToken = '';
  let hrToken = '';

  if (ceoRes.status === 200) {
    const body = JSON.parse(ceoRes.body);
    ceoToken = body.data?.accessToken || body.accessToken || '';
  }

  if (hrRes.status === 200) {
    const body = JSON.parse(hrRes.body);
    hrToken = body.data?.accessToken || body.accessToken || '';
  }

  console.log(`[k6 Setup] Đăng nhập thành công! CEO Token: ${ceoToken ? 'OK' : 'FAIL'}, HR Token: ${hrToken ? 'OK' : 'FAIL'}`);

  return { ceoToken, hrToken };
}

// 4. Kịch bản thực thi của từng Virtual User (VU 1..100)
export default function (data) {
  const token = __VU % 2 === 0 ? data.ceoToken : data.hrToken;
  // Giả lập 100 địa chỉ IP độc lập cho từng VU qua X-Forwarded-For
  const clientIp = `10.0.${Math.floor(__VU / 255)}.${(__VU % 254) + 1}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Forwarded-For': clientIp,
    'X-Load-Test': 'k6-load-test-2026',
  };

  // --- TÁC VỤ 1: Health Check (Đo lường hạ tầng cơ bản) ---
  {
    const res = http.get(`${BASE_URL}/health`);
    const isOk = check(res, { 'Health Check status 200': (r) => r.status === 200 });
    successRate.add(isOk);
    totalRequests.add(1);
  }

  // --- TÁC VỤ 2: Tra cứu Thông tin Tài khoản (GET /api/auth/me) ---
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/auth/me`, { headers });
    durationAuthMe.add(Date.now() - start);

    const isOk = check(res, {
      'Auth Me status 200': (r) => r.status === 200,
      'Auth Me has email': (r) => r.body && r.body.includes('email'),
    });
    successRate.add(isOk);
    totalRequests.add(1);
  }

  // --- TÁC VỤ 3: Tra cứu Danh sách Nhân sự Toàn DN (GET /api/users) ---
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/users`, { headers });
    durationUsersList.add(Date.now() - start);

    const isOk = check(res, {
      'Users List status 200': (r) => r.status === 200,
    });
    successRate.add(isOk);
    totalRequests.add(1);
  }

  // --- TÁC VỤ 4: Tra cứu Điểm Danh Hôm Nay (GET /api/attendance/today) ---
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/attendance/today`, { headers });
    durationAttendance.add(Date.now() - start);

    const isOk = check(res, {
      'Attendance Today status 200': (r) => r.status === 200,
    });
    successRate.add(isOk);
    totalRequests.add(1);
  }

  // --- TÁC VỤ 5: Phân Hệ ML Suy Luận Nguy Cơ Thôi Việc (GET /api/analytics/attrition-risk) ---
  {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/analytics/attrition-risk`, { headers });
    durationAttritionMl.add(Date.now() - start);

    const isOk = check(res, {
      'Attrition ML status 200': (r) => r.status === 200,
      'Attrition has summary': (r) => r.body && r.body.includes('summary'),
    });
    successRate.add(isOk);
    totalRequests.add(1);
  }

  // --- TÁC VỤ 6: Chatbot HR AI Phương Án A (Tra cứu ngày phép) ---
  // Gọi theo tỷ lệ ngẫu nhiên 20% VU để không làm nghẽn rate limit AI
  if (Math.random() < 0.2) {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/ai/chat`,
      JSON.stringify({ message: 'Tôi còn bao nhiêu ngày phép năm?' }),
      { headers }
    );
    durationChatbot.add(Date.now() - start);

    const isOk = check(res, {
      'AI Chat status 200': (r) => r.status === 200,
      'AI Chat has markdown': (r) => r.body && r.body.includes('markdown'),
    });
    successRate.add(isOk);
    totalRequests.add(1);
  }

  // Thời gian suy nghĩ của người dùng (Think time): 0.2s - 0.4s
  sleep(0.3);
}

// 5. Xuất báo cáo kết quả tự động sau khi kết thúc đợt test
export function handleSummary(data) {
  const getMetric = (metric, stat) => {
    if (metric && metric.values && metric.values[stat] !== undefined && metric.values[stat] !== null) {
      return metric.values[stat].toFixed(2);
    }
    return 'N/A';
  };

  const p95 = getMetric(data.metrics.http_req_duration, 'p(95)');
  const p99 = getMetric(data.metrics.http_req_duration, 'p(99)');
  const avg = getMetric(data.metrics.http_req_duration, 'avg');
  const reqCount = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const rps = data.metrics.http_reqs ? data.metrics.http_reqs.values.rate.toFixed(2) : 'N/A';
  const failRate = data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : '0.00';

  const textSummary = `
================================================================================
BÁO CÁO KẾT QUẢ KIỂM THỬ TẢI K6 (PEOPLEINSIGHT AI - 100 VUS CONCURRENT)
Thời gian thực hiện: ${new Date().toISOString()}
================================================================================
* Mục tiêu: 100 Virtual Users đồng thời truy cập các phân hệ cốt lõi
* Tổng số requests đã xử lý: ${reqCount} requests
* Tốc độ xử lý trung bình (RPS): ${rps} reqs/sec
* Tỷ lệ lỗi (Error Rate): ${failRate}% (Ngưỡng đạt: < 1.00%)
* Thời gian phản hồi trung bình (Avg Latency): ${avg} ms
* Phân vị 95% (P95 Latency): ${p95} ms (Ngưỡng đạt: < 500 ms)
* Phân vị 99% (P99 Latency): ${p99} ms (Ngưỡng đạt: < 1000 ms)
--------------------------------------------------------------------------------
ĐỘ TRỄ CHI TIẾT THEO TỪNG PHÂN HỆ:
- Xác thực & Hồ sơ cá nhân (Auth Me): P95 = ${getMetric(data.metrics.duration_auth_me, 'p(95)')} ms
- Danh sách nhân sự toàn DN (Users List): P95 = ${getMetric(data.metrics.duration_users_list, 'p(95)')} ms
- Nhật ký điểm danh hôm nay (Attendance): P95 = ${getMetric(data.metrics.duration_attendance, 'p(95)')} ms
- Suy luận ML Nguy cơ thôi việc (Retention): P95 = ${getMetric(data.metrics.duration_attrition_ml, 'p(95)')} ms
- Trợ lý HR AI Chatbot (Phương Án A): P95 = ${getMetric(data.metrics.duration_chatbot, 'p(95)')} ms
================================================================================
KẾT LUẬN: ${parseFloat(failRate) < 1.0 && parseFloat(p95) < 500 ? 'ĐẠT TIÊU CHUẨN NGHIỆM THU TUẦN 8 (100% PASS)' : 'CẦN TỐI ƯU THÊM'}
`;

  return {
    'stdout': textSummary,
    'experiments/load/k6_results.json': JSON.stringify(data, null, 2),
    'experiments/load/k6_summary.txt': textSummary,
  };
}
