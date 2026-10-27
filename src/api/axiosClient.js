import axios from 'axios';

// 1. Khởi tạo instance của Axios
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 giây
});

// 2. Request Interceptor: Tự động đính kèm Token nếu user đã đăng nhập
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Trích xuất data trực tiếp & Xử lý lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp response.data để các nơi gọi API không cần gõ .data
    return response.data;
  },
  (error) => {
    // Log lỗi hoặc xử lý tập trung
    if (error.response) {
      console.error(`[API Error ${error.response.status}]:`, error.response.data);
    } else if (error.request) {
      console.error('[API Error]: No response received from server', error.request);
    } else {
      console.error('[API Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;