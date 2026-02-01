import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Quiz from './models/Quiz.js';
import connectDB from './config/db.js';

dotenv.config();

const quizData = [
  // React - Basic
  {
    category: 'React',
    difficulty: 'Basic',
    question: 'What is React?',
    options: ['A JavaScript library for building user interfaces', 'A database', 'A programming language', 'A web server'],
    correctAnswer: 0
  },
  {
    category: 'React',
    difficulty: 'Basic',
    question: 'What is JSX in React?',
    options: ['A styling library', 'A syntax extension for JavaScript', 'A testing framework', 'A database query language'],
    correctAnswer: 1
  },
  {
    category: 'React',
    difficulty: 'Basic',
    question: 'Which method is used to create components in React?',
    options: ['render()', 'componentDidMount()', 'function or class', 'createElement()'],
    correctAnswer: 2
  },
  
  // React - Intermediate
  {
    category: 'React',
    difficulty: 'Intermediate',
    question: 'What is the purpose of useState hook?',
    options: ['To fetch data', 'To manage component state', 'To handle side effects', 'To optimize performance'],
    correctAnswer: 1
  },
  {
    category: 'React',
    difficulty: 'Intermediate',
    question: 'What does useEffect hook do?',
    options: ['Manages state', 'Handles side effects', 'Creates context', 'Memoizes values'],
    correctAnswer: 1
  },
  
  // React - Hard
  {
    category: 'React',
    difficulty: 'Hard',
    question: 'What is the purpose of React.memo()?',
    options: ['To store data in memory', 'To memoize component to prevent unnecessary re-renders', 'To create routes', 'To manage global state'],
    correctAnswer: 1
  },
  
  // MongoDB - Basic
  {
    category: 'MongoDB',
    difficulty: 'Basic',
    question: 'What type of database is MongoDB?',
    options: ['Relational', 'NoSQL', 'Graph', 'In-memory'],
    correctAnswer: 1
  },
  {
    category: 'MongoDB',
    difficulty: 'Basic',
    question: 'What is a collection in MongoDB?',
    options: ['A group of databases', 'A group of documents', 'A group of fields', 'A group of indexes'],
    correctAnswer: 1
  },
  {
    category: 'MongoDB',
    difficulty: 'Basic',
    question: 'What format does MongoDB use to store data?',
    options: ['XML', 'JSON', 'BSON', 'CSV'],
    correctAnswer: 2
  },
  
  // MongoDB - Intermediate
  {
    category: 'MongoDB',
    difficulty: 'Intermediate',
    question: 'Which method is used to insert a document in MongoDB?',
    options: ['add()', 'insert()', 'insertOne()', 'create()'],
    correctAnswer: 2
  },
  {
    category: 'MongoDB',
    difficulty: 'Intermediate',
    question: 'What is the purpose of an index in MongoDB?',
    options: ['To delete data', 'To improve query performance', 'To backup data', 'To encrypt data'],
    correctAnswer: 1
  },
  
  // MongoDB - Hard
  {
    category: 'MongoDB',
    difficulty: 'Hard',
    question: 'What is sharding in MongoDB?',
    options: ['A backup strategy', 'Horizontal scaling by distributing data across multiple servers', 'A query optimization technique', 'A data encryption method'],
    correctAnswer: 1
  },
  
  // Express - Basic
  {
    category: 'Express',
    difficulty: 'Basic',
    question: 'What is Express.js?',
    options: ['A database', 'A web application framework for Node.js', 'A frontend library', 'A CSS framework'],
    correctAnswer: 1
  },
  {
    category: 'Express',
    difficulty: 'Basic',
    question: 'Which method is used to handle GET requests in Express?',
    options: ['app.get()', 'app.request()', 'app.fetch()', 'app.receive()'],
    correctAnswer: 0
  },
  
  // Express - Intermediate
  {
    category: 'Express',
    difficulty: 'Intermediate',
    question: 'What is middleware in Express?',
    options: ['A database connector', 'Functions that execute during request-response cycle', 'A routing mechanism', 'A templating engine'],
    correctAnswer: 1
  },
  {
    category: 'Express',
    difficulty: 'Intermediate',
    question: 'How do you parse JSON in Express?',
    options: ['JSON.parse()', 'express.json()', 'app.parseJSON()', 'bodyParser.json()'],
    correctAnswer: 1
  },
  
  // Express - Hard
  {
    category: 'Express',
    difficulty: 'Hard',
    question: 'What is the purpose of app.use() in Express?',
    options: ['To define routes', 'To mount middleware functions', 'To start the server', 'To configure the database'],
    correctAnswer: 1
  },
  
  // CSS - Basic
  {
    category: 'CSS',
    difficulty: 'Basic',
    question: 'What does CSS stand for?',
    options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
    correctAnswer: 1
  },
  {
    category: 'CSS',
    difficulty: 'Basic',
    question: 'Which property is used to change text color?',
    options: ['font-color', 'text-color', 'color', 'text-style'],
    correctAnswer: 2
  },
  {
    category: 'CSS',
    difficulty: 'Basic',
    question: 'How do you center a block element horizontally?',
    options: ['text-align: center', 'margin: auto', 'align: center', 'center: true'],
    correctAnswer: 1
  },
  
  // CSS - Intermediate
  {
    category: 'CSS',
    difficulty: 'Intermediate',
    question: 'What is Flexbox in CSS?',
    options: ['A color scheme', 'A layout model for arranging items', 'A font style', 'A border property'],
    correctAnswer: 1
  },
  {
    category: 'CSS',
    difficulty: 'Intermediate',
    question: 'What does the z-index property control?',
    options: ['Font size', 'Stacking order of elements', 'Element width', 'Border thickness'],
    correctAnswer: 1
  },
  
  // CSS - Hard
  {
    category: 'CSS',
    difficulty: 'Hard',
    question: 'What is the difference between grid and flexbox?',
    options: ['No difference', 'Grid is 2D, Flexbox is 1D', 'Flexbox is faster', 'Grid is deprecated'],
    correctAnswer: 1
  },
  
  // HTML - Basic
  {
    category: 'HTML',
    difficulty: 'Basic',
    question: 'What does HTML stand for?',
    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
    correctAnswer: 0
  },
  {
    category: 'HTML',
    difficulty: 'Basic',
    question: 'Which tag is used for the largest heading?',
    options: ['<heading>', '<h6>', '<h1>', '<head>'],
    correctAnswer: 2
  },
  {
    category: 'HTML',
    difficulty: 'Basic',
    question: 'Which tag is used to create a hyperlink?',
    options: ['<link>', '<a>', '<href>', '<url>'],
    correctAnswer: 1
  },
  
  // HTML - Intermediate
  {
    category: 'HTML',
    difficulty: 'Intermediate',
    question: 'What is the purpose of the <meta> tag?',
    options: ['To create links', 'To provide metadata about the HTML document', 'To style elements', 'To create forms'],
    correctAnswer: 1
  },
  {
    category: 'HTML',
    difficulty: 'Intermediate',
    question: 'Which attribute specifies an alternate text for an image?',
    options: ['title', 'alt', 'text', 'description'],
    correctAnswer: 1
  },
  
  // HTML - Hard
  {
    category: 'HTML',
    difficulty: 'Hard',
    question: 'What is the difference between <div> and <span>?',
    options: ['No difference', 'div is block-level, span is inline', 'span is block-level, div is inline', 'div is deprecated'],
    correctAnswer: 1
  },
  
  // JavaScript - Basic
  {
    category: 'JavaScript',
    difficulty: 'Basic',
    question: 'Which keyword is used to declare a variable in JavaScript?',
    options: ['var', 'let', 'const', 'All of the above'],
    correctAnswer: 3
  },
  {
    category: 'JavaScript',
    difficulty: 'Basic',
    question: 'What is the correct way to write a JavaScript array?',
    options: ['var colors = "red", "green", "blue"', 'var colors = (1:"red", 2:"green", 3:"blue")', 'var colors = ["red", "green", "blue"]', 'var colors = 1 = ("red"), 2 = ("green"), 3 = ("blue")'],
    correctAnswer: 2
  },
  {
    category: 'JavaScript',
    difficulty: 'Basic',
    question: 'How do you write a comment in JavaScript?',
    options: ['<!-- comment -->', '// comment', '/* comment', '# comment'],
    correctAnswer: 1
  },
  
  // JavaScript - Intermediate
  {
    category: 'JavaScript',
    difficulty: 'Intermediate',
    question: 'What is a closure in JavaScript?',
    options: ['A loop structure', 'A function with access to parent scope', 'A class constructor', 'An error handler'],
    correctAnswer: 1
  },
  {
    category: 'JavaScript',
    difficulty: 'Intermediate',
    question: 'What does the spread operator (...) do?',
    options: ['Multiplies numbers', 'Expands iterables', 'Deletes properties', 'Creates loops'],
    correctAnswer: 1
  },
  
  // JavaScript - Hard
  {
    category: 'JavaScript',
    difficulty: 'Hard',
    question: 'What is event delegation in JavaScript?',
    options: ['Passing events between components', 'Handling events on parent element instead of children', 'Preventing default behavior', 'Creating custom events'],
    correctAnswer: 1
  },
  
  // Node.js - Basic
  {
    category: 'Node.js',
    difficulty: 'Basic',
    question: 'What is Node.js?',
    options: ['A JavaScript framework', 'A JavaScript runtime built on Chrome V8 engine', 'A database', 'A CSS preprocessor'],
    correctAnswer: 1
  },
  {
    category: 'Node.js',
    difficulty: 'Basic',
    question: 'Which command is used to install a package using npm?',
    options: ['npm get', 'npm install', 'npm add', 'npm download'],
    correctAnswer: 1
  },
  
  // Node.js - Intermediate
  {
    category: 'Node.js',
    difficulty: 'Intermediate',
    question: 'What is the purpose of package.json?',
    options: ['To store user data', 'To manage project dependencies and metadata', 'To configure the database', 'To define routes'],
    correctAnswer: 1
  },
  {
    category: 'Node.js',
    difficulty: 'Intermediate',
    question: 'What is the event loop in Node.js?',
    options: ['A type of loop', 'Mechanism that handles asynchronous operations', 'A database connection', 'A routing system'],
    correctAnswer: 1
  },
  
  // Node.js - Hard
  {
    category: 'Node.js',
    difficulty: 'Hard',
    question: 'What is the difference between process.nextTick() and setImmediate()?',
    options: ['No difference', 'nextTick executes before I/O, setImmediate after', 'setImmediate is faster', 'nextTick is deprecated'],
    correctAnswer: 1
  },
  
  // Java - Basic
  {
    category: 'Java',
    difficulty: 'Basic',
    question: 'What is Java?',
    options: ['A scripting language', 'An object-oriented programming language', 'A markup language', 'A database'],
    correctAnswer: 1
  },
  {
    category: 'Java',
    difficulty: 'Basic',
    question: 'Which keyword is used to create a class in Java?',
    options: ['function', 'class', 'struct', 'object'],
    correctAnswer: 1
  },
  {
    category: 'Java',
    difficulty: 'Basic',
    question: 'What is the extension of Java source files?',
    options: ['.js', '.java', '.class', '.jav'],
    correctAnswer: 1
  },
  
  // Java - Intermediate
  {
    category: 'Java',
    difficulty: 'Intermediate',
    question: 'What is inheritance in Java?',
    options: ['A way to hide data', 'A mechanism where one class acquires properties of another', 'A type of loop', 'A data structure'],
    correctAnswer: 1
  },
  {
    category: 'Java',
    difficulty: 'Intermediate',
    question: 'What is polymorphism in Java?',
    options: ['Multiple forms of a single entity', 'A database concept', 'A design pattern', 'A compiler optimization'],
    correctAnswer: 0
  },
  
  // Java - Hard
  {
    category: 'Java',
    difficulty: 'Hard',
    question: 'What is the difference between abstract class and interface in Java?',
    options: ['No difference', 'Abstract class can have implementation, interface cannot (before Java 8)', 'Interface is faster', 'Abstract class is deprecated'],
    correctAnswer: 1
  },
  
  // Python - Basic
  {
    category: 'Python',
    difficulty: 'Basic',
    question: 'What is Python?',
    options: ['A compiled language', 'A high-level interpreted programming language', 'A database', 'A web server'],
    correctAnswer: 1
  },
  {
    category: 'Python',
    difficulty: 'Basic',
    question: 'Which symbol is used for comments in Python?',
    options: ['//', '/* */', '#', '--'],
    correctAnswer: 2
  },
  {
    category: 'Python',
    difficulty: 'Basic',
    question: 'How do you create a list in Python?',
    options: ['list = (1, 2, 3)', 'list = {1, 2, 3}', 'list = [1, 2, 3]', 'list = <1, 2, 3>'],
    correctAnswer: 2
  },
  
  // Python - Intermediate
  {
    category: 'Python',
    difficulty: 'Intermediate',
    question: 'What is a dictionary in Python?',
    options: ['A list of words', 'A key-value pair data structure', 'A type of loop', 'A class definition'],
    correctAnswer: 1
  },
  {
    category: 'Python',
    difficulty: 'Intermediate',
    question: 'What does the "self" keyword represent in Python?',
    options: ['The current function', 'The instance of the class', 'A global variable', 'A module'],
    correctAnswer: 1
  },
  
  // Python - Hard
  {
    category: 'Python',
    difficulty: 'Hard',
    question: 'What is a generator in Python?',
    options: ['A random number creator', 'A function that yields values one at a time', 'A class constructor', 'A type of loop'],
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
    console.log('Categories: React, MongoDB, Express, CSS, HTML, JavaScript, Node.js, Java, Python');
    console.log('Admin credentials - username: admin, password: admin123');
    console.log('User credentials - username: user, password: user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
