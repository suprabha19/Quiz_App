import Result from '../models/Result.js';

// Submit quiz result
export const submitResult = async (req, res) => {
  try {
    const { category, difficulty, score, totalQuestions, answers } = req.body;

    const result = await Result.create({
      user: req.user._id,
      category,
      difficulty,
      score,
      totalQuestions,
      answers
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user results
export const getUserResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id })
      .populate('answers.questionId')
      .sort({ completedAt: -1 });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all results (Admin only)
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find({})
      .populate('user', 'username')
      .populate('answers.questionId')
      .sort({ completedAt: -1 });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get result by ID
export const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('user', 'username')
      .populate('answers.questionId');
    
    if (result) {
      // Check if user is authorized to view this result
      if (result.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view this result' });
      }
      res.json(result);
    } else {
      res.status(404).json({ message: 'Result not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
