import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { quizAPI, resultAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [quizCount, setQuizCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const difficulties = ['Basic', 'Intermediate', 'Hard'];

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [catRes, recRes] = await Promise.all([
          quizAPI.getCategories(),
          resultAPI.getRecommendations()
        ]);
        setCategories(catRes.data);
        setRecommendations(recRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedDifficulty) {
      fetchQuizCount();
    }
  }, [selectedCategory, selectedDifficulty]);

  const fetchQuizCount = async () => {
    try {
      const response = await quizAPI.getQuizzesByFilter(selectedCategory, selectedDifficulty);
      setQuizCount(response.data.length);
    } catch (error) {
      console.error('Error fetching quiz count:', error);
    }
  };

  const handleStartQuiz = () => {
    if (selectedCategory && selectedDifficulty) {
      navigate('/quiz', {
        state: {
          category: selectedCategory,
          difficulty: selectedDifficulty
        }
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.username}!</h1>
          {isAdmin && (
            <button
              className="btn-admin"
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </button>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>💡 Recommended for You</h2>
            <div className="recommendations-grid">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="rec-card">
                  <div className="rec-category">{rec.category}</div>
                  <div className={`rec-difficulty difficulty-${rec.difficulty.toLowerCase()}`}>{rec.difficulty}</div>
                  <div className="rec-score">Your avg: {rec.avgScore}%</div>
                  <div className="rec-reason">{rec.reason}</div>
                  <button
                    className="btn-start-quiz rec-btn"
                    onClick={() => navigate('/quiz', { state: { category: rec.category, difficulty: rec.difficulty } })}
                  >
                    Practice Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quiz-selection">
          <h2>Select Your Quiz</h2>

          {!selectedCategory ? (
            <div className="instruction">
              <p>👈 Please select a category from the sidebar</p>
            </div>
          ) : (
            <>
              <div className="selected-category">
                <h3>Category: {selectedCategory}</h3>
              </div>

              <div className="difficulty-selection">
                <h3>Select Difficulty Level:</h3>
                <div className="difficulty-buttons">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      className={`btn-difficulty ${selectedDifficulty === difficulty ? 'active' : ''}`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDifficulty && (
                <div className="quiz-info">
                  <p className="quiz-count">
                    {quizCount > 0
                      ? `${quizCount} question${quizCount !== 1 ? 's' : ''} available`
                      : 'No questions available for this selection'}
                  </p>
                  {quizCount > 0 && (
                    <button
                      className="btn-start-quiz"
                      onClick={handleStartQuiz}
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

