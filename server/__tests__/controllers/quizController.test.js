import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Quiz from '../../src/models/Quiz.js';
import User from '../../src/models/User.js';
import {
  getAllQuizzes,
  getQuizzesByCategoryAndDifficulty,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getCategories,
  getDifficulties
} from '../../src/controllers/quizController.js';

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

describe('Quiz Controller - Unit Tests', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testadmin',
      password: 'hashedpassword',
      role: 'admin'
    });
  });

  describe('createQuiz', () => {
    it('should create a new quiz successfully', async () => {
      const req = {
        body: {
          category: 'JavaScript',
          difficulty: 'Basic',
          question: 'What is a closure?',
          options: ['A function', 'A variable', 'A scope', 'All of above'],
          correctAnswer: 3
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'What is a closure?',
          category: 'JavaScript',
          difficulty: 'Basic'
        })
      );

      const quiz = await Quiz.findOne({ question: 'What is a closure?' });
      expect(quiz).toBeTruthy();
      expect(quiz.createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should validate required fields', async () => {
      const req = {
        body: {
          category: 'JavaScript',
          // Missing question, options, correctAnswer
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should require exactly 4 options', async () => {
      const req = {
        body: {
          category: 'HTML',
          difficulty: 'Basic',
          question: 'What is HTML?',
          options: ['Language', 'Framework'], // Only 2 options
          correctAnswer: 0
        },
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllQuizzes', () => {
    beforeEach(async () => {
      await Quiz.create([
        {
          category: 'HTML',
          difficulty: 'Basic',
          question: 'Q1',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          createdBy: testUser._id
        },
        {
          category: 'CSS',
          difficulty: 'Intermediate',
          question: 'Q2',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 1,
          createdBy: testUser._id
        },
        {
          category: 'JavaScript',
          difficulty: 'Hard',
          question: 'Q3',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 2,
          createdBy: testUser._id
        }
      ]);
    });

    it('should return all quizzes', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getAllQuizzes(req, res);

      expect(res.json).toHaveBeenCalled();
      const quizzes = res.json.mock.calls[0][0];
      expect(quizzes).toHaveLength(3);
    });

    it('should populate createdBy field', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getAllQuizzes(req, res);

      const quizzes = res.json.mock.calls[0][0];
      expect(quizzes[0].createdBy).toHaveProperty('username');
      expect(quizzes[0].createdBy.username).toBe('testadmin');
    });
  });

  describe('getQuizzesByCategoryAndDifficulty', () => {
    beforeEach(async () => {
      await Quiz.create([
        {
          category: 'HTML',
          difficulty: 'Basic',
          question: 'Q1',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          createdBy: testUser._id
        },
        {
          category: 'HTML',
          difficulty: 'Intermediate',
          question: 'Q2',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 1,
          createdBy: testUser._id
        },
        {
          category: 'CSS',
          difficulty: 'Basic',
          question: 'Q3',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 2,
          createdBy: testUser._id
        }
      ]);
    });

    it('should filter by category only', async () => {
      const req = {
        query: { category: 'HTML' }
      };
      const res = {
        json: jest.fn()
      };

      await getQuizzesByCategoryAndDifficulty(req, res);

      const quizzes = res.json.mock.calls[0][0];
      expect(quizzes).toHaveLength(2);
      expect(quizzes.every(q => q.category === 'HTML')).toBe(true);
    });

    it('should filter by difficulty only', async () => {
      const req = {
        query: { difficulty: 'Basic' }
      };
      const res = {
        json: jest.fn()
      };

      await getQuizzesByCategoryAndDifficulty(req, res);

      const quizzes = res.json.mock.calls[0][0];
      expect(quizzes).toHaveLength(2);
      expect(quizzes.every(q => q.difficulty === 'Basic')).toBe(true);
    });

    it('should filter by both category and difficulty', async () => {
      const req = {
        query: { category: 'HTML', difficulty: 'Basic' }
      };
      const res = {
        json: jest.fn()
      };

      await getQuizzesByCategoryAndDifficulty(req, res);

      const quizzes = res.json.mock.calls[0][0];
      expect(quizzes).toHaveLength(1);
      expect(quizzes[0].category).toBe('HTML');
      expect(quizzes[0].difficulty).toBe('Basic');
    });

    it('should return all quizzes if no filter provided', async () => {
      const req = {
        query: {}
      };
      const res = {
        json: jest.fn()
      };

      await getQuizzesByCategoryAndDifficulty(req, res);

      const quizzes = res.json.mock.calls[0][0];
      expect(quizzes).toHaveLength(3);
    });
  });

  describe('getQuizById', () => {
    it('should return quiz by id', async () => {
      const quiz = await Quiz.create({
        category: 'React',
        difficulty: 'Intermediate',
        question: 'What is JSX?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: testUser._id
      });

      const req = {
        params: { id: quiz._id.toString() }
      };
      const res = {
        json: jest.fn()
      };

      await getQuizById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'What is JSX?',
          category: 'React'
        })
      );
    });

    it('should return 404 if quiz not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: fakeId.toString() }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getQuizById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Quiz not found'
        })
      );
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz successfully', async () => {
      const quiz = await Quiz.create({
        category: 'CSS',
        difficulty: 'Basic',
        question: 'Original question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: testUser._id
      });

      const req = {
        params: { id: quiz._id.toString() },
        body: {
          question: 'Updated question',
          correctAnswer: 2
        }
      };
      const res = {
        json: jest.fn()
      };

      await updateQuiz(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'Updated question',
          correctAnswer: 2
        })
      );

      const updatedQuiz = await Quiz.findById(quiz._id);
      expect(updatedQuiz.question).toBe('Updated question');
      expect(updatedQuiz.correctAnswer).toBe(2);
    });

    it('should return 404 if quiz to update not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: fakeId.toString() },
        body: { question: 'New question' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz successfully', async () => {
      const quiz = await Quiz.create({
        category: 'Python',
        difficulty: 'Hard',
        question: 'Question to delete',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        createdBy: testUser._id
      });

      const req = {
        params: { id: quiz._id.toString() }
      };
      const res = {
        json: jest.fn()
      };

      await deleteQuiz(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Quiz deleted successfully'
        })
      );

      const deletedQuiz = await Quiz.findById(quiz._id);
      expect(deletedQuiz).toBeNull();
    });

    it('should return 404 if quiz to delete not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: fakeId.toString() }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await deleteQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getCategories', () => {
    beforeEach(async () => {
      await Quiz.create([
        {
          category: 'HTML',
          difficulty: 'Basic',
          question: 'Q1',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          createdBy: testUser._id
        },
        {
          category: 'CSS',
          difficulty: 'Basic',
          question: 'Q2',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          createdBy: testUser._id
        },
        {
          category: 'HTML',
          difficulty: 'Intermediate',
          question: 'Q3',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          createdBy: testUser._id
        }
      ]);
    });

    it('should return unique categories', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getCategories(req, res);

      const categories = res.json.mock.calls[0][0];
      expect(categories).toHaveLength(2);
      expect(categories).toEqual(expect.arrayContaining(['HTML', 'CSS']));
    });

    it('should return empty array if no quizzes', async () => {
      await Quiz.deleteMany({});

      const req = {};
      const res = {
        json: jest.fn()
      };

      await getCategories(req, res);

      const categories = res.json.mock.calls[0][0];
      expect(categories).toHaveLength(0);
    });
  });

  describe('getDifficulties', () => {
    it('should return standard difficulty levels', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getDifficulties(req, res);

      const difficulties = res.json.mock.calls[0][0];
      expect(difficulties).toEqual(['Basic', 'Intermediate', 'Hard']);
    });
  });
});
