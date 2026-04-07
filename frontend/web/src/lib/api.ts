import axios from 'axios';

// Sem baseURL absoluta — chama /api/* no próprio Amplify.
// O Amplify repassa para a EC2 via EC2_URL (variável server-side, nunca exposta ao browser).
export const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token em toda requisição
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

// Em 401, limpa a sessão e redireciona pro login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('barberstack-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
