import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
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

// Auth API calls
export const authAPI = {
  register: (username, password) => api.post('/auth/register', { username, password }),
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
  getAllUsers: () => api.get('/auth/users')
};

// Quiz API calls
export const quizAPI = {
  getAllQuizzes: () => api.get('/quizzes'),
  getQuizzesByFilter: (category, difficulty) => 
    api.get('/quizzes/filter', { params: { category, difficulty } }),
  getQuizById: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (quizData) => api.post('/quizzes', quizData),
  updateQuiz: (id, quizData) => api.put(`/quizzes/${id}`, quizData),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  getCategories: () => api.get('/quizzes/categories'),
  getDifficulties: () => api.get('/quizzes/difficulties')
};

// Result API calls
export const resultAPI = {
  submitResult: (resultData) => api.post('/results', resultData),
  getUserResults: () => api.get('/results/my-results'),
  getAllResults: () => api.get('/results/all'),
  getResultById: (id) => api.get(`/results/${id}`)
};

export default api;
