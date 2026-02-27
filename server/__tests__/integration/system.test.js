import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from '../../src/routes/authRoutes.js';
import quizRoutes from '../../src/routes/quizRoutes.js';
import resultRoutes from '../../src/routes/resultRoutes.js';
import User from '../../src/models/User.js';
import Quiz from '../../src/models/Quiz.js';
import Result from '../../src/models/Result.js';

let app;
let mongoServer;
let userToken;
let adminToken;
let userId;
let adminId;
let quizId;

beforeAll(async () => {
  // Note: This test requires network access to download MongoDB binaries
  // In restricted environments, use mocked tests instead
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/quizzes', quizRoutes);
    app.use('/api/results', resultRoutes);
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
}, 120000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 10000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

describe('System Tests - End-to-End User Flows', () => {
  describe('User Registration and Login Flow', () => {
    it('should complete full registration and login cycle', async () => {
      // Step 1: Register a new user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'systemtestuser',
          password: 'password123'
        })
        .expect(201);

      expect(registerRes.body).toHaveProperty('token');
      expect(registerRes.body.user).toHaveProperty('username', 'systemtestuser');
      expect(registerRes.body.user).toHaveProperty('role', 'user');

      // Step 2: Login with the same credentials
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'systemtestuser',
          password: 'password123'
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user.username).toBe('systemtestuser');

      // Step 3: Access protected route with token
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .expect(200);

      expect(profileRes.body.username).toBe('systemtestuser');
      expect(profileRes.body).not.toHaveProperty('password');
    });

    it('should prevent duplicate registrations', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          password: 'password123'
        })
        .expect(201);

      // Try to register again with same username
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          password: 'differentpassword'
        })
        .expect(400);
    });

    it('should reject login with wrong password', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'secureuser',
          password: 'correctpassword'
        })
        .expect(201);

      // Try to login with wrong password
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'secureuser',
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });

  describe('Complete Quiz Taking Flow', () => {
    beforeEach(async () => {
      // Create admin user and quiz
      const adminUser = await User.create({
        username: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });
      adminId = adminUser._id;
      adminToken = generateToken(adminId);

      // Create regular user
      const regularUser = await User.create({
        username: 'quiztaker',
        password: 'hashedpassword',
        role: 'user',
        badges: []
      });
      userId = regularUser._id;
      userToken = generateToken(userId);

      // Create some quizzes
      const quiz = await Quiz.create({
        category: 'JavaScript',
        difficulty: 'Basic',
        question: 'What is JavaScript?',
        options: ['A language', 'A framework', 'A library', 'A database'],
        correctAnswer: 0,
        createdBy: adminId
      });
      quizId = quiz._id;
    });

    it('should complete entire quiz workflow', async () => {
      // Step 1: Browse available quizzes
      const browsRes = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(browsRes.body).toBeInstanceOf(Array);
      expect(browsRes.body.length).toBeGreaterThan(0);

      // Step 2: Filter quizzes by category and difficulty
      const filterRes = await request(app)
        .get('/api/quizzes/filter')
        .query({ category: 'JavaScript', difficulty: 'Basic' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(filterRes.body).toBeInstanceOf(Array);
      expect(filterRes.body.every(q => q.category === 'JavaScript')).toBe(true);

      // Step 3: Get specific quiz
      const quizRes = await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(quizRes.body._id).toBeDefined();

      // Step 4: Submit quiz result
      const resultRes = await request(app)
        .post('/api/results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 8,
          totalQuestions: 10,
          answers: [
            { questionId: quizId, selectedAnswer: 0, isCorrect: true }
          ]
        })
        .expect(201);

      expect(resultRes.body).toHaveProperty('score', 8);
      expect(resultRes.body).toHaveProperty('newBadges');
      expect(resultRes.body.newBadges).toContain('first_quiz');

      // Step 5: View quiz history
      const historyRes = await request(app)
        .get('/api/results/my-results')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(historyRes.body).toHaveLength(1);
      expect(historyRes.body[0].score).toBe(8);

      // Step 6: Check leaderboard
      const leaderRes = await request(app)
        .get('/api/results/leaderboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(leaderRes.body).toBeInstanceOf(Array);

      // Step 7: View analytics
      const analyticsRes = await request(app)
        .get('/api/results/analytics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(analyticsRes.body).toHaveProperty('totalQuizzes', 1);
      expect(analyticsRes.body).toHaveProperty('avgScore');

      // Step 8: Get recommendations
      const recsRes = await request(app)
        .get('/api/results/recommendations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(recsRes.body).toBeInstanceOf(Array);
    });

    it('should award multiple badges progressively', async () => {
      // First quiz - should get first_quiz badge
      const result1 = await request(app)
        .post('/api/results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 10,
          totalQuestions: 10,
          answers: []
        })
        .expect(201);

      expect(result1.body.newBadges).toContain('first_quiz');
      expect(result1.body.newBadges).toContain('perfect_score');
      expect(result1.body.newBadges).toContain('top_scorer');

      // Create quizzes in different categories
      const cssQuiz = await Quiz.create({
        category: 'CSS',
        difficulty: 'Basic',
        question: 'What is CSS?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: adminId
      });

      const htmlQuiz = await Quiz.create({
        category: 'HTML',
        difficulty: 'Basic',
        question: 'What is HTML?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: adminId
      });

      // Complete CSS quiz
      await request(app)
        .post('/api/results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'CSS',
          difficulty: 'Basic',
          score: 9,
          totalQuestions: 10,
          answers: []
        })
        .expect(201);

      // Complete HTML quiz - should get knowledge_seeker badge (3 categories)
      const result3 = await request(app)
        .post('/api/results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'HTML',
          difficulty: 'Basic',
          score: 8,
          totalQuestions: 10,
          answers: []
        })
        .expect(201);

      expect(result3.body.newBadges).toContain('knowledge_seeker');

      // Verify user has all badges
      const profile = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(profile.body.badges).toContain('first_quiz');
      expect(profile.body.badges).toContain('perfect_score');
      expect(profile.body.badges).toContain('knowledge_seeker');
    });
  });

  describe('Admin Quiz Management Flow', () => {
    beforeEach(async () => {
      const adminUser = await User.create({
        username: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });
      adminId = adminUser._id;
      adminToken = generateToken(adminId);

      const regularUser = await User.create({
        username: 'user',
        password: 'hashedpassword',
        role: 'user'
      });
      userId = regularUser._id;
      userToken = generateToken(userId);
    });

    it('should allow admin to create, edit, and delete quizzes', async () => {
      // Step 1: Create quiz as admin
      const createRes = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'React',
          difficulty: 'Intermediate',
          question: 'What is useState?',
          options: ['A hook', 'A component', 'A library', 'A function'],
          correctAnswer: 0
        })
        .expect(201);

      const createdQuizId = createRes.body._id;
      expect(createRes.body.question).toBe('What is useState?');

      // Step 2: Edit the quiz
      const updateRes = await request(app)
        .put(`/api/quizzes/${createdQuizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: 'What is useState hook?',
          correctAnswer: 0
        })
        .expect(200);

      expect(updateRes.body.question).toBe('What is useState hook?');

      // Step 3: Verify quiz exists
      const getRes = await request(app)
        .get(`/api/quizzes/${createdQuizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getRes.body.question).toBe('What is useState hook?');

      // Step 4: Delete the quiz
      await request(app)
        .delete(`/api/quizzes/${createdQuizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Step 5: Verify quiz is deleted
      await request(app)
        .get(`/api/quizzes/${createdQuizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should prevent regular user from creating quizzes', async () => {
      await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'React',
          difficulty: 'Basic',
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0
        })
        .expect(403);
    });

    it('should prevent regular user from deleting quizzes', async () => {
      const quiz = await Quiz.create({
        category: 'CSS',
        difficulty: 'Basic',
        question: 'What is CSS?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: adminId
      });

      await request(app)
        .delete(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Admin User Results Management Flow', () => {
    beforeEach(async () => {
      // Create admin
      const adminUser = await User.create({
        username: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });
      adminId = adminUser._id;
      adminToken = generateToken(adminId);

      // Create multiple users
      const user1 = await User.create({
        username: 'user1',
        password: 'hashedpassword',
        role: 'user'
      });
      const user2 = await User.create({
        username: 'user2',
        password: 'hashedpassword',
        role: 'user'
      });

      // Create quiz
      const quiz = await Quiz.create({
        category: 'JavaScript',
        difficulty: 'Basic',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: adminId
      });

      // Create results for different users
      await Result.create([
        {
          user: user1._id,
          category: 'JavaScript',
          difficulty: 'Basic',
          score: 8,
          totalQuestions: 10,
          answers: []
        },
        {
          user: user1._id,
          category: 'CSS',
          difficulty: 'Intermediate',
          score: 15,
          totalQuestions: 20,
          answers: []
        },
        {
          user: user2._id,
          category: 'JavaScript',
          difficulty: 'Hard',
          score: 10,
          totalQuestions: 15,
          answers: []
        }
      ]);
    });

    it('should allow admin to view all user results', async () => {
      const res = await request(app)
        .get('/api/results/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].user).toHaveProperty('username');
      
      // Verify results from different users
      const usernames = res.body.map(r => r.user.username);
      expect(usernames).toContain('user1');
      expect(usernames).toContain('user2');
    });

    it('should prevent regular user from viewing all results', async () => {
      const regularUser = await User.create({
        username: 'regularuser',
        password: 'hashedpassword',
        role: 'user'
      });
      const regularToken = generateToken(regularUser._id);

      await request(app)
        .get('/api/results/all')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('should allow admin to view specific user result', async () => {
      const results = await Result.find({});
      const resultId = results[0]._id;

      const res = await request(app)
        .get(`/api/results/${resultId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body._id).toBe(resultId.toString());
    });
  });

  describe('Admin User Management Flow', () => {
    beforeEach(async () => {
      const adminUser = await User.create({
        username: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });
      adminId = adminUser._id;
      adminToken = generateToken(adminId);

      const regularUser = await User.create({
        username: 'regularuser',
        password: 'hashedpassword',
        role: 'user'
      });
      userId = regularUser._id;
      userToken = generateToken(userId);
    });

    it('should allow admin to view all users', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.map(u => u.username)).toContain('admin');
      expect(res.body.map(u => u.username)).toContain('regularuser');
    });

    it('should allow admin to promote user to admin', async () => {
      const res = await request(app)
        .put(`/api/auth/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' })
        .expect(200);

      expect(res.body.role).toBe('admin');

      // Verify in database
      const updatedUser = await User.findById(userId);
      expect(updatedUser.role).toBe('admin');
    });

    it('should allow admin to demote admin to user', async () => {
      // First promote user to admin
      await User.findByIdAndUpdate(userId, { role: 'admin' });

      // Then demote back to user
      const res = await request(app)
        .put(`/api/auth/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' })
        .expect(200);

      expect(res.body.role).toBe('user');
    });

    it('should prevent regular user from viewing all users', async () => {
      await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should prevent regular user from changing roles', async () => {
      await request(app)
        .put(`/api/auth/users/${userId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })
        .expect(403);
    });
  });

  describe('Multi-User Quiz Competition Scenario', () => {
    it('should handle multiple users taking same quiz and generate leaderboard', async () => {
      // Create admin and quiz
      const adminUser = await User.create({
        username: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });
      const quiz = await Quiz.create({
        category: 'JavaScript',
        difficulty: 'Basic',
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: adminUser._id
      });

      // Create 5 users with different scores
      const users = await Promise.all([
        User.create({ username: 'alice', password: 'hash', role: 'user' }),
        User.create({ username: 'bob', password: 'hash', role: 'user' }),
        User.create({ username: 'carol', password: 'hash', role: 'user' }),
        User.create({ username: 'dave', password: 'hash', role: 'user' }),
        User.create({ username: 'eve', password: 'hash', role: 'user' })
      ]);

      // Each user takes the quiz with different scores
      const scores = [10, 9, 8, 7, 6]; // 100%, 90%, 80%, 70%, 60%

      for (let i = 0; i < users.length; i++) {
        const token = generateToken(users[i]._id);
        await request(app)
          .post('/api/results')
          .set('Authorization', `Bearer ${token}`)
          .send({
            category: 'JavaScript',
            difficulty: 'Basic',
            score: scores[i],
            totalQuestions: 10,
            answers: []
          })
          .expect(201);
      }

      // Check leaderboard
      const token = generateToken(users[0]._id);
      const leaderRes = await request(app)
        .get('/api/results/leaderboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(leaderRes.body).toHaveLength(5);
      expect(leaderRes.body[0].username).toBe('alice');
      expect(leaderRes.body[0].bestPercentage).toBe(100);
      expect(leaderRes.body[4].username).toBe('eve');
      expect(leaderRes.body[4].bestPercentage).toBe(60);
    });
  });

  describe('Analytics and Recommendations Flow', () => {
    it('should provide personalized recommendations based on performance', async () => {
      // Create user
      const user = await User.create({
        username: 'learner',
        password: 'hashedpassword',
        role: 'user'
      });
      const token = generateToken(user._id);

      // Create results with weak performance in JavaScript
      await Result.create([
        { user: user._id, category: 'JavaScript', difficulty: 'Basic', score: 3, totalQuestions: 10, answers: [] }, // 30%
        { user: user._id, category: 'JavaScript', difficulty: 'Intermediate', score: 5, totalQuestions: 20, answers: [] }, // 25%
        { user: user._id, category: 'CSS', difficulty: 'Basic', score: 9, totalQuestions: 10, answers: [] } // 90%
      ]);

      // Get recommendations
      const recRes = await request(app)
        .get('/api/results/recommendations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(recRes.body).toHaveLength(1); // Only JavaScript needs practice
      expect(recRes.body[0].category).toBe('JavaScript');
      expect(recRes.body[0].difficulty).toBe('Basic'); // Low score suggests Basic
      expect(recRes.body[0].avgScore).toBeLessThan(70);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'hashedpassword',
        role: 'user'
      });
      userId = user._id;
      userToken = generateToken(userId);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/quizzes')
        .expect(401);

      await request(app)
        .get('/api/results/my-results')
        .expect(401);

      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should handle non-existent resource gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/quizzes/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      await request(app)
        .get(`/api/results/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should validate quiz creation data', async () => {
      const adminUser = await User.create({
        username: 'admin',
        password: 'hashedpassword',
        role: 'admin'
      });
      const adminToken = generateToken(adminUser._id);

      // Missing required fields
      await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'JavaScript'
          // Missing question, options, correctAnswer, difficulty
        })
        .expect(500);

      // Invalid number of options
      await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'JavaScript',
          difficulty: 'Basic',
          question: 'Test?',
          options: ['A', 'B'], // Only 2 options instead of 4
          correctAnswer: 0
        })
        .expect(500);
    });

    it('should return empty results for new user', async () => {
      const res = await request(app)
        .get('/api/results/my-results')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toEqual([]);

      const analyticsRes = await request(app)
        .get('/api/results/analytics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(analyticsRes.body.totalQuizzes).toBe(0);
      expect(analyticsRes.body.avgScore).toBe(0);
    });
  });
});

// Helper function to generate JWT token
function generateToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '30d'
  });
}
