import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Quiz from './models/Quiz.js';
import connectDB from './config/db.js';

dotenv.config();

const quizData = [
  // General Knowledge - Basic
  {
    category: 'General Knowledge',
    difficulty: 'Basic',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2
  },
  {
    category: 'General Knowledge',
    difficulty: 'Basic',
    question: 'How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2
  },
  {
    category: 'General Knowledge',
    difficulty: 'Basic',
    question: 'What color is the sky on a clear day?',
    options: ['Green', 'Blue', 'Red', 'Yellow'],
    correctAnswer: 1
  },
  
  // General Knowledge - Intermediate
  {
    category: 'General Knowledge',
    difficulty: 'Intermediate',
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1
  },
  {
    category: 'General Knowledge',
    difficulty: 'Intermediate',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: 2
  },
  
  // General Knowledge - Hard
  {
    category: 'General Knowledge',
    difficulty: 'Hard',
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correctAnswer: 1
  },
  
  // Science - Basic
  {
    category: 'Science',
    difficulty: 'Basic',
    question: 'What do plants need to make food?',
    options: ['Sunlight', 'Water', 'Carbon dioxide', 'All of the above'],
    correctAnswer: 3
  },
  {
    category: 'Science',
    difficulty: 'Basic',
    question: 'How many bones are in the adult human body?',
    options: ['186', '206', '226', '246'],
    correctAnswer: 1
  },
  
  // Science - Intermediate
  {
    category: 'Science',
    difficulty: 'Intermediate',
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2
  },
  {
    category: 'Science',
    difficulty: 'Intermediate',
    question: 'What is the speed of light?',
    options: ['299,792 km/s', '199,792 km/s', '399,792 km/s', '99,792 km/s'],
    correctAnswer: 0
  },
  
  // Science - Hard
  {
    category: 'Science',
    difficulty: 'Hard',
    question: 'What is the Heisenberg Uncertainty Principle?',
    options: [
      'Energy cannot be created or destroyed',
      'Cannot simultaneously know position and momentum precisely',
      'Every action has an equal and opposite reaction',
      'Matter cannot be created or destroyed'
    ],
    correctAnswer: 1
  },
  
  // History - Basic
  {
    category: 'History',
    difficulty: 'Basic',
    question: 'Who was the first President of the United States?',
    options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
    correctAnswer: 1
  },
  {
    category: 'History',
    difficulty: 'Basic',
    question: 'In which country did the Renaissance begin?',
    options: ['France', 'England', 'Italy', 'Spain'],
    correctAnswer: 2
  },
  
  // History - Intermediate
  {
    category: 'History',
    difficulty: 'Intermediate',
    question: 'When did the Berlin Wall fall?',
    options: ['1987', '1988', '1989', '1990'],
    correctAnswer: 2
  },
  {
    category: 'History',
    difficulty: 'Intermediate',
    question: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
    correctAnswer: 1
  },
  
  // History - Hard
  {
    category: 'History',
    difficulty: 'Hard',
    question: 'What year was the Magna Carta signed?',
    options: ['1205', '1215', '1225', '1235'],
    correctAnswer: 1
  },
  
  // Sports - Basic
  {
    category: 'Sports',
    difficulty: 'Basic',
    question: 'How many players are on a soccer team?',
    options: ['9', '10', '11', '12'],
    correctAnswer: 2
  },
  {
    category: 'Sports',
    difficulty: 'Basic',
    question: 'What sport is played at Wimbledon?',
    options: ['Golf', 'Tennis', 'Cricket', 'Badminton'],
    correctAnswer: 1
  },
  
  // Sports - Intermediate
  {
    category: 'Sports',
    difficulty: 'Intermediate',
    question: 'How many Olympic rings are there?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1
  },
  {
    category: 'Sports',
    difficulty: 'Intermediate',
    question: 'Which country won the FIFA World Cup in 2018?',
    options: ['Brazil', 'Germany', 'France', 'Argentina'],
    correctAnswer: 2
  },
  
  // Sports - Hard
  {
    category: 'Sports',
    difficulty: 'Hard',
    question: 'Who holds the record for most Grand Slam tennis titles (as of 2024)?',
    options: ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Pete Sampras'],
    correctAnswer: 2
  },
  
  // Technology - Basic
  {
    category: 'Technology',
    difficulty: 'Basic',
    question: 'What does CPU stand for?',
    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Unit'],
    correctAnswer: 0
  },
  {
    category: 'Technology',
    difficulty: 'Basic',
    question: 'What does WWW stand for?',
    options: ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'],
    correctAnswer: 0
  },
  
  // Technology - Intermediate
  {
    category: 'Technology',
    difficulty: 'Intermediate',
    question: 'What programming language is primarily used for web development?',
    options: ['Python', 'Java', 'JavaScript', 'C++'],
    correctAnswer: 2
  },
  {
    category: 'Technology',
    difficulty: 'Intermediate',
    question: 'What does HTML stand for?',
    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
    correctAnswer: 0
  },
  
  // Technology - Hard
  {
    category: 'Technology',
    difficulty: 'Hard',
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
    correctAnswer: 1
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Quiz.deleteMany({});

    console.log('Data cleared!');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created!');

    // Create sample regular user
    await User.create({
      username: 'user',
      password: 'user123',
      role: 'user'
    });

    console.log('Sample user created!');

    // Insert quiz data
    await Quiz.insertMany(quizData.map(quiz => ({
      ...quiz,
      createdBy: adminUser._id
    })));

    console.log('Quiz data seeded!');

    console.log('Database seeded successfully!');
    console.log('Admin credentials - username: admin, password: admin123');
    console.log('User credentials - username: user, password: user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
