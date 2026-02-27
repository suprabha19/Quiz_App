# Quiz Application - MERN Stack

A full-stack quiz application built with MongoDB, Express.js, React, and Node.js (MERN stack). Features include user authentication with JWT, multiple quiz categories, difficulty levels (Basic, Intermediate, Hard), comprehensive admin panel for dynamic quiz management, badge system, leaderboard, and analytics.

## 📋 Documentation

- **[System Architecture](docs/diagrams/system-architecture.md)** - Three-tier architecture overview
- **[Use Case Diagram](docs/diagrams/use-case-diagram.md)** - User roles and interactions
- **[Class Diagram](docs/diagrams/class-diagram.md)** - Database models and relationships
- **[Sequence Diagrams](docs/diagrams/sequence-diagram.md)** - Authentication and quiz flows
- **[Activity Diagrams](docs/diagrams/activity-diagram.md)** - User and admin workflows
- **[Gantt Chart](docs/diagrams/gantt-chart.md)** - Development timeline
- **[Testing Guide](docs/TESTING.md)** - Unit and system testing documentation

## Features

### User Features
- 🔐 **Authentication**: Secure login and registration with JWT tokens
- 📚 **Multiple Categories**: HTML, CSS, JavaScript, React, Python, and more
- 📊 **Difficulty Levels**: Basic, Intermediate, and Hard questions
- 🎯 **Interactive Quiz**: Take quizzes with real-time progress tracking
- 📈 **Results & Certificate**: View detailed results with downloadable certificates
- 💾 **Result History**: All quiz attempts saved with detailed breakdowns
- 🏆 **Leaderboard**: Compete with other users and see top performers
- 📊 **Analytics Dashboard**: Visualize performance by category and difficulty
- 🎖️ **Badge System**: Earn achievements (First Quiz, Perfect Score, Top Scorer, Quiz Veteran, Knowledge Seeker)
- 💡 **Smart Recommendations**: Get personalized quiz suggestions based on your performance
- 🔍 **Search Functionality**: Find quiz categories quickly

### Admin Features
- ➕ **Create Quizzes**: Add new questions dynamically with custom categories
- ✏️ **Edit Quizzes**: Modify existing questions, options, and correct answers
- 🗑️ **Delete Quizzes**: Remove questions from the system
- 📊 **Dashboard**: View statistics and manage all quizzes
- 🔍 **Filter & Search**: Filter quizzes by category and difficulty
- 👥 **User Management**: View all users and manage roles
- 📋 **User Results**: See which user attempted what quiz and their results
- 🔄 **Role Management**: Promote users to admin or demote admins to users

## Tech Stack

### Backend
- **Node.js & Express.js**: RESTful API server
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing

### Frontend
- **React 18**: UI library with hooks
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Vite**: Fast build tool and dev server

## Project Structure

```
Quiz_App/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── server.js      # Express server
│   │   └── seed.js        # Database seeding
│   ├── package.json
│   └── .env               # Environment variables
│
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (Auth)
│   │   ├── services/      # API service layer
│   │   ├── styles/        # CSS files
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/suprabha19/Quiz_App.git
cd Quiz_App
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quiz_app
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

### 4. Database Seeding (Optional)

Seed the database with initial data (includes admin user and sample quizzes):

```bash
cd server
npm run seed
```

This creates:
- **Admin user**: username: `admin`, password: `admin123`
- **Regular user**: username: `user`, password: `user123`
- Sample quiz questions across all categories

### 5. Running the Application

**Start MongoDB** (if running locally):
```bash
mongod
```

**Start Backend Server** (in server directory):
```bash
cd server
npm run dev
```
Server runs on http://localhost:5000

**Start Frontend Development Server** (in client directory):
```bash
cd client
npm run dev
```
Client runs on http://localhost:3000

## Usage

### For Users
1. **Register/Login**: Create an account or login with existing credentials
2. **Select Category**: Choose from available categories in the sidebar
3. **Choose Difficulty**: Select Basic, Intermediate, or Hard level
4. **Take Quiz**: Answer questions one by one
5. **View Results**: See your score and performance after completion

### For Admins
1. **Login as Admin**: Use admin credentials (admin/admin123)
2. **Access Admin Panel**: Click "Admin Panel" button from dashboard
3. **View Statistics**: See total quizzes, categories, and difficulty distribution
4. **Create Quiz**: Click "Create New Quiz" and fill in the form
   - Select or create new category
   - Choose difficulty level
   - Enter question and 4 options
   - Select the correct answer
5. **Edit Quiz**: Click "Edit" on any quiz to modify it
6. **Delete Quiz**: Click "Delete" (confirm by clicking again)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### User Management (Admin)
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:id/role` - Update user role (admin only)

### Quizzes
- `GET /api/quizzes` - Get all quizzes (protected)
- `GET /api/quizzes/filter?category=X&difficulty=Y` - Filter quizzes (protected)
- `GET /api/quizzes/categories` - Get all categories (protected)
- `GET /api/quizzes/difficulties` - Get all difficulties (protected)
- `GET /api/quizzes/:id` - Get single quiz (protected)
- `POST /api/quizzes` - Create quiz (admin only)
- `PUT /api/quizzes/:id` - Update quiz (admin only)
- `DELETE /api/quizzes/:id` - Delete quiz (admin only)

### Results
- `POST /api/results` - Submit quiz result (protected)
- `GET /api/results/my-results` - Get user's results (protected)
- `GET /api/results/leaderboard` - Get leaderboard (protected)
- `GET /api/results/analytics` - Get analytics (protected)
- `GET /api/results/recommendations` - Get quiz recommendations (protected)
- `GET /api/results/all` - Get all results (admin only)
- `GET /api/results/:id` - Get single result (protected)

## Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Protected routes (both frontend and backend)
- ✅ Role-based access control (user/admin)
- ✅ Token expiration (30 days)
- ✅ Secure HTTP headers with CORS

## Database Models

### User Model
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['user', 'admin']),
  createdAt: Date
}
```

### Quiz Model
```javascript
{
  category: String (enum: predefined categories),
  difficulty: String (enum: ['Basic', 'Intermediate', 'Hard']),
  question: String (required),
  options: [String] (4 options required),
  correctAnswer: Number (0-3),
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Result Model
```javascript
{
  user: ObjectId (ref: User),
  category: String,
  difficulty: String,
  score: Number,
  totalQuestions: Number,
  answers: [{
    questionId: ObjectId (ref: Quiz),
    selectedAnswer: Number,
    isCorrect: Boolean
  }],
  completedAt: Date
}
```

## Testing

### Backend Tests
```bash
cd server
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

### Frontend Tests
```bash
cd client
npm test                    # Run all tests
npm run test:ui             # UI mode
npm run test:coverage       # With coverage
```

See [Testing Documentation](docs/TESTING.md) for comprehensive testing guide.

## Default Credentials

After running the seed script:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**User Account:**
- Username: `user`
- Password: `user123`

## Future Enhancements

- [ ] Timer for quizzes
- [ ] Quiz categories with images
- [ ] Export results as PDF
- [ ] Email notifications
- [ ] Social authentication (Google, Facebook)
- [ ] Question bank import/export
- [ ] Multi-language support
- [ ] Mobile application
- [ ] Real-time multiplayer quizzes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Created by suprabha19

## Support

For support, please open an issue in the GitHub repository.
