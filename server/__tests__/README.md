# Backend Unit Tests

This directory contains unit tests for the Quiz Application backend.

## Test Structure

- `controllers/` - Unit tests for business logic controllers
  - `authController.test.js` - Authentication and user management tests
  - `quizController.test.js` - Quiz CRUD operations tests
  - `resultController.test.js` - Quiz results and analytics tests
- `middleware/` - Unit tests for middleware functions
  - `authMiddleware.test.js` - Authentication and authorization middleware tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage Goals

- **Controllers**: ≥80% coverage
  - All CRUD operations
  - Error handling
  - Edge cases
  
- **Middleware**: ≥90% coverage
  - Authentication verification
  - Authorization checks
  - Error scenarios

- **Models**: ≥70% coverage
  - Schema validation
  - Model methods
  - Relationships

## Key Testing Patterns

### 1. Database Mocking
Tests use in-memory MongoDB (mongodb-memory-server) to avoid dependencies on external database instances.

### 2. Request/Response Mocking
Express request and response objects are mocked using Jest:
```javascript
const req = { body: {...}, user: {...} };
const res = { 
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};
```

### 3. Async/Await Pattern
All tests use async/await for handling asynchronous operations.

### 4. Test Isolation
- `beforeEach` - Sets up fresh test data
- `afterEach` - Cleans up collections
- Each test is independent

## Test Categories

### Authentication Tests
- User registration (success, duplicate username, validation)
- User login (success, invalid credentials)
- JWT token generation and validation
- Password hashing verification

### Quiz Management Tests
- Create quiz (success, validation errors)
- Read quizzes (all, by filter, by ID)
- Update quiz (success, not found)
- Delete quiz (success, not found)
- Category and difficulty listing

### Result Management Tests
- Submit results (success, badge awards)
- Badge system (first quiz, perfect score, top scorer, veteran, seeker)
- User results retrieval
- Leaderboard generation
- Analytics calculation
- Recommendation system

### Middleware Tests
- JWT token validation
- Admin role verification
- Error handling (no token, invalid token, expired token)
- Authorization chains

## Badge Award Logic Tests

The badge system is thoroughly tested:
- **first_quiz**: Awarded on completing first quiz
- **perfect_score**: Awarded for 100% score
- **top_scorer**: Awarded for ≥90% score
- **quiz_veteran**: Awarded after 10 completed quizzes
- **knowledge_seeker**: Awarded after completing quizzes in 3+ categories
- **No duplicates**: Same badge not awarded twice

## Leaderboard Tests

- Calculates best percentage per user
- Sorts by percentage descending
- Limits to top 10 users
- Handles users with multiple attempts

## Analytics Tests

- Calculates total quizzes attempted
- Computes average score
- Groups by category (attempts, avg score, best score)
- Groups by difficulty (attempts, avg score)
- Handles edge cases (no results, zero division)

## Recommendations Tests

- Identifies weak areas (score < 70%)
- Suggests appropriate difficulty (Basic for < 40%, Intermediate for 40-70%)
- Limits to top 3 recommendations
- Prioritizes lowest-scoring categories

## Notes

- All tests run in isolation with clean database state
- JWT_SECRET defaults to 'test-secret' for testing
- MongoDB connection uses in-memory server
- Tests verify both success and error scenarios
- Response format and status codes are validated
