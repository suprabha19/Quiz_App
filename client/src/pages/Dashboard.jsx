import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { quizAPI, resultAPI } from "../services/api";
import "../styles/Dashboard.css";
import {
  RefreshCw, Play, Trophy, Target, Star, Clock,
  ChevronRight, Award, BarChart2, BookOpen, TrendingUp, Medal,
} from "lucide-react";

/* ── helpers ── */
const CATEGORY_EMOJI = {
  HTML: "🌐", CSS: "🎨", JavaScript: "⚡", React: "⚛️",
  "Node.js": "🟢", Nodejs: "🟢", MongoDB: "🍃", Java: "☕", Python: "🐍",
};

const DIFFICULTIES = [
  { label: "Basic", emoji: "🌱", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  { label: "Intermediate", emoji: "⚡", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  { label: "Hard",         emoji: "🔥", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
];

const getScoreColor = (pct) =>
  pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";

const getTimeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m || 1}m ago`;
};

/* ── SVG progress ring ── */
const ProgressRing = ({ percentage, size = 100, strokeWidth = 10 }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = getScoreColor(percentage);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2a3e" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
    </svg>
  );
};

/* ── component ── */
const Dashboard = () => {
  const [categories, setCategories]             = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [quizCount, setQuizCount]               = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [isRefreshing, setIsRefreshing]         = useState(false);
  const [recommendations, setRecommendations]   = useState([]);
  const [activeTab, setActiveTab]               = useState("overview");
  const [stats, setStats]                       = useState({ totalQuizzes: 0, userAttempts: 0, avgScore: 0, badgeCount: 0 });
  const [allResults, setAllResults]             = useState([]);
  const [lastUpdated, setLastUpdated]           = useState(null);
  const refreshIntervalRef                      = useRef(null);

  const { user, isAdmin } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();

  const REFRESH_MS = 30000;

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [catRes, recRes, resultRes, allQuizRes] = await Promise.all([
        quizAPI.getCategories(),
        resultAPI.getRecommendations(),
        resultAPI.getUserResults(),
        quizAPI.getAllQuizzes(),
      ]);
      setCategories(catRes.data);
      setRecommendations(recRes.data);

      const results      = resultRes.data || [];
      const valid        = results.filter(r => r.totalQuestions > 0);
      const avgScore     = valid.length
        ? Math.round(valid.reduce((s, r) => s + (r.score / r.totalQuestions) * 100, 0) / valid.length)
        : 0;

      setAllResults([...results].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)));
      setStats({
        totalQuizzes: allQuizRes.data.length,
        userAttempts: results.length,
        avgScore,
        badgeCount: user?.badges?.length || 0,
      });
      setLastUpdated(new Date());
      if (location.state?.selectedCategory) setSelectedCategory(location.state.selectedCategory);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.badges?.length, location.state]);

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
    fetchAll(false);
    refreshIntervalRef.current = setInterval(() => fetchAll(true), REFRESH_MS);
    return () => clearInterval(refreshIntervalRef.current);
  }, [fetchAll]);

  useEffect(() => {
    if (selectedCategory && selectedDifficulty) fetchQuizCount();
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
      const res = await quizAPI.getQuizzesByFilter(selectedCategory, selectedDifficulty);
      setQuizCount(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartQuiz = () => {
    if (selectedCategory && selectedDifficulty) {
      navigate("/quiz", {
        state: { category: selectedCategory, difficulty: selectedDifficulty },
      });
    }
    if (selectedCategory && selectedDifficulty)
      navigate("/quiz", { state: { category: selectedCategory, difficulty: selectedDifficulty } });
  };

  /* derived data */
  const categoryStats = categories
    .map(cat => {
      const catR = allResults.filter(r => r.category === cat && r.totalQuestions > 0);
      const avg  = catR.length
        ? Math.round(catR.reduce((s, r) => s + (r.score / r.totalQuestions) * 100, 0) / catR.length)
        : null;
      return { cat, attempts: catR.length, avg };
    })
    .filter(c => c.avg !== null)
    .sort((a, b) => b.avg - a.avg);

  const diffDist = ["Basic", "Intermediate", "Hard"].map(diff => ({
    diff,
    count: allResults.filter(r => r.difficulty === diff).length,
  }));
  const totalAttempts = diffDist.reduce((s, d) => s + d.count, 0);

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  /* shared activity row renderer */
  const ActivityRow = ({ result, idx }) => {
    const pct = result.totalQuestions > 0
      ? Math.round((result.score / result.totalQuestions) * 100) : 0;
    return (
      <div className="activity-row">
        <div className="ar-emoji">{CATEGORY_EMOJI[result.category] || "📝"}</div>
        <div className="ar-details">
          <span className="ar-cat">{result.category}</span>
          <span className={`diff-badge diff-badge-${result.difficulty.toLowerCase()}`}>
            {result.difficulty}
          </span>
        </div>
        <div className="ar-bar">
          <div className="ar-bar-track">
            <div className="ar-bar-fill" style={{ width: `${pct}%`, background: getScoreColor(pct) }} />
          </div>
          <span className="ar-pct" style={{ color: getScoreColor(pct) }}>{pct}%</span>
        </div>
        <span className="ar-frac">{result.score}/{result.totalQuestions}</span>
        <span className="ar-time"><Clock size={11} /> {getTimeAgo(result.completedAt)}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
      <div className="dash-main">
        {/* ── TopBar ── */}
        <div className="user-topbar">
          <div className="user-topbar-left">
            <h2 className="user-page-title">
              {activeTab === "overview"  && "📊 Overview"}
              {activeTab === "quiz"      && "📝 Take a Quiz"}
              {activeTab === "progress"  && "📈 My Progress"}
              {activeTab === "activity"  && "🕐 Activity Feed"}
            </h2>
          </div>
          <div className="user-topbar-right">
            <div className="live-indicator">
              <span className="live-dot" /> Live
            </div>
            {lastUpdated && (
              <span className="last-updated">Updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
            <button
              className={`btn-refresh ${isRefreshing ? "spinning" : ""}`}
              onClick={() => fetchAll(true)}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            {isAdmin && (
              <button className="btn-admin-jump" onClick={() => navigate("/admin")}>
                ⚙️ Admin Panel
              </button>
            )}
          </div>
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
        <div className="user-main-body">

          {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
          {activeTab === "overview" && (
            <>
              {/* Stat cards */}
              <div className="user-stats-grid">
                {[
                  { icon: "📝", value: stats.totalQuizzes,   label: "Available Quizzes", accent: "purple" },
                  { icon: "🏆", value: stats.userAttempts,   label: "Quiz Attempts",     accent: "blue"   },
                  { icon: "🎯", value: `${stats.avgScore}%`, label: "Avg Score",          accent: "green"  },
                  { icon: "🥇", value: stats.badgeCount,     label: "Badges Earned",      accent: "orange" },
                  { icon: "📂", value: categories.length,    label: "Categories",         accent: "teal"   },
                  { icon: "🔥", value: categoryStats.length, label: "Explored Topics",    accent: "red"    },
                ].map(({ icon, value, label, accent }) => (
                  <div key={label} className={`user-stat-card ${accent}`}>
                    <div className="stat-icon">{icon}</div>
                    <div>
                      <h3>{value}</h3>
                      <p>{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Welcome + score ring */}
              <div className="overview-welcome-card">
                <div className="ow-left">
                  <p className="ow-hello">👋 Welcome back, <strong>{user.username}</strong></p>
                  <h2 className="ow-headline">
                    {stats.avgScore >= 70 ? "🌟 You're doing great!" :
                     stats.avgScore >= 40 ? "💪 Keep pushing!" : "🚀 Let's level up!"}
                  </h2>
                  <p className="ow-sub">
                    {stats.userAttempts > 0
                      ? `You've completed ${stats.userAttempts} quiz${stats.userAttempts !== 1 ? "es" : ""} with an average score of ${stats.avgScore}%.`
                      : "Take your first quiz to start tracking your progress!"}
                  </p>
                  <div className="ow-actions">
                    <button className="btn-ow-primary" onClick={() => setActiveTab("quiz")}>
                      <Play size={15} /> Take a Quiz
                    </button>
                    <button className="btn-ow-ghost" onClick={() => navigate("/leaderboard")}>🏆 Leaderboard</button>
                    <button className="btn-ow-ghost" onClick={() => navigate("/analytics")}>📊 Analytics</button>
                  </div>
                </div>
                <div className="ow-right">
                  <div className="score-ring-wrap">
                    <ProgressRing percentage={stats.avgScore} size={120} strokeWidth={11} />
                    <div className="score-ring-inner">
                      <span className="score-ring-value">{stats.avgScore}%</span>
                      <span className="score-ring-text">Avg Score</span>
                    </div>
                  </div>
                  <div className="ow-chips">
                    <span className="ow-chip"><Trophy size={12} /> {stats.userAttempts} Attempts</span>
                    <span className="ow-chip"><Award size={12} /> {stats.badgeCount} Badges</span>
                  </div>
                </div>
              </div>

              {/* Difficulty distribution */}
              {totalAttempts > 0 && (
                <div className="overview-card">
                  <h3>Your Difficulty Distribution</h3>
                  <div className="difficulty-bars">
                    {diffDist.map(({ diff, count }) => {
                      const pct = totalAttempts ? Math.round((count / totalAttempts) * 100) : 0;
                      return (
                        <div key={diff} className="diff-bar-row">
                          <span className="diff-bar-label">{diff}</span>
                          <div className="diff-bar-track">
                            <div className={`diff-bar-fill diff-bar-${diff.toLowerCase()}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="diff-bar-count">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category performance chips */}
              {categoryStats.length > 0 && (
                <div className="overview-card">
                  <div className="overview-card-header">
                    <h3>Category Performance</h3>
                    <button className="btn-view-all" onClick={() => setActiveTab("progress")}>
                      View All →
                    </button>
                  </div>
                  <div className="category-perf-grid">
                    {categoryStats.slice(0, 8).map(({ cat, attempts, avg }) => (
                      <div key={cat} className="cat-perf-chip">
                        <span className="cat-perf-emoji">{CATEGORY_EMOJI[cat] || "📚"}</span>
                        <span className="cat-perf-name">{cat}</span>
                        <span className="cat-perf-badge" style={{ background: getScoreColor(avg) + "22", color: getScoreColor(avg) }}>
                          {avg}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="overview-card">
                  <h3>💡 Recommended for You</h3>
                  <div className="rec-grid">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="rec-card">
                        <div className="rec-card-top">
                          <span className="rec-emoji">{CATEGORY_EMOJI[rec.category] || "📚"}</span>
                          <span className={`diff-badge diff-badge-${rec.difficulty.toLowerCase()}`}>
                            {rec.difficulty}
                          </span>
                        </div>
                        <p className="rec-name">{rec.category}</p>
                        <p className="rec-score-text">Your avg: {rec.avgScore}%</p>
                        <p className="rec-reason">{rec.reason}</p>
                        <button
                          className="btn-rec-practice"
                          onClick={() => navigate("/quiz", { state: { category: rec.category, difficulty: rec.difficulty } })}
                        >
                          <Play size={13} /> Practice
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {allResults.length > 0 && (
                <div className="overview-card">
                  <div className="overview-card-header">
                    <h3>🕐 Recent Activity</h3>
                    <button className="btn-view-all" onClick={() => setActiveTab("activity")}>
                      View All →
                    </button>
                  </div>
                  <div className="activity-feed">
                    {allResults.slice(0, 5).map((r, idx) => <ActivityRow key={idx} result={r} idx={idx} />)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════ TAKE QUIZ TAB ═══════════════ */}
          {activeTab === "quiz" && (
            <div className="quiz-tab">
              {!selectedCategory ? (
                <>
                  <div className="quiz-tab-header">
                    <h3>🗂️ Select a Category</h3>
                    <p>Choose a technology to test your skills</p>
                  </div>
                  <div className="category-cards-grid">
                    {categories.map(cat => {
                      const catR = allResults.filter(r => r.category === cat && r.totalQuestions > 0);
                      const avg  = catR.length
                        ? Math.round(catR.reduce((s, r) => s + (r.score / r.totalQuestions) * 100, 0) / catR.length)
                        : null;
                      return (
                        <button key={cat} className="category-card" onClick={() => setSelectedCategory(cat)}>
                          <span className="cat-card-emoji">{CATEGORY_EMOJI[cat] || "📚"}</span>
                          <span className="cat-card-name">{cat}</span>
                          {avg !== null
                            ? <span className="cat-card-avg" style={{ color: getScoreColor(avg) }}>Avg: {avg}%</span>
                            : <span className="cat-card-new">New!</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="quiz-setup-panel">
                  <div className="quiz-setup-banner">
                    <span className="setup-emoji">{CATEGORY_EMOJI[selectedCategory] || "📚"}</span>
                    <div>
                      <h3>{selectedCategory}</h3>
                      <p>Select difficulty to continue</p>
                    </div>
                    <button
                      className="btn-change-cat"
                      onClick={() => { setSelectedCategory(""); setSelectedDifficulty(""); }}
                    >
                      ← Change
                    </button>
                  </div>

                  <p className="diff-pick-label">Choose Difficulty</p>
                  <div className="diff-buttons-row">
                    {DIFFICULTIES.map(({ label, emoji, color, bg, border }) => (
                      <button
                        key={label}
                        className={`btn-diff-card ${selectedDifficulty === label ? "active" : ""}`}
                        style={selectedDifficulty === label ? { background: bg, borderColor: border, color } : {}}
                        onClick={() => setSelectedDifficulty(label)}
                      >
                        <span className="diff-card-emoji">{emoji}</span>
                        <span className="diff-card-label">{label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedDifficulty && (
                    <div className="quiz-action-row">
                      <div className={`quiz-count-badge ${quizCount > 0 ? "count-green" : "count-red"}`}>
                        {quizCount > 0
                          ? <><BookOpen size={15} /> {quizCount} question{quizCount !== 1 ? "s" : ""} available</>
                          : "❌ No questions available for this selection"}
                      </div>
                      {quizCount > 0 && (
                        <button className="btn-start-quiz" onClick={handleStartQuiz}>
                          <Play size={16} /> Start Quiz
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
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
          {/* ═══════════════ MY PROGRESS TAB ═══════════════ */}
          {activeTab === "progress" && (
            <>
              {categoryStats.length === 0 ? (
                <div className="overview-card">
                  <p className="no-data-msg">
                    🎯 Complete some quizzes to see your progress!
                  </p>
                  <div style={{ textAlign: "center", marginTop: 16 }}>
                    <button className="btn-ow-primary" onClick={() => setActiveTab("quiz")}>
                      <Play size={15} /> Start a Quiz
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Category bars */}
                  <div className="overview-card">
                    <h3>📊 Performance by Category</h3>
                    <div className="cat-progress-list">
                      {categoryStats.map(({ cat, attempts, avg }) => (
                        <div key={cat} className="cat-progress-row">
                          <div className="cpr-left">
                            <span className="cpr-emoji">{CATEGORY_EMOJI[cat] || "📚"}</span>
                            <div>
                              <span className="cpr-name">{cat}</span>
                              <span className="cpr-attempts">{attempts} attempt{attempts !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                          <div className="cpr-bar-wrap">
                            <div className="cpr-bar-track">
                              <div className="cpr-bar-fill" style={{ width: `${avg}%`, background: getScoreColor(avg) }} />
                            </div>
                            <span className="cpr-pct" style={{ color: getScoreColor(avg) }}>{avg}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score history */}
                  <div className="overview-card">
                    <h3>📈 Recent Scores (Last 10)</h3>
                    <div className="score-history-list">
                      {allResults.slice(0, 10).map((r, idx) => {
                        const pct = r.totalQuestions > 0
                          ? Math.round((r.score / r.totalQuestions) * 100) : 0;
                        return (
                          <div key={idx} className="score-history-row">
                            <span className="shr-idx">#{idx + 1}</span>
                            <span className="shr-emoji">{CATEGORY_EMOJI[r.category] || "📚"}</span>
                            <div className="shr-info">
                              <span className="shr-cat">{r.category}</span>
                              <span className={`diff-badge diff-badge-${r.difficulty.toLowerCase()}`}>
                                {r.difficulty}
                              </span>
                            </div>
                            <div className="shr-bar-wrap">
                              <div className="shr-bar-track">
                                <div className="shr-bar-fill" style={{ width: `${pct}%`, background: getScoreColor(pct) }} />
                              </div>
                            </div>
                            <span className="shr-score" style={{ color: getScoreColor(pct) }}>{pct}%</span>
                            <span className="shr-frac">{r.score}/{r.totalQuestions}</span>
                            <span className="shr-time">{getTimeAgo(r.completedAt)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary cards */}
                  <div className="prog-summary-row">
                    <div className="overview-card">
                      <h3>🏆 Best Category</h3>
                      <div className="summary-stat-card">
                        <span className="ss-emoji">{CATEGORY_EMOJI[categoryStats[0].cat] || "📚"}</span>
                        <p className="ss-name">{categoryStats[0].cat}</p>
                        <p className="ss-score" style={{ color: getScoreColor(categoryStats[0].avg) }}>
                          {categoryStats[0].avg}%
                        </p>
                      </div>
                    </div>
                    {categoryStats.length > 1 && (
                      <div className="overview-card">
                        <h3>📉 Needs Work</h3>
                        <div className="summary-stat-card">
                          <span className="ss-emoji">{CATEGORY_EMOJI[categoryStats[categoryStats.length - 1].cat] || "📚"}</span>
                          <p className="ss-name">{categoryStats[categoryStats.length - 1].cat}</p>
                          <p className="ss-score" style={{ color: getScoreColor(categoryStats[categoryStats.length - 1].avg) }}>
                            {categoryStats[categoryStats.length - 1].avg}%
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="overview-card">
                      <h3>📊 Total Attempts</h3>
                      <div className="summary-stat-card">
                        <span className="ss-emoji">🎯</span>
                        <p className="ss-score" style={{ color: "#7c3aed" }}>{stats.userAttempts}</p>
                        <p className="ss-name">quizzes completed</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══════════════ ACTIVITY TAB ═══════════════ */}
          {activeTab === "activity" && (
            <div className="overview-card">
              <div className="overview-card-header">
                <h3>🕐 All Activity</h3>
                <button className="btn-view-all" onClick={() => navigate("/history")}>
                  Full History →
                </button>
              </div>
              {allResults.length === 0 ? (
                <p className="no-data-msg">No quiz activity yet. Take your first quiz!</p>
              ) : (
                <div className="activity-feed">
                  {allResults.map((r, idx) => <ActivityRow key={idx} result={r} idx={idx} />)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;