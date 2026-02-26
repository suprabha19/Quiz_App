import Result from '../models/Result.js';
import User from '../models/User.js';

// Badge definitions
const BADGE_CONDITIONS = {
  first_quiz: (results) => results.length >= 1,
  perfect_score: (results) => results.some(r => r.score === r.totalQuestions),
  top_scorer: (results) => results.some(r => (r.score / r.totalQuestions) >= 0.9),
  quiz_veteran: (results) => results.length >= 10,
  knowledge_seeker: (results) => new Set(results.map(r => r.category)).size >= 3
};

const computeNewBadges = (existingBadges, results) => {
  const newBadges = [];
  for (const [badge, condition] of Object.entries(BADGE_CONDITIONS)) {
    if (!existingBadges.includes(badge) && condition(results)) {
      newBadges.push(badge);
    }
  }
  return newBadges;
};

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

    // Award badges
    const allResults = await Result.find({ user: req.user._id });
    const user = await User.findById(req.user._id);
    const newBadges = computeNewBadges(user.badges, allResults);
    if (newBadges.length > 0) {
      user.badges.push(...newBadges);
      await user.save();
    }

    res.status(201).json({ ...result.toObject(), newBadges });
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

// Get leaderboard (top 10 users by best percentage score)
export const getLeaderboard = async (req, res) => {
  try {
    const results = await Result.find({}).populate('user', 'username');

    // Aggregate best score per user
    const userBestMap = {};
    for (const result of results) {
      if (!result.user) continue;
      const uid = result.user._id.toString();
      const percentage = (result.score / result.totalQuestions) * 100;
      if (!userBestMap[uid] || percentage > userBestMap[uid].bestPercentage) {
        userBestMap[uid] = {
          username: result.user.username,
          bestPercentage: Math.round(percentage),
          category: result.category,
          difficulty: result.difficulty,
          score: result.score,
          totalQuestions: result.totalQuestions
        };
      }
    }

    const leaderboard = Object.values(userBestMap)
      .sort((a, b) => b.bestPercentage - a.bestPercentage)
      .slice(0, 10);

    res.json(leaderboard);
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


// Get analytics for logged-in user
export const getAnalytics = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id });

    if (results.length === 0) {
      return res.json({ totalQuizzes: 0, avgScore: 0, byCategory: [], byDifficulty: [] });
    }

    const totalQuizzes = results.length;
    const avgScore = Math.round(
      results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length
    );

    const catMap = {};
    results.forEach(r => {
      if (!catMap[r.category]) catMap[r.category] = { attempts: 0, totalPct: 0, bestScore: 0 };
      const pct = (r.score / r.totalQuestions) * 100;
      catMap[r.category].attempts++;
      catMap[r.category].totalPct += pct;
      catMap[r.category].bestScore = Math.max(catMap[r.category].bestScore, pct);
    });
    const byCategory = Object.entries(catMap).map(([category, data]) => ({
      category,
      attempts: data.attempts,
      avgScore: Math.round(data.totalPct / data.attempts),
      bestScore: Math.round(data.bestScore)
    })).sort((a, b) => a.avgScore - b.avgScore);

    const diffMap = {};
    results.forEach(r => {
      if (!diffMap[r.difficulty]) diffMap[r.difficulty] = { attempts: 0, totalPct: 0 };
      diffMap[r.difficulty].attempts++;
      diffMap[r.difficulty].totalPct += (r.score / r.totalQuestions) * 100;
    });
    const byDifficulty = Object.entries(diffMap).map(([difficulty, data]) => ({
      difficulty,
      attempts: data.attempts,
      avgScore: Math.round(data.totalPct / data.attempts)
    }));

    res.json({ totalQuizzes, avgScore, byCategory, byDifficulty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quiz recommendations for logged-in user
export const getRecommendations = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id });

    if (results.length === 0) {
      return res.json([]);
    }

    const catMap = {};
    results.forEach(r => {
      if (!catMap[r.category]) catMap[r.category] = { total: 0, count: 0 };
      catMap[r.category].total += (r.score / r.totalQuestions) * 100;
      catMap[r.category].count++;
    });

    const recommendations = [];
    for (const [category, data] of Object.entries(catMap)) {
      const avg = data.total / data.count;
      if (avg < 70) {
        const difficulty = avg < 40 ? 'Basic' : 'Intermediate';
        recommendations.push({
          category,
          difficulty,
          avgScore: Math.round(avg),
          reason: avg < 40 ? 'Needs significant practice' : 'Good progress, keep improving'
        });
      }
    }

    recommendations.sort((a, b) => a.avgScore - b.avgScore);
    res.json(recommendations.slice(0, 3));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
