import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Result from '../../src/models/Result.js';
import User from '../../src/models/User.js';
import Quiz from '../../src/models/Quiz.js';
import {
  submitResult,
  getUserResults,
  getAllResults,
  getResultById,
  getLeaderboard,
  getAnalytics,
  getRecommendations
} from '../../src/controllers/resultController.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Result Controller - Unit Tests', () => {
  let testUser;
  let testQuiz;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      role: 'user',
      badges: []
    });

    testQuiz = await Quiz.create({
      category: 'JavaScript',
      difficulty: 'Basic',
      question: 'Test question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      createdBy: testUser._id
    });
  });

  describe('submitResult', () => {
    it('should submit quiz result successfully', async () => {
      const req = {
        body: {
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 8,
          totalQuestions: 10,
          answers: [
            { questionId: testQuiz._id, selectedAnswer: 0, isCorrect: true }
          ]
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResult(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 8,
          totalQuestions: 10,
          category: 'JavaScript'
        })
      );

      const result = await Result.findOne({ user: testUser._id });
      expect(result).toBeTruthy();
      expect(result.score).toBe(8);
    });

    it('should award first_quiz badge on first completion', async () => {
      const req = {
        body: {
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 5,
          totalQuestions: 10,
          answers: []
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResult(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.newBadges).toContain('first_quiz');

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.badges).toContain('first_quiz');
    });

    it('should award perfect_score badge when score = totalQuestions', async () => {
      const req = {
        body: {
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 10,
          totalQuestions: 10,
          answers: []
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResult(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.newBadges).toContain('perfect_score');

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.badges).toContain('perfect_score');
    });

    it('should award top_scorer badge when score >= 90%', async () => {
      const req = {
        body: {
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 9,
          totalQuestions: 10,
          answers: []
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResult(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.newBadges).toContain('top_scorer');
    });

    it('should not award same badge twice', async () => {
      // First submission
      const req1 = {
        body: {
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 10,
          totalQuestions: 10,
          answers: []
        },
        user: { _id: testUser._id }
      };
      const res1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResult(req1, res1);

      // Second submission with perfect score
      const req2 = {
        body: {
          category: 'CSS',
          difficulty: 'Basic',
          score: 10,
          totalQuestions: 10,
          answers: []
        },
        user: { _id: testUser._id }
      };
      const res2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await submitResult(req2, res2);

      const response2 = res2.json.mock.calls[0][0];
      expect(response2.newBadges).not.toContain('perfect_score');

      const updatedUser = await User.findById(testUser._id);
      const perfectScoreBadges = updatedUser.badges.filter(b => b === 'perfect_score');
      expect(perfectScoreBadges).toHaveLength(1);
    });
  });

  describe('getUserResults', () => {
    beforeEach(async () => {
      await Result.create([
        {
          user: testUser._id,
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 8,
          totalQuestions: 10,
          answers: []
        },
        {
          user: testUser._id,
          category: 'CSS',
          difficulty: 'Intermediate',
          score: 15,
          totalQuestions: 20,
          answers: []
        }
      ]);
    });

    it('should return all results for the user', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getUserResults(req, res);

      const results = res.json.mock.calls[0][0];
      expect(results).toHaveLength(2);
      expect(results.every(r => r.user.toString() === testUser._id.toString())).toBe(true);
    });

    it('should sort results by completedAt descending', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getUserResults(req, res);

      const results = res.json.mock.calls[0][0];
      expect(new Date(results[0].completedAt) >= new Date(results[1].completedAt)).toBe(true);
    });
  });

  describe('getAllResults', () => {
    it('should return all results from all users', async () => {
      const user2 = await User.create({
        username: 'user2',
        password: 'hashedpassword',
        role: 'user'
      });

      await Result.create([
        {
          user: testUser._id,
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 8,
          totalQuestions: 10,
          answers: []
        },
        {
          user: user2._id,
          category: 'CSS',
          difficulty: 'Basic',
          score: 7,
          totalQuestions: 10,
          answers: []
        }
      ]);

      const req = {};
      const res = {
        json: jest.fn()
      };

      await getAllResults(req, res);

      const results = res.json.mock.calls[0][0];
      expect(results).toHaveLength(2);
      expect(results[0].user).toHaveProperty('username');
    });
  });

  describe('getLeaderboard', () => {
    it('should return top 10 users by best percentage', async () => {
      // Create 5 users with different scores
      const users = await Promise.all([
        User.create({ username: 'user1', password: 'hash', role: 'user' }),
        User.create({ username: 'user2', password: 'hash', role: 'user' }),
        User.create({ username: 'user3', password: 'hash', role: 'user' }),
        User.create({ username: 'user4', password: 'hash', role: 'user' }),
        User.create({ username: 'user5', password: 'hash', role: 'user' })
      ]);

      // Create results with different scores
      await Result.create([
        { user: users[0]._id, category: 'CSS', difficulty: 'Basic', score: 10, totalQuestions: 10, answers: [] },
        { user: users[1]._id, category: 'CSS', difficulty: 'Basic', score: 9, totalQuestions: 10, answers: [] },
        { user: users[2]._id, category: 'CSS', difficulty: 'Basic', score: 8, totalQuestions: 10, answers: [] },
        { user: users[3]._id, category: 'CSS', difficulty: 'Basic', score: 7, totalQuestions: 10, answers: [] },
        { user: users[4]._id, category: 'CSS', difficulty: 'Basic', score: 6, totalQuestions: 10, answers: [] }
      ]);

      const req = {};
      const res = {
        json: jest.fn()
      };

      await getLeaderboard(req, res);

      const leaderboard = res.json.mock.calls[0][0];
      expect(leaderboard).toHaveLength(5);
      expect(leaderboard[0].bestPercentage).toBe(100);
      expect(leaderboard[0].username).toBe('user1');
      expect(leaderboard[4].bestPercentage).toBe(60);
    });

    it('should use best score for users with multiple attempts', async () => {
      await Result.create([
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 5, totalQuestions: 10, answers: [] },
        { user: testUser._id, category: 'HTML', difficulty: 'Basic', score: 10, totalQuestions: 10, answers: [] },
        { user: testUser._id, category: 'JS', difficulty: 'Basic', score: 7, totalQuestions: 10, answers: [] }
      ]);

      const req = {};
      const res = {
        json: jest.fn()
      };

      await getLeaderboard(req, res);

      const leaderboard = res.json.mock.calls[0][0];
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].bestPercentage).toBe(100); // Best of 50%, 100%, 70%
    });

    it('should limit to top 10 users', async () => {
      const users = await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          User.create({ username: `user${i}`, password: 'hash', role: 'user' })
        )
      );

      await Promise.all(
        users.map((user, i) =>
          Result.create({
            user: user._id,
            category: 'CSS',
            difficulty: 'Basic',
            score: 10 - i,
            totalQuestions: 10,
            answers: []
          })
        )
      );

      const req = {};
      const res = {
        json: jest.fn()
      };

      await getLeaderboard(req, res);

      const leaderboard = res.json.mock.calls[0][0];
      expect(leaderboard).toHaveLength(10);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for user', async () => {
      await Result.create([
        { user: testUser._id, category: 'JavaScript', difficulty: 'Basic', score: 8, totalQuestions: 10, answers: [] },
        { user: testUser._id, category: 'CSS', difficulty: 'Intermediate', score: 15, totalQuestions: 20, answers: [] },
        { user: testUser._id, category: 'JavaScript', difficulty: 'Hard', score: 10, totalQuestions: 15, answers: [] }
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getAnalytics(req, res);

      const analytics = res.json.mock.calls[0][0];
      expect(analytics.totalQuizzes).toBe(3);
      expect(analytics.avgScore).toBeGreaterThan(0);
      expect(analytics.byCategory).toHaveLength(2); // JavaScript and CSS
      expect(analytics.byDifficulty).toHaveLength(3); // Basic, Intermediate, Hard
    });

    it('should return empty analytics for user with no results', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getAnalytics(req, res);

      const analytics = res.json.mock.calls[0][0];
      expect(analytics.totalQuizzes).toBe(0);
      expect(analytics.avgScore).toBe(0);
      expect(analytics.byCategory).toEqual([]);
      expect(analytics.byDifficulty).toEqual([]);
    });

    it('should calculate average score correctly', async () => {
      await Result.create([
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 10, totalQuestions: 10, answers: [] }, // 100%
        { user: testUser._id, category: 'HTML', difficulty: 'Basic', score: 6, totalQuestions: 10, answers: [] }  // 60%
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getAnalytics(req, res);

      const analytics = res.json.mock.calls[0][0];
      expect(analytics.avgScore).toBe(80); // (100 + 60) / 2 = 80
    });

    it('should group results by category', async () => {
      await Result.create([
        { user: testUser._id, category: 'JavaScript', difficulty: 'Basic', score: 8, totalQuestions: 10, answers: [] },
        { user: testUser._id, category: 'JavaScript', difficulty: 'Intermediate', score: 15, totalQuestions: 20, answers: [] },
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 7, totalQuestions: 10, answers: [] }
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getAnalytics(req, res);

      const analytics = res.json.mock.calls[0][0];
      const jsCategory = analytics.byCategory.find(c => c.category === 'JavaScript');
      expect(jsCategory.attempts).toBe(2);
      expect(jsCategory.avgScore).toBeGreaterThan(0);
      expect(jsCategory.bestScore).toBeGreaterThanOrEqual(jsCategory.avgScore);
    });
  });

  describe('getRecommendations', () => {
    it('should recommend quizzes for weak areas (score < 70%)', async () => {
      await Result.create([
        { user: testUser._id, category: 'JavaScript', difficulty: 'Basic', score: 4, totalQuestions: 10, answers: [] }, // 40%
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 6, totalQuestions: 10, answers: [] }  // 60%
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getRecommendations(req, res);

      const recommendations = res.json.mock.calls[0][0];
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(r => r.avgScore < 70)).toBe(true);
    });

    it('should not recommend categories with score >= 70%', async () => {
      await Result.create([
        { user: testUser._id, category: 'JavaScript', difficulty: 'Basic', score: 8, totalQuestions: 10, answers: [] }, // 80%
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 9, totalQuestions: 10, answers: [] }  // 90%
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getRecommendations(req, res);

      const recommendations = res.json.mock.calls[0][0];
      expect(recommendations).toHaveLength(0);
    });

    it('should recommend Basic difficulty for very low scores (< 40%)', async () => {
      await Result.create([
        { user: testUser._id, category: 'JavaScript', difficulty: 'Hard', score: 3, totalQuestions: 10, answers: [] } // 30%
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getRecommendations(req, res);

      const recommendations = res.json.mock.calls[0][0];
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].difficulty).toBe('Basic');
      expect(recommendations[0].reason).toBe('Needs significant practice');
    });

    it('should recommend Intermediate difficulty for moderate scores (40-70%)', async () => {
      await Result.create([
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 6, totalQuestions: 10, answers: [] } // 60%
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getRecommendations(req, res);

      const recommendations = res.json.mock.calls[0][0];
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].difficulty).toBe('Intermediate');
      expect(recommendations[0].reason).toBe('Good progress, keep improving');
    });

    it('should limit recommendations to top 3', async () => {
      await Result.create([
        { user: testUser._id, category: 'JavaScript', difficulty: 'Basic', score: 3, totalQuestions: 10, answers: [] }, // 30%
        { user: testUser._id, category: 'CSS', difficulty: 'Basic', score: 4, totalQuestions: 10, answers: [] }, // 40%
        { user: testUser._id, category: 'HTML', difficulty: 'Basic', score: 5, totalQuestions: 10, answers: [] }, // 50%
        { user: testUser._id, category: 'React', difficulty: 'Basic', score: 6, totalQuestions: 10, answers: [] }, // 60%
        { user: testUser._id, category: 'Python', difficulty: 'Basic', score: 6, totalQuestions: 10, answers: [] } // 60%
      ]);

      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getRecommendations(req, res);

      const recommendations = res.json.mock.calls[0][0];
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for user with no results', async () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        json: jest.fn()
      };

      await getRecommendations(req, res);

      const recommendations = res.json.mock.calls[0][0];
      expect(recommendations).toEqual([]);
    });
  });

  describe('getResultById', () => {
    it('should return result by id', async () => {
      const result = await Result.create({
        user: testUser._id,
        category: 'JavaScript',
        difficulty: 'Basic',
        score: 8,
        totalQuestions: 10,
        answers: []
      });

      const req = {
        params: { id: result._id.toString() },
        user: { _id: testUser._id, role: 'user' }
      };
      const res = {
        json: jest.fn()
      };

      await getResultById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 8,
          totalQuestions: 10
        })
      );
    });

    it('should allow admin to view any result', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        password: 'hash',
        role: 'user'
      });

      const result = await Result.create({
        user: otherUser._id,
        category: 'CSS',
        difficulty: 'Basic',
        score: 7,
        totalQuestions: 10,
        answers: []
      });

      const adminUser = await User.create({
        username: 'admin',
        password: 'hash',
        role: 'admin'
      });

      const req = {
        params: { id: result._id.toString() },
        user: { _id: adminUser._id, role: 'admin' }
      };
      const res = {
        json: jest.fn()
      };

      await getResultById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 7
        })
      );
    });

    it('should deny access if user tries to view another user\'s result', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        password: 'hash',
        role: 'user'
      });

      const result = await Result.create({
        user: otherUser._id,
        category: 'CSS',
        difficulty: 'Basic',
        score: 7,
        totalQuestions: 10,
        answers: []
      });

      const req = {
        params: { id: result._id.toString() },
        user: { _id: testUser._id, role: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getResultById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to view this result'
        })
      );
    });

    it('should return 404 if result not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: fakeId.toString() },
        user: { _id: testUser._id, role: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getResultById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
