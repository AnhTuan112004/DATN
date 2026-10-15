import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 }, // Mục tiêu 100 người dùng đồng thời trên MongoDB Atlas M0
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% request phải dưới 1.5s
    http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  // 1. Health check endpoint
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    'health check status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
