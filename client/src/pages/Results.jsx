import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Results.css';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, totalQuestions, category, difficulty } = location.state || {};

  if (!score && score !== 0) {
    navigate('/dashboard');
    return null;
  }

  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: 'Excellent!', emoji: '🎉', class: 'excellent' };
    if (percentage >= 70) return { text: 'Great Job!', emoji: '👏', class: 'great' };
    if (percentage >= 50) return { text: 'Good Effort!', emoji: '👍', class: 'good' };
    return { text: 'Keep Practicing!', emoji: '💪', class: 'needs-improvement' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="results-container">
      <div className="results-card">
        <div className={`performance-badge ${performance.class}`}>
          <span className="performance-emoji">{performance.emoji}</span>
          <h2>{performance.text}</h2>
        </div>

        <div className="score-display">
          <div className="score-circle">
            <div className="score-number">{percentage}%</div>
            <div className="score-details">{score} / {totalQuestions}</div>
          </div>
        </div>

        <div className="quiz-details">
          <p><strong>Category:</strong> {category}</p>
          <p><strong>Difficulty:</strong> {difficulty}</p>
          <p><strong>Correct Answers:</strong> {score}</p>
          <p><strong>Total Questions:</strong> {totalQuestions}</p>
        </div>

        <div className="results-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
