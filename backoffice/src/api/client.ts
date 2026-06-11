import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.9:5000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors (logout) — skip login endpoint so Login component can handle its own errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/backoffice/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
