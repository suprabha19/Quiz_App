import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';
import { registerUser, loginUser, getUserProfile, getAllUsers, updateUserRole } from '../../src/controllers/authController.js';

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

describe('Auth Controller - Unit Tests', () => {
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            username: 'testuser',
            role: 'user'
          })
        })
      );

      const user = await User.findOne({ username: 'testuser' });
      expect(user).toBeTruthy();
      expect(user.password).not.toBe('password123');
    });

    it('should return 400 if username already exists', async () => {
      await User.create({
        username: 'existinguser',
        password: await bcrypt.hash('password123', 10)
      });

      const req = {
        body: {
          username: 'existinguser',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already exists')
        })
      );
    });

    it('should hash password before saving', async () => {
      const req = {
        body: {
          username: 'secureuser',
          password: 'mypassword'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await registerUser(req, res);

      const user = await User.findOne({ username: 'secureuser' });
      expect(user.password).not.toBe('mypassword');
      const isValidPassword = await bcrypt.compare('mypassword', user.password);
      expect(isValidPassword).toBe(true);
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'loginuser',
        password: hashedPassword,
        role: 'user'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const req = {
        body: {
          username: 'loginuser',
          password: 'password123'
        }
      };
      const res = {
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            username: 'loginuser'
          })
        })
      );
    });

    it('should return 401 with incorrect password', async () => {
      const req = {
        body: {
          username: 'loginuser',
          password: 'wrongpassword'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials'
        })
      );
    });

    it('should return 401 with non-existent username', async () => {
      const req = {
        body: {
          username: 'nonexistent',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials'
        })
      );
    });

    it('should return JWT token that can be decoded', async () => {
      const req = {
        body: {
          username: 'loginuser',
          password: 'password123'
        }
      };
      const res = {
        json: jest.fn()
      };

      await loginUser(req, res);

      const response = res.json.mock.calls[0][0];
      const decoded = jwt.decode(response.token);
      expect(decoded).toHaveProperty('id');
      expect(decoded.id).toBeTruthy();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const user = await User.create({
        username: 'profileuser',
        password: 'hashedpassword',
        role: 'user',
        badges: ['first_quiz']
      });

      const req = {
        user: { _id: user._id }
      };
      const res = {
        json: jest.fn()
      };

      await getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'profileuser',
          role: 'user',
          badges: ['first_quiz']
        })
      );
    });

    it('should not include password in response', async () => {
      const user = await User.create({
        username: 'secureuser',
        password: 'hashedpassword',
        role: 'user'
      });

      const req = {
        user: { _id: user._id }
      };
      const res = {
        json: jest.fn()
      };

      await getUserProfile(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response).not.toHaveProperty('password');
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      await User.create([
        { username: 'user1', password: 'hash1', role: 'user' },
        { username: 'user2', password: 'hash2', role: 'user' },
        { username: 'admin1', password: 'hash3', role: 'admin' }
      ]);
    });

    it('should return all users', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalled();
      const users = res.json.mock.calls[0][0];
      expect(users).toHaveLength(3);
      expect(users.map(u => u.username)).toEqual(
        expect.arrayContaining(['user1', 'user2', 'admin1'])
      );
    });

    it('should not include passwords in response', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await getAllUsers(req, res);

      const users = res.json.mock.calls[0][0];
      users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('updateUserRole', () => {
    it('should update user role from user to admin', async () => {
      const user = await User.create({
        username: 'normaluser',
        password: 'hashedpassword',
        role: 'user'
      });

      const req = {
        params: { id: user._id.toString() },
        body: { role: 'admin' }
      };
      const res = {
        json: jest.fn()
      };

      await updateUserRole(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'normaluser',
          role: 'admin'
        })
      );

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('admin');
    });

    it('should update user role from admin to user', async () => {
      const user = await User.create({
        username: 'adminuser',
        password: 'hashedpassword',
        role: 'admin'
      });

      const req = {
        params: { id: user._id.toString() },
        body: { role: 'user' }
      };
      const res = {
        json: jest.fn()
      };

      await updateUserRole(req, res);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('user');
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: fakeId.toString() },
        body: { role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found'
        })
      );
    });
  });
});
