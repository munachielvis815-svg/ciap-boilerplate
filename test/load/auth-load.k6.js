import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'https://ciap-proxy.onrender.com';
const PASSWORD = __ENV.AUTH_PASSWORD || 'StrongPassword123!';
const ROLE = __ENV.AUTH_ROLE || 'sme';

// See https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2000'],
  },
  cloud: {
    distribution: {
      'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
    },
  },
};

function buildUser() {
  const nonce = `${Date.now()}-${__VU}-${__ITER}`;

  return {
    email: `k6-auth-${nonce}@example.com`,
    name: `k6 user ${nonce}`,
    password: PASSWORD,
    role: ROLE,
  };
}

export default function main() {
  const user = buildUser();
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const signupResponse = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
    }),
    params,
  );

  check(signupResponse, {
    'signup status is 201': (response) => response.status === 201,
    'signup sets access cookie': (response) =>
      response.cookies.ciap_access?.length > 0,
    'signup sets refresh cookie': (response) =>
      response.cookies.ciap_refresh?.length > 0,
    'signup omits token body fields': (response) =>
      response.json('accessToken') === undefined &&
      response.json('refreshToken') === undefined,
  });

  const loginResponse = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    params,
  );

  check(loginResponse, {
    'login status is 200': (response) => response.status === 200,
    'login sets access cookie': (response) =>
      response.cookies.ciap_access?.length > 0,
    'login sets refresh cookie': (response) =>
      response.cookies.ciap_refresh?.length > 0,
    'login omits token body fields': (response) =>
      response.json('accessToken') === undefined &&
      response.json('refreshToken') === undefined,
  });

  sleep(1);
}
