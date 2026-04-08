import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('barberstack-auth');
      if (raw) {
        const { state } = JSON.parse(raw);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch {
      // localStorage indisponível ou JSON inválido
    }
  }
  return config;
});

let refreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: any) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && typeof window !== 'undefined') {
      original._retry = true;

      try {
        const raw = localStorage.getItem('barberstack-auth');
        if (!raw) throw new Error('no session');
        const { state } = JSON.parse(raw);
        if (!state?.refreshToken) throw new Error('no refresh token');

        if (refreshing) {
          return new Promise((resolve) => {
            refreshQueue.push((newToken: string) => {
              original.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(original));
            });
          });
        }

        refreshing = true;

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken: state.refreshToken });
        const newToken: string = data.token;

        const updated = { ...JSON.parse(raw), state: { ...state, token: newToken } };
        localStorage.setItem('barberstack-auth', JSON.stringify(updated));

        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        refreshing = false;

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshing = false;
        refreshQueue = [];
        localStorage.removeItem('barberstack-auth');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
