import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Certificate from '../components/Certificate';
import '../styles/Results.css';

const BADGE_INFO = {
  first_quiz:       { icon: '🎯', label: 'First Quiz',       desc: 'Completed your first quiz' },
  perfect_score:    { icon: '💯', label: 'Perfect Score',    desc: 'Got 100% on a quiz' },
  top_scorer:       { icon: '⭐', label: 'Star Performer',   desc: 'Scored 90%+ on a quiz' },
  quiz_veteran:     { icon: '🏆', label: 'Quiz Veteran',     desc: 'Completed 10 quizzes' },
  knowledge_seeker: { icon: '🌟', label: 'Knowledge Seeker', desc: 'Explored 3+ categories' }
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { score, totalQuestions, category, difficulty, newBadges = [], reviewAnswers = [] } = location.state || {};
  const [showReview, setShowReview] = useState(false);

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
  const isPassing = percentage >= 50;

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

        {newBadges.length > 0 && (
          <div className="new-badges-section">
            <h3>🎉 Achievement{newBadges.length > 1 ? 's' : ''} Unlocked!</h3>
            <div className="badges-grid">
              {newBadges.map(badge => (
                <div key={badge} className="badge-card">
                  <span className="badge-icon">{BADGE_INFO[badge]?.icon}</span>
                  <span className="badge-name">{BADGE_INFO[badge]?.label}</span>
                  <span className="badge-desc">{BADGE_INFO[badge]?.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviewAnswers.length > 0 && (
          <div className="review-toggle">
            <button
              className="btn-secondary"
              onClick={() => setShowReview(v => !v)}
            >
              {showReview ? '▲ Hide Review' : '▼ Review Answers'}
            </button>
          </div>
        )}

        {showReview && (
          <div className="review-section">
            {reviewAnswers.map((ans, idx) => (
              <div key={idx} className={`review-item ${ans.isCorrect ? 'review-correct' : 'review-incorrect'}`}>
                <div className="review-q">
                  <span className="review-num">Q{idx + 1}</span>
                  <span>{ans.questionText}</span>
                  {ans.difficulty && (
                    <span className={`adaptive-badge adaptive-${ans.difficulty.toLowerCase()}`} style={{ marginLeft: 8 }}>
                      {ans.difficulty}
                    </span>
                  )}
                </div>
                <div className="review-options">
                  {ans.options && ans.options.map((opt, oidx) => {
                    const isCorrectOpt = oidx === ans.correctAnswer;
                    const isWrongSelected = oidx === ans.selectedAnswer && !ans.isCorrect;
                    return (
                      <div
                        key={oidx}
                        className={`review-option ${isCorrectOpt ? 'review-opt-correct' : ''} ${isWrongSelected ? 'review-opt-wrong' : ''}`}
                      >
                        <span className="review-opt-letter">{String.fromCharCode(65 + oidx)}</span>
                        {opt}
                        {isCorrectOpt && <span className="review-opt-icon"> ✓</span>}
                        {isWrongSelected && <span className="review-opt-icon"> ✗</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="results-actions">
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Take Another Quiz
          </button>
        </div>
      </div>

      {isPassing && (
        <Certificate
          username={user?.username || 'User'}
          category={category}
          difficulty={difficulty}
          score={score}
          totalQuestions={totalQuestions}
          date={new Date().toISOString()}
        />
      )}
    </div>
  );
};

export default Results;

