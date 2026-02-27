import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';
import { protect, admin } from '../../src/middleware/authMiddleware.js';

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

describe('Auth Middleware - Unit Tests', () => {
  let testUser;
  let validToken;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      password: 'hashedpassword',
      role: 'user'
    });

    validToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '30d'
    });
  });

  describe('protect middleware', () => {
    it('should authenticate user with valid token', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('testuser');
      expect(req.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized, no token'
        })
      );
    });

    it('should reject request with malformed token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token.here'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1s' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject token for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const fakeToken = jwt.sign({ id: fakeId }, process.env.JWT_SECRET || 'test-secret');

      const req = {
        headers: {
          authorization: `Bearer ${fakeToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized, token failed'
        })
      );
    });

    it('should handle authorization header without Bearer prefix', async () => {
      const req = {
        headers: {
          authorization: validToken // Without "Bearer "
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should exclude password from user object', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.password).toBeUndefined();
    });
  });

  describe('admin middleware', () => {
    it('should allow access for admin users', () => {
      const req = {
        user: { _id: testUser._id, role: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      admin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for regular users', () => {
      const req = {
        user: { _id: testUser._id, role: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      admin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized as admin'
        })
      );
    });

    it('should deny access if user object is missing', () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      admin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should deny access if role property is missing', () => {
      const req = {
        user: { _id: testUser._id }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      admin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should be case-sensitive for role checking', () => {
      const req = {
        user: { _id: testUser._id, role: 'Admin' } // Capital A
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      admin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('protect and admin middleware chain', () => {
    it('should properly chain protect and admin middleware', async () => {
      const adminUser = await User.create({
        username: 'adminuser',
        password: 'hashedpassword',
        role: 'admin'
      });

      const adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'test-secret');

      const req = {
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const nextProtect = jest.fn();
      const nextAdmin = jest.fn();

      // First: protect middleware
      await protect(req, res, nextProtect);
      expect(nextProtect).toHaveBeenCalled();
      expect(req.user).toBeDefined();

      // Second: admin middleware
      admin(req, res, nextAdmin);
      expect(nextAdmin).toHaveBeenCalled();
    });

    it('should block non-admin even with valid token', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const nextProtect = jest.fn();
      const nextAdmin = jest.fn();

      // First: protect middleware (should pass)
      await protect(req, res, nextProtect);
      expect(nextProtect).toHaveBeenCalled();

      // Second: admin middleware (should block)
      admin(req, res, nextAdmin);
      expect(nextAdmin).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
