const cookieOptions = 'path=/; sameSite=lax';

const writeCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieOptions}; max-age=${maxAgeSeconds}`;
};

export const setAuthCookies = (accessToken: string, refreshToken: string) => {
  writeCookie('accessToken', accessToken, 60 * 60 * 24);
  writeCookie('refreshToken', refreshToken, 60 * 60 * 24 * 7);
};

export const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `accessToken=; ${cookieOptions}; max-age=0`;
  document.cookie = `refreshToken=; ${cookieOptions}; max-age=0`;
};