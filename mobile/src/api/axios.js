import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.103:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// AuthContext registers its logout here so the interceptor can call it
let _logout = null;
export const setLogoutCallback = (fn) => { _logout = fn; };

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await AsyncStorage.getItem('refresh_token');
        if (refresh) {
          const res = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh }, { timeout: 8000 });
          const newAccess = res.data.access;
          await AsyncStorage.setItem('access_token', newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
      } catch {}
      // Refresh failed — force logout
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      if (_logout) _logout();
    }

    return Promise.reject(error);
  }
);

export default api;
