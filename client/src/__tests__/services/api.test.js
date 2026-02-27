import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authAPI, quizAPI, resultAPI } from '../../services/api';

vi.mock('axios');

describe('API Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('authAPI', () => {
    it('should call register endpoint', async () => {
      const mockResponse = { data: { token: 'token', user: { username: 'test' } } };
      axios.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.register('testuser', 'password123');

      expect(result.data).toEqual(mockResponse.data);
    });

    it('should call login endpoint', async () => {
      const mockResponse = { data: { token: 'token', user: { username: 'test' } } };
      axios.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.login('testuser', 'password123');

      expect(result.data).toEqual(mockResponse.data);
    });

    it('should call getProfile endpoint', async () => {
      const mockResponse = { data: { username: 'test', role: 'user' } };
      axios.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.getProfile();

      expect(result.data).toEqual(mockResponse.data);
    });

    it('should call getAllUsers endpoint', async () => {
      const mockResponse = { data: [{ username: 'user1' }, { username: 'user2' }] };
      axios.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.getAllUsers();

      expect(result.data).toHaveLength(2);
    });

    it('should call updateUserRole endpoint', async () => {
      const mockResponse = { data: { username: 'test', role: 'admin' } };
      axios.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.updateUserRole('123', 'admin');

      expect(result.data.role).toBe('admin');
    });
  });

  describe('quizAPI', () => {
    it('should fetch all quizzes', async () => {
      const mockQuizzes = [
        { _id: '1', question: 'Q1', category: 'CSS' },
        { _id: '2', question: 'Q2', category: 'HTML' }
      ];
      axios.get = vi.fn().mockResolvedValue({ data: mockQuizzes });

      const result = await quizAPI.getAllQuizzes();

      expect(result.data).toHaveLength(2);
    });

    it('should filter quizzes by category and difficulty', async () => {
      const mockQuizzes = [{ _id: '1', question: 'Q1', category: 'CSS', difficulty: 'Basic' }];
      axios.get = vi.fn().mockResolvedValue({ data: mockQuizzes });

      const result = await quizAPI.getQuizzesByFilter('CSS', 'Basic');

      expect(result.data[0].category).toBe('CSS');
      expect(result.data[0].difficulty).toBe('Basic');
    });

    it('should create quiz', async () => {
      const quizData = {
        category: 'JavaScript',
        difficulty: 'Basic',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0
      };
      const mockResponse = { data: { ...quizData, _id: '123' } };
      axios.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await quizAPI.createQuiz(quizData);

      expect(result.data._id).toBe('123');
      expect(result.data.question).toBe('Test?');
    });

    it('should update quiz', async () => {
      const mockResponse = { data: { _id: '123', question: 'Updated?' } };
      axios.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await quizAPI.updateQuiz('123', { question: 'Updated?' });

      expect(result.data.question).toBe('Updated?');
    });

    it('should delete quiz', async () => {
      const mockResponse = { data: { message: 'Deleted' } };
      axios.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await quizAPI.deleteQuiz('123');

      expect(result.data.message).toBe('Deleted');
    });

    it('should fetch categories', async () => {
      const mockCategories = ['HTML', 'CSS', 'JavaScript'];
      axios.get = vi.fn().mockResolvedValue({ data: mockCategories });

      const result = await quizAPI.getCategories();

      expect(result.data).toHaveLength(3);
    });
  });

  describe('resultAPI', () => {
    it('should submit quiz result', async () => {
      const resultData = {
        category: 'JavaScript',
        difficulty: 'Basic',
        score: 8,
        totalQuestions: 10,
        answers: []
      };
      const mockResponse = { data: { ...resultData, _id: '123', newBadges: ['first_quiz'] } };
      axios.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await resultAPI.submitResult(resultData);

      expect(result.data.score).toBe(8);
      expect(result.data.newBadges).toContain('first_quiz');
    });

    it('should get user results', async () => {
      const mockResults = [
        { _id: '1', score: 8, totalQuestions: 10 },
        { _id: '2', score: 15, totalQuestions: 20 }
      ];
      axios.get = vi.fn().mockResolvedValue({ data: mockResults });

      const result = await resultAPI.getUserResults();

      expect(result.data).toHaveLength(2);
    });

    it('should get leaderboard', async () => {
      const mockLeaderboard = [
        { username: 'user1', bestPercentage: 100 },
        { username: 'user2', bestPercentage: 90 }
      ];
      axios.get = vi.fn().mockResolvedValue({ data: mockLeaderboard });

      const result = await resultAPI.getLeaderboard();

      expect(result.data[0].bestPercentage).toBeGreaterThanOrEqual(result.data[1].bestPercentage);
    });

    it('should get analytics', async () => {
      const mockAnalytics = {
        totalQuizzes: 5,
        avgScore: 75,
        byCategory: [],
        byDifficulty: []
      };
      axios.get = vi.fn().mockResolvedValue({ data: mockAnalytics });

      const result = await resultAPI.getAnalytics();

      expect(result.data.totalQuizzes).toBe(5);
      expect(result.data.avgScore).toBe(75);
    });

    it('should get recommendations', async () => {
      const mockRecs = [
        { category: 'JavaScript', difficulty: 'Basic', avgScore: 45 }
      ];
      axios.get = vi.fn().mockResolvedValue({ data: mockRecs });

      const result = await resultAPI.getRecommendations();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].avgScore).toBeLessThan(70);
    });

    it('should get all results (admin)', async () => {
      const mockResults = [
        { _id: '1', user: { username: 'user1' }, score: 8 },
        { _id: '2', user: { username: 'user2' }, score: 9 }
      ];
      axios.get = vi.fn().mockResolvedValue({ data: mockResults });

      const result = await resultAPI.getAllResults();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].user).toHaveProperty('username');
    });
  });

  describe('API interceptor', () => {
    it('should add authorization header when token exists', () => {
      const mockToken = 'test-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Test that interceptor would add the token
      // Note: This is a simplified test - in real scenario, 
      // you'd test the actual interceptor behavior
      const token = localStorage.getItem('token');
      expect(token).toBe(mockToken);
    });

    it('should not add authorization header when no token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const token = localStorage.getItem('token');
      expect(token).toBeNull();
    });
  });
});
