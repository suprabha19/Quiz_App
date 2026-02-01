import express from 'express';
import {
  submitResult,
  getUserResults,
  getAllResults,
  getResultById
} from '../controllers/resultController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, submitResult);
router.get('/my-results', protect, getUserResults);
router.get('/all', protect, admin, getAllResults);
router.get('/:id', protect, getResultById);

export default router;
