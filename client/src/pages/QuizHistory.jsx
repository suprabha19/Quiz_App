import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { quizAPI } from '../services/api';
import '../styles/QuizHistory.css';

const QuizHistory = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, categoriesRes] = await Promise.all([
          resultAPI.getUserResults(),
          quizAPI.getCategories()
        ]);
        setResults(resultsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPerformanceClass = (percentage) => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'great';
    if (percentage >= 50) return 'good';
    return 'needs-improvement';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        categories={categories}
        selectedCategory=""
        setSelectedCategory={() => {}}
      />

      <div className="main-content">
        <div className="dashboard-header">
          <h1>My Quiz History</h1>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Take a Quiz
          </button>
        </div>

        {results.length === 0 ? (
          <div className="history-empty">
            <p>🎯 No quiz attempts yet. Start your first quiz!</p>
            <button className="btn-start-quiz" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="history-list">
            {results.map((result) => {
              const percentage = Math.round((result.score / result.totalQuestions) * 100);
              const perfClass = getPerformanceClass(percentage);
              return (
                <div key={result._id} className={`history-card ${perfClass}`}>
                  <div className="history-card-left">
                    <div className="history-category">{result.category}</div>
                    <div className="history-difficulty">{result.difficulty}</div>
                    <div className="history-date">{formatDate(result.completedAt)}</div>
                  </div>
                  <div className="history-card-right">
                    <div className="history-score-circle">
                      <span className="history-percentage">{percentage}%</span>
                      <span className="history-fraction">{result.score}/{result.totalQuestions}</span>
                    </div>
                    <div className={`history-badge ${perfClass}`}>
                      {percentage >= 90 ? '🎉 Excellent' :
                       percentage >= 70 ? '👏 Great' :
                       percentage >= 50 ? '👍 Good' : '💪 Keep Going'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistory;
