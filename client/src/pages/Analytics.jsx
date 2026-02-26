import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultAPI, quizAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import '../styles/Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, catRes] = await Promise.all([
          resultAPI.getAnalytics(),
          quizAPI.getCategories()
        ]);
        setAnalytics(analyticsRes.data);
        setCategories(catRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getScoreClass = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-great';
    if (score >= 50) return 'score-good';
    return 'score-poor';
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
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
            navigate('/dashboard');
          }}
        />
        
        <div className="main-content-body">
          <div className="dashboard-header">
            <h1>📊 My Analytics</h1>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Take a Quiz
            </button>
          </div>

        {analytics.totalQuizzes === 0 ? (
          <div className="analytics-empty">
            <p>📊 No quiz data yet. Complete some quizzes to see your analytics!</p>
            <button className="btn-start-quiz" onClick={() => navigate('/dashboard')}>
              Start a Quiz
            </button>
          </div>
        ) : (
          <>
            <div className="analytics-overview">
              <div className="analytics-stat-card">
                <div className="analytics-stat-number">{analytics.totalQuizzes}</div>
                <div className="analytics-stat-label">Quizzes Taken</div>
              </div>
              <div className="analytics-stat-card">
                <div className={`analytics-stat-number ${getScoreClass(analytics.avgScore)}`}>
                  {analytics.avgScore}%
                </div>
                <div className="analytics-stat-label">Overall Avg Score</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-number">{analytics.byCategory.length}</div>
                <div className="analytics-stat-label">Categories Explored</div>
              </div>
            </div>

            <div className="analytics-section">
              <h2>Performance by Category</h2>
              <p className="analytics-hint">Sorted from weakest to strongest — focus on the top rows!</p>
              <div className="analytics-table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Attempts</th>
                      <th>Avg Score</th>
                      <th>Best Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byCategory.map((row) => (
                      <tr key={row.category}>
                        <td className="analytics-category">{row.category}</td>
                        <td>{row.attempts}</td>
                        <td>
                          <div className="score-bar-wrapper">
                            <div
                              className={`score-bar ${getScoreClass(row.avgScore)}`}
                              style={{ width: `${row.avgScore}%` }}
                            />
                            <span className="score-bar-label">{row.avgScore}%</span>
                          </div>
                        </td>
                        <td className={getScoreClass(row.bestScore)}>{row.bestScore}%</td>
                        <td>
                          {row.avgScore >= 70 ? (
                            <span className="status-badge status-strong">✓ Strong</span>
                          ) : row.avgScore >= 40 ? (
                            <span className="status-badge status-improving">↑ Improving</span>
                          ) : (
                            <span className="status-badge status-weak">⚠ Needs Work</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {analytics.byDifficulty.length > 0 && (
              <div className="analytics-section">
                <h2>Performance by Difficulty</h2>
                <div className="diff-cards">
                  {analytics.byDifficulty.map((row) => (
                    <div key={row.difficulty} className={`diff-card diff-${row.difficulty.toLowerCase()}`}>
                      <div className="diff-name">{row.difficulty}</div>
                      <div className="diff-score">{row.avgScore}%</div>
                      <div className="diff-attempts">{row.attempts} attempt{row.attempts !== 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
