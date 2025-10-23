import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL || 'https://stuff-back.fly.dev';

const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      if (config.skipAuth) {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url} [SEM AUTH]`);
        return config;
      }

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      if (config.method?.toUpperCase() === 'GET' || config.method?.toUpperCase() === 'HEAD' || config.method?.toUpperCase() === 'DELETE') {
        delete config.headers['Content-Type'];
      } else {
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }
      }

      console.log(`${config.method?.toUpperCase()} ${config.url}`);
      
      return config;
    } catch (error) {
      console.error('Erro no request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => {
    console.log(`${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (originalRequest.skipAuth) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return httpClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Token expirado, fazendo refresh...');
        
        const refreshToken = await AsyncStorage.getItem('accessToken');
        if (!refreshToken) {
          throw new Error('Refresh token não encontrado');
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh-token`, {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            withCredentials: true
          }
        );

        const { accessToken: newAccessToken } = response.data as { accessToken : string };

        await AsyncStorage.setItem('accessToken', newAccessToken);
        console.log('Token renovado com sucesso');

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return httpClient(originalRequest);

      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
        processQueue(refreshError as Error, null);

        await AsyncStorage.multiRemove(['accessToken', 'userData']);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.error(`${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    
    return Promise.reject(error);
  }
);

export default httpClient;