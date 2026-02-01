import express from 'express';
import {
  getAllQuizzes,
  getQuizzesByCategoryAndDifficulty,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getCategories,
  getDifficulties
} from '../controllers/quizController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllQuizzes);
router.get('/filter', protect, getQuizzesByCategoryAndDifficulty);
router.get('/categories', protect, getCategories);
router.get('/difficulties', protect, getDifficulties);
router.get('/:id', protect, getQuizById);
router.post('/', protect, admin, createQuiz);
router.put('/:id', protect, admin, updateQuiz);
router.delete('/:id', protect, admin, deleteQuiz);

export default router;
