import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizAPI, resultAPI } from '../services/api';
import '../styles/Quiz.css';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    setAnswers([...answers, {
      questionId: currentQuestion._id,
      selectedAnswer,
      isCorrect
    }]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    const finalAnswers = [...answers, {
      questionId: questions[currentQuestionIndex]._id,
      selectedAnswer,
      isCorrect: selectedAnswer === questions[currentQuestionIndex].correctAnswer
    }];

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
        <h2>{category} - {difficulty}</h2>
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
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${selectedAnswer === index ? 'selected' : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

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
