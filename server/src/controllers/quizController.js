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
    const { questions } = req.body;

    // Handle both single question and multiple questions format
    let quizzesToCreate;
    
    if (Array.isArray(questions)) {
      // Multiple questions format
      if (questions.length === 0) {
        return res.status(400).json({ message: 'At least one question is required' });
      }

      // Validate each question has required fields
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.category || !q.difficulty || !q.question || !q.options || q.correctAnswer === undefined) {
          return res.status(400).json({ 
            message: `Question ${i + 1} is missing required fields` 
          });
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          return res.status(400).json({ 
            message: `Question ${i + 1} must have exactly 4 options` 
          });
        }
        if (q.correctAnswer < 0 || q.correctAnswer > 3) {
          return res.status(400).json({ 
            message: `Question ${i + 1} has invalid correct answer index` 
          });
        }
      }

      quizzesToCreate = questions.map(q => ({
        category: q.category,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        createdBy: req.user._id
      }));
    } else {
      // Single question format (backward compatibility)
      const { category, difficulty, question, options, correctAnswer } = req.body;
      quizzesToCreate = [{
        category,
        difficulty,
        question,
        options,
        correctAnswer,
        createdBy: req.user._id
      }];
    }

    const createdQuizzes = await Quiz.insertMany(quizzesToCreate);

    res.status(201).json(createdQuizzes);
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
