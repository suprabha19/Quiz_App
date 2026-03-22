import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { quizAPI, resultAPI } from "../services/api";
import "../styles/Dashboard.css";
import { Medal, Star, Zap, Target, Stars } from "lucide-react";

const Dashboard = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [quizCount, setQuizCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  // Real-time stats
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    userAttempts: 0,
    avgScore: 0,
    badgeCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshIntervalRef = useRef(null);

  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const REFRESH_INTERVAL_MS = 30000;
  const difficulties = ["Basic", "Intermediate", "Hard"];

  const fetchLiveData = useCallback(async () => {
    try {
      const [catRes, recRes, resultRes] = await Promise.all([
        quizAPI.getCategories(),
        resultAPI.getRecommendations(),
        resultAPI.getUserResults(),
      ]);
      setCategories(catRes.data);
      setRecommendations(recRes.data);

      const results = resultRes.data || [];
      const validResults = results.filter((r) => r.totalQuestions > 0);
      const avgScore =
        validResults.length > 0
          ? Math.round(
              validResults.reduce(
                (s, r) => s + (r.score / r.totalQuestions) * 100,
                0,
              ) / validResults.length,
            )
          : 0;

      setStats((prev) => ({
        ...prev,
        userAttempts: results.length,
        avgScore,
        badgeCount: user?.badges?.length || 0,
      }));

      // Recent activity: last 5 results
      const sorted = [...results].sort(
        (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
      );
      setRecentActivity(sorted.slice(0, 5));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [user?.badges?.length]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        await fetchLiveData();
        // Also get total quiz count
        const allQuizzesRes = await quizAPI.getAllQuizzes();
        setStats((prev) => ({
          ...prev,
          totalQuizzes: allQuizzesRes.data.length,
        }));

        if (location.state?.selectedCategory) {
          setSelectedCategory(location.state.selectedCategory);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();

    // Auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(
      fetchLiveData,
      REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(refreshIntervalRef.current);
  }, [fetchLiveData, location.state]);

  useEffect(() => {
    if (selectedCategory && selectedDifficulty) {
      fetchQuizCount();
    }
  }, [selectedCategory, selectedDifficulty]);

  const fetchQuizCount = async () => {
    try {
      const response = await quizAPI.getQuizzesByFilter(
        selectedCategory,
        selectedDifficulty,
      );
      setQuizCount(response.data.length);
    } catch (error) {
      console.error("Error fetching quiz count:", error);
    }
  };

  const handleStartQuiz = () => {
    if (selectedCategory && selectedDifficulty) {
      navigate("/quiz", {
        state: { category: selectedCategory, difficulty: selectedDifficulty },
      });
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="main-content">
        <TopBar
          categories={categories}
          onCategorySelect={(category) => {
            setSelectedCategory(category);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />

        <div className="main-content-body">
          {/* Live Stats Bar */}
          <div className="live-stats-bar">
            <div className="live-stats-header">
              <span className="live-indicator-dot"></span>
              <span className="live-label">Live Stats</span>
              {lastUpdated && (
                <span className="stats-updated">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="live-stats-cards">
              <div className="live-stat-card">
                <span className="lst-icon">📝</span>
                <div>
                  <span className="lst-value">{stats.totalQuizzes}</span>
                  <span className="lst-label">Total Quizzes</span>
                </div>
              </div>
              <div className="live-stat-card">
                <span className="lst-icon">🏆</span>
                <div>
                  <span className="lst-value">{stats.userAttempts}</span>
                  <span className="lst-label">Your Attempts</span>
                </div>
              </div>
              <div className="live-stat-card">
                <span className="lst-icon">🎯</span>
                <div>
                  <span className="lst-value">{stats.avgScore}%</span>
                  <span className="lst-label">Avg Score</span>
                </div>
              </div>
              <div className="live-stat-card">
                <span className="lst-icon">🥇</span>
                <div>
                  <span className="lst-value">{stats.badgeCount}</span>
                  <span className="lst-label">Badges Earned</span>
                </div>
              </div>
              <div className="live-stat-card">
                <span className="lst-icon">📂</span>
                <div>
                  <span className="lst-value">{categories.length}</span>
                  <span className="lst-label">Categories</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-header">
            <h1>Welcome, {user.username}!</h1>
            {isAdmin && (
              <button className="btn-admin" onClick={() => navigate("/admin")}>
                Admin Panel
              </button>
            )}
          </div>

          {/* Quiz Selection Section */}
          <div className="quiz-selection">
            {!selectedCategory ? (
              <div className="welcome-card">
                <div className="welcome-icon">
                  <Medal size={30} />
                </div>
                <h2 className="welcome-title">Welcome to Tech QuizSphere</h2>
                <p className="welcome-subtitle">
                  Select a technology from the sidebar to start your quiz
                  journey. Test your knowledge at basic, intermediate, or
                  advanced levels.
                </p>
                <div className="welcome-features">
                  <div className="feature-box">
                    <Star color="black" size={18} />
                    <h4>Multiple Technologies</h4>
                    <p>
                      HTML, CSS, JavaScript, React, Node.js, Python and more
                    </p>
                  </div>
                  <div className="feature-box">
                    <Zap color="black" size={18} />
                    <h4>Three Difficulty Levels</h4>
                    <p>Basic, Intermediate and Hard challenges</p>
                  </div>
                  <div className="feature-box">
                    <Target color="black" size={18} />
                    <h4>Instant Feedback</h4>
                    <p>Get detailed results and performance analysis</p>
                  </div>
                </div>
                <div className="welcome-footer">
                  <Stars size={14} /> Select any technology to begin your
                  learning adventure!
                </div>
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
                        className={`btn-difficulty ${selectedDifficulty === difficulty ? "active" : ""}`}
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
                        ? `${quizCount} question${quizCount !== 1 ? "s" : ""} available`
                        : "No questions available for this selection"}
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

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <h2>💡 Recommended for You</h2>
              <div className="recommendations-grid">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-card">
                    <div className="rec-category">{rec.category}</div>
                    <div
                      className={`rec-difficulty difficulty-${rec.difficulty.toLowerCase()}`}
                    >
                      {rec.difficulty}
                    </div>
                    <div className="rec-score">Your avg: {rec.avgScore}%</div>
                    <div className="rec-reason">{rec.reason}</div>
                    <button
                      className="btn-start-quiz rec-btn"
                      onClick={() =>
                        navigate("/quiz", {
                          state: {
                            category: rec.category,
                            difficulty: rec.difficulty,
                          },
                        })
                      }
                    >
                      Practice Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Section */}
          {recentActivity.length > 0 && (
            <div className="recent-activity-section">
              <div className="recent-activity-header">
                <h2>🕐 Recent Activity</h2>
                <button
                  className="btn-view-history"
                  onClick={() => navigate("/history")}
                >
                  View Full History →
                </button>
              </div>
              <div className="recent-activity-list">
                {recentActivity.map((result, idx) => {
                  const pct =
                    result.totalQuestions > 0
                      ? Math.round((result.score / result.totalQuestions) * 100)
                      : 0;
                  return (
                    <div key={idx} className="activity-item">
                      <div className="activity-category-icon">📝</div>
                      <div className="activity-details">
                        <span className="activity-cat">{result.category}</span>
                        <span
                          className={`activity-diff difficulty-${result.difficulty.toLowerCase()}`}
                        >
                          {result.difficulty}
                        </span>
                      </div>
                      <div className="activity-score">
                        <span className="score-fraction">
                          {result.score}/{result.totalQuestions}
                        </span>
                        <span
                          className={`score-pct ${pct >= 70 ? "good-score" : "low-score"}`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="activity-time">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
