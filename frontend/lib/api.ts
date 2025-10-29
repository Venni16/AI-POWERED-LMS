import axios from 'axios';
import { AuthResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),
  
  googleLogin: (token: string) =>
    api.post<AuthResponse>('/auth/google', { token }),
  
  getMe: () => api.get<AuthResponse>('/auth/me'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  createInstructor: (data: any) => api.post('/admin/users/instructor', data),
  updateUserStatus: (userId: string, isActive: boolean) =>
    api.patch(`/admin/users/${userId}/status`, { isActive }),
  changeInstructorPassword: (userId: string, password: string) =>
    api.patch(`/admin/users/${userId}/password`, { password }),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
};

export const instructorAPI = {
  getStats: () => api.get('/instructor/stats'),
  getCourses: () => api.get('/instructor/courses'),
  getCategories: () => api.get('/instructor/categories'),
  getCourseDetails: (courseId: string) =>
    api.get(`/instructor/courses/${courseId}`),
  createCourse: (data: any) => api.post('/instructor/courses', data),
  updateCourse: (courseId: string, data: any) =>
    api.put(`/instructor/courses/${courseId}`, data),
  uploadVideo: (courseId: string, formData: FormData, config?: any) =>
    api.post(`/video/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config
    }),
  uploadMaterial: (courseId: string, formData: FormData, config?: any) =>
    api.post(`/instructor/courses/${courseId}/materials`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config
    }),
  getEnrolledStudents: (courseId: string) =>
    api.get(`/instructor/courses/${courseId}/students`),
  deleteVideo: (courseId: string, videoId: string) =>
    api.delete(`/instructor/courses/${courseId}/videos/${videoId}`),
  deleteMaterial: (courseId: string, materialId: string) =>
    api.delete(`/instructor/courses/${courseId}/materials/${materialId}`),
  updateVideoSummary: (courseId: string, videoId: string, summary: string) =>
    api.put(`/instructor/courses/${courseId}/videos/${videoId}/summary`, { summary }),
  deleteCourse: (courseId: string) =>
    api.delete(`/instructor/courses/${courseId}`),
};

export const studentAPI = {
  getCourses: () => api.get('/student/courses'),
  getMyCourses: () => api.get('/student/my-courses'),
  enrollCourse: (courseId: string) =>
    api.post(`/student/courses/${courseId}/enroll`),
  getCourseDetails: (courseId: string) =>
    api.get(`/student/courses/${courseId}`),
  getDashboardStats: () => api.get('/student/dashboard-stats'),
};

export const videoAPI = {
  getStream: (videoId: string) => api.get(`/video/${videoId}/stream`),
};

export const coursesAPI = {
  getPublicCourses: () => api.get('/courses/public'),
  getPublicCourseDetails: (courseId: string) =>
    api.get(`/courses/public/${courseId}`),
};

export const chatAPI = {
  getMessages: (courseId: string) => api.get(`/chat/courses/${courseId}/messages`),
  sendMessage: (courseId: string, message: string) =>
    api.post(`/chat/courses/${courseId}/messages`, { message }),
};

export default api;
