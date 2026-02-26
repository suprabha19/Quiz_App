import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultAPI, quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import '../styles/Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, catRes] = await Promise.all([
          resultAPI.getLeaderboard(),
          quizAPI.getCategories()
        ]);
        setLeaderboard(lbRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        categories={categories}
        selectedCategory=""
        setSelectedCategory={() => {}}
      />

      <div className="main-content">
        <TopBar 
          categories={categories}
          onCategorySelect={(category) => {
            navigate('/dashboard', { state: { selectedCategory: category } });
          }}
        />
        
        <div className="main-content-body">
          <div className="dashboard-header">
            <h1>🏆 Leaderboard</h1>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Take a Quiz
            </button>
          </div>

        {leaderboard.length === 0 ? (
          <div className="lb-empty">
            <p>🎯 No scores yet. Be the first to top the leaderboard!</p>
            <button className="btn-start-quiz" onClick={() => navigate('/dashboard')}>
              Start Quiz
            </button>
          </div>
        ) : (
          <div className="lb-table-wrapper">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Best Score</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={entry.username}
                    className={`lb-row ${entry.username === user?.username ? 'lb-row-me' : ''} ${index < 3 ? 'lb-row-top' : ''}`}
                  >
                    <td className="lb-rank">
                      {index < 3 ? MEDALS[index] : `#${index + 1}`}
                    </td>
                    <td className="lb-username">
                      {entry.username}
                      {entry.username === user?.username && (
                        <span className="lb-you-badge"> (You)</span>
                      )}
                    </td>
                    <td className="lb-score">
                      <span className="lb-percentage">{entry.bestPercentage}%</span>
                      <span className="lb-fraction"> ({entry.score}/{entry.totalQuestions})</span>
                    </td>
                    <td>{entry.category}</td>
                    <td>
                      <span className={`lb-difficulty lb-${entry.difficulty.toLowerCase()}`}>
                        {entry.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
