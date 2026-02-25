import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizAPI, resultAPI } from '../services/api';
import '../styles/Quiz.css';

const QUESTION_TIME = 30;
const DIFF_ORDER = ['Basic', 'Intermediate', 'Hard'];
const MAX_QUESTIONS = 10;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState('');
  const [currentDiffIndex, setCurrentDiffIndex] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  const questionPools = useRef({ Basic: [], Intermediate: [], Hard: [] });
  const timerRef = useRef(null);
  const answersRef = useRef([]);
  const showFeedbackRef = useRef(false);
  const submittedRef = useRef(false);
  const totalQuestionsRef = useRef(0);
  const categoryRef = useRef('');
  const difficultyRef = useRef('');

  const location = useLocation();
  const navigate = useNavigate();
  const { category, difficulty } = location.state || {};

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { showFeedbackRef.current = showFeedback; }, [showFeedback]);

  useEffect(() => {
    if (!category || !difficulty) {
      navigate('/dashboard');
      return;
    }
    categoryRef.current = category;
    difficultyRef.current = difficulty;
    fetchQuestions();
  }, []);

  // Anti-cheat: tab-switch / window hide detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showFeedbackRef.current && !submittedRef.current) {
        setViolations(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            forceSubmit();
          } else {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 4000);
          }
          return newCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const forceSubmit = () => {
    if (submittedRef.current) return;
    submitQuiz(answersRef.current);
  };

  // Timer: reset whenever currentQuestion changes
  useEffect(() => {
    if (loading || showFeedback || !currentQuestion) return;
    setTimeLeft(QUESTION_TIME);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setShowFeedback(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQuestion, loading]);

  useEffect(() => {
    if (showFeedback) clearInterval(timerRef.current);
  }, [showFeedback]);

  const getNextQuestion = (diffIdx) => {
    const order = [diffIdx, diffIdx + 1, diffIdx - 1, 2, 1, 0].filter(
      (v, i, a) => v >= 0 && v <= 2 && a.indexOf(v) === i
    );
    for (const idx of order) {
      const pool = questionPools.current[DIFF_ORDER[idx]];
      if (pool.length > 0) {
        return { question: pool.shift(), diffIdx: idx };
      }
    }
    return null;
  };

  const fetchQuestions = async () => {
    try {
      // Fetch ALL difficulties for the category (adaptive mode)
      const response = await quizAPI.getQuizzesByFilter(category, undefined);
      if (response.data.length === 0) {
        setError('No questions available for this category');
        setLoading(false);
        return;
      }

      const pools = { Basic: [], Intermediate: [], Hard: [] };
      response.data.forEach(q => {
        if (pools[q.difficulty]) pools[q.difficulty].push(q);
      });
      Object.keys(pools).forEach(d => { pools[d] = shuffle(pools[d]); });
      questionPools.current = pools;

      const startDiffIdx = Math.max(0, DIFF_ORDER.indexOf(difficulty));
      const total = Math.min(MAX_QUESTIONS, response.data.length);
      setTotalQuestions(total);
      totalQuestionsRef.current = total;

      const first = getNextQuestion(startDiffIdx);
      if (!first) {
        setError('No questions available for this category');
        setLoading(false);
        return;
      }

      setCurrentDiffIndex(first.diffIdx);
      setAdaptiveDifficulty(DIFF_ORDER[first.diffIdx]);
      setCurrentQuestion(first.question);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load quiz questions');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
  };

  const handleNext = () => {
    const isCorrect = selectedAnswer !== null && selectedAnswer === currentQuestion.correctAnswer;

    let newCorrect = isCorrect ? correctStreak + 1 : 0;
    let newIncorrect = !isCorrect ? incorrectStreak + 1 : 0;

    let newDiffIdx = currentDiffIndex;
    if (newCorrect >= 3 && currentDiffIndex < 2) {
      newDiffIdx = currentDiffIndex + 1;
      newCorrect = 0;
    } else if (newIncorrect >= 2 && currentDiffIndex > 0) {
      newDiffIdx = currentDiffIndex - 1;
      newIncorrect = 0;
    }

    setCorrectStreak(newCorrect);
    setIncorrectStreak(newIncorrect);

    const updatedAnswers = [...answers, {
      questionId: currentQuestion._id,
      questionText: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      selectedAnswer,
      isCorrect,
      difficulty: adaptiveDifficulty
    }];
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers;

    const nextQNum = questionNumber + 1;
    if (nextQNum >= totalQuestionsRef.current) {
      submitQuiz(updatedAnswers);
      return;
    }

    const next = getNextQuestion(newDiffIdx);
    if (!next) {
      submitQuiz(updatedAnswers);
      return;
    }

    setCurrentDiffIndex(next.diffIdx);
    setAdaptiveDifficulty(DIFF_ORDER[next.diffIdx]);
    setCurrentQuestion(next.question);
    setQuestionNumber(nextQNum);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const submitQuiz = async (finalAnswers) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const score = finalAnswers.filter(a => a.isCorrect).length;
    const submitAnswers = finalAnswers.map(({ questionId, selectedAnswer, isCorrect }) => ({
      questionId, selectedAnswer, isCorrect
    }));

    try {
      const resultRes = await resultAPI.submitResult({
        category: categoryRef.current,
        difficulty: difficultyRef.current,
        score,
        totalQuestions: finalAnswers.length,
        answers: submitAnswers
      });

      navigate('/results', {
        state: {
          score,
          totalQuestions: finalAnswers.length,
          category: categoryRef.current,
          difficulty: difficultyRef.current,
          newBadges: resultRes.data.newBadges || [],
          reviewAnswers: finalAnswers
        }
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      submittedRef.current = false;
      alert('Failed to submit quiz results');
    }
  };

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>{error}</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const progress = ((questionNumber + 1) / totalQuestions) * 100;

  return (
    <div className="quiz-container">
      {showWarning && (
        <div className="anticheat-warning">
          ⚠️ Warning: Switching tabs is not allowed! One more violation will auto-submit your quiz.
        </div>
      )}

      <div className="quiz-header">
        <div className="quiz-header-top">
          <div className="quiz-title-group">
            <h2>{category}</h2>
            <span className={`adaptive-badge adaptive-${adaptiveDifficulty.toLowerCase()}`}>
              {adaptiveDifficulty}
            </span>
          </div>
          <div className={`quiz-timer ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
            ⏱ {timeLeft}s
          </div>
        </div>
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Question {questionNumber + 1} of {totalQuestions}</p>
        </div>
      </div>

      <div className="question-card">
        <h3 className="question-text">{currentQuestion.question}</h3>

        <div className="options-list">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showCorrect = showFeedback && isCorrect;
            const showIncorrect = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={index}
                className={`option-button ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showIncorrect ? 'incorrect' : ''}`}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {showCorrect && <span className="feedback-icon">✓</span>}
                {showIncorrect && <span className="feedback-icon">✗</span>}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`feedback-message ${selectedAnswer === currentQuestion.correctAnswer ? 'correct-feedback' : 'incorrect-feedback'}`}>
            {selectedAnswer === null
              ? `⏱ Time's up! The correct answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`
              : selectedAnswer === currentQuestion.correctAnswer
                ? '✓ Correct! Well done!'
                : `✗ Incorrect. The correct answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`}
          </div>
        )}

        <div className="quiz-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
          {showFeedback && (
            <button
              className="btn-primary"
              onClick={handleNext}
            >
              {questionNumber + 1 < totalQuestions ? 'Next Question' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;

