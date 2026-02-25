import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizAPI, resultAPI } from '../services/api';
import '../styles/Quiz.css';

const QUESTION_TIME = 30;

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { category, difficulty } = location.state || {};

  useEffect(() => {
    if (!category || !difficulty) {
      navigate('/dashboard');
      return;
    }
    fetchQuestions();
  }, [category, difficulty]);

  // Start/reset timer when question changes (and questions are loaded)
  useEffect(() => {
    if (loading || showFeedback) return;
    setTimeLeft(QUESTION_TIME);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setShowFeedback(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQuestionIndex, loading]);

  // Stop timer once feedback is shown
  useEffect(() => {
    if (showFeedback) {
      clearInterval(timerRef.current);
    }
  }, [showFeedback]);

  const fetchQuestions = async () => {
    try {
      const response = await quizAPI.getQuizzesByFilter(category, difficulty);
      if (response.data.length === 0) {
        setError('No questions available for this quiz');
        setLoading(false);
        return;
      }
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load quiz questions');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return; // Prevent changing answer after feedback is shown
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];

    // If no answer selected (e.g. time ran out), treat as incorrect
    const answeredIndex = selectedAnswer;
    const isCorrect = answeredIndex !== null && answeredIndex === currentQuestion.correctAnswer;

    const updatedAnswers = [...answers, {
      questionId: currentQuestion._id,
      selectedAnswer: answeredIndex,
      isCorrect
    }];

    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      submitQuiz(updatedAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    const score = finalAnswers.filter(a => a.isCorrect).length;

    try {
      const resultData = {
        category,
        difficulty,
        score,
        totalQuestions: questions.length,
        answers: finalAnswers
      };

      await resultAPI.submitResult(resultData);
      
      navigate('/results', { 
        state: { 
          score, 
          totalQuestions: questions.length,
          category,
          difficulty
        } 
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-header-top">
          <h2>{category} - {difficulty}</h2>
          <div className={`quiz-timer ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
            ⏱ {timeLeft}s
          </div>
        </div>
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
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
          <button 
            className="btn-primary"
            onClick={handleNext}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
