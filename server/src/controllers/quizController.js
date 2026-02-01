import Quiz from '../models/Quiz.js';

// Get all quizzes
export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({});
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quizzes by category and difficulty
export const getQuizzesByCategoryAndDifficulty = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    const quizzes = await Quiz.find(query);
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new quiz (Admin only)
export const createQuiz = async (req, res) => {
  try {
    const { category, difficulty, question, options, correctAnswer } = req.body;

    const quiz = await Quiz.create({
      category,
      difficulty,
      question,
      options,
      correctAnswer,
      createdBy: req.user._id
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quiz (Admin only)
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (quiz) {
      quiz.category = req.body.category || quiz.category;
      quiz.difficulty = req.body.difficulty || quiz.difficulty;
      quiz.question = req.body.question || quiz.question;
      quiz.options = req.body.options || quiz.options;
      quiz.correctAnswer = req.body.correctAnswer !== undefined ? req.body.correctAnswer : quiz.correctAnswer;

      const updatedQuiz = await quiz.save();
      res.json(updatedQuiz);
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete quiz (Admin only)
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (quiz) {
      await quiz.deleteOne();
      res.json({ message: 'Quiz removed' });
    } else {
      res.status(404).json({ message: 'Quiz not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Quiz.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get difficulties
export const getDifficulties = async (req, res) => {
  try {
    const difficulties = await Quiz.distinct('difficulty');
    res.json(difficulties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
