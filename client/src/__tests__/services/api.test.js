import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing API
vi.mock('axios', () => {
  const mockCreate = vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }));

  return {
    default: {
      create: mockCreate,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  };
});

import { authAPI, quizAPI, resultAPI } from '../../services/api';

describe('API Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('authAPI', () => {
    it('should have register method', () => {
      expect(authAPI.register).toBeDefined();
      expect(typeof authAPI.register).toBe('function');
    });

    it('should have login method', () => {
      expect(authAPI.login).toBeDefined();
      expect(typeof authAPI.login).toBe('function');
    });

    it('should have getProfile method', () => {
      expect(authAPI.getProfile).toBeDefined();
      expect(typeof authAPI.getProfile).toBe('function');
    });

    it('should have getAllUsers method', () => {
      expect(authAPI.getAllUsers).toBeDefined();
      expect(typeof authAPI.getAllUsers).toBe('function');
    });

    it('should have updateUserRole method', () => {
      expect(authAPI.updateUserRole).toBeDefined();
      expect(typeof authAPI.updateUserRole).toBe('function');
    });
  });

  describe('quizAPI', () => {
    it('should have getAllQuizzes method', () => {
      expect(quizAPI.getAllQuizzes).toBeDefined();
      expect(typeof quizAPI.getAllQuizzes).toBe('function');
    });

    it('should have getQuizzesByFilter method', () => {
      expect(quizAPI.getQuizzesByFilter).toBeDefined();
      expect(typeof quizAPI.getQuizzesByFilter).toBe('function');
    });

    it('should have getQuizById method', () => {
      expect(quizAPI.getQuizById).toBeDefined();
      expect(typeof quizAPI.getQuizById).toBe('function');
    });

    it('should have createQuiz method', () => {
      expect(quizAPI.createQuiz).toBeDefined();
      expect(typeof quizAPI.createQuiz).toBe('function');
    });

    it('should have updateQuiz method', () => {
      expect(quizAPI.updateQuiz).toBeDefined();
      expect(typeof quizAPI.updateQuiz).toBe('function');
    });

    it('should have deleteQuiz method', () => {
      expect(quizAPI.deleteQuiz).toBeDefined();
      expect(typeof quizAPI.deleteQuiz).toBe('function');
    });

    it('should have getCategories method', () => {
      expect(quizAPI.getCategories).toBeDefined();
      expect(typeof quizAPI.getCategories).toBe('function');
    });

    it('should have getDifficulties method', () => {
      expect(quizAPI.getDifficulties).toBeDefined();
      expect(typeof quizAPI.getDifficulties).toBe('function');
    });
  });

  describe('resultAPI', () => {
    it('should have submitResult method', () => {
      expect(resultAPI.submitResult).toBeDefined();
      expect(typeof resultAPI.submitResult).toBe('function');
    });

    it('should have getUserResults method', () => {
      expect(resultAPI.getUserResults).toBeDefined();
      expect(typeof resultAPI.getUserResults).toBe('function');
    });

    it('should have getLeaderboard method', () => {
      expect(resultAPI.getLeaderboard).toBeDefined();
      expect(typeof resultAPI.getLeaderboard).toBe('function');
    });

    it('should have getAnalytics method', () => {
      expect(resultAPI.getAnalytics).toBeDefined();
      expect(typeof resultAPI.getAnalytics).toBe('function');
    });

    it('should have getRecommendations method', () => {
      expect(resultAPI.getRecommendations).toBeDefined();
      expect(typeof resultAPI.getRecommendations).toBe('function');
    });

    it('should have getAllResults method', () => {
      expect(resultAPI.getAllResults).toBeDefined();
      expect(typeof resultAPI.getAllResults).toBe('function');
    });

    it('should have getResultById method', () => {
      expect(resultAPI.getResultById).toBeDefined();
      expect(typeof resultAPI.getResultById).toBe('function');
    });
  });

  describe('localStorage integration', () => {
    it('should store token in localStorage', () => {
      const mockToken = 'test-token';
      localStorage.setItem('token', mockToken);

      const token = localStorage.getItem('token');
      expect(token).toBe(mockToken);
    });

    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.removeItem('token');

      const token = localStorage.getItem('token');
      expect(token).toBeNull();
    });
  });
});
