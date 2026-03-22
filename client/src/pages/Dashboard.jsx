import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { quizAPI, resultAPI } from "../services/api";
import "../styles/Dashboard.css";
import {
  Medal, Star, Zap, Target, Stars, Trophy,
  BookOpen, TrendingUp, Clock, ChevronRight,
  Award, BarChart2, Play,
} from "lucide-react";

/* ── Circular progress ring (SVG) ── */
const ProgressRing = ({ percentage, size = 110, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 70 ? "#4ade80" : percentage >= 40 ? "#fbbf24" : "#f87171";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
    </svg>
  );
};

const MOTIVATIONAL = [
  "🔥 Keep the momentum going!",
  "💪 You're crushing it!",
  "🌟 Every quiz makes you smarter!",
  "🎯 Aim for perfection!",
  "🚀 Level up your knowledge!",
];

const CATEGORY_EMOJI = {
  HTML: "🌐", CSS: "🎨", JavaScript: "⚡", React: "⚛️",
  "Node.js": "🟢", Nodejs: "🟢", MongoDB: "🍃", Java: "☕", Python: "🐍",
};

const DIFFICULTIES = [
  { label: "Basic",        emoji: "🌱", color: "#10b981", bg: "#d1fae5", border: "#6ee7b7" },
  { label: "Intermediate", emoji: "⚡", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  { label: "Hard",         emoji: "🔥", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
];

const getScoreColor = (pct) => pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";

const getTimeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
};

const Dashboard = () => {
  const [categories, setCategories]             = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [quizCount, setQuizCount]               = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [recommendations, setRecommendations]   = useState([]);
  const [stats, setStats]                       = useState({ totalQuizzes: 0, userAttempts: 0, avgScore: 0, badgeCount: 0 });
  const [recentActivity, setRecentActivity]     = useState([]);
  const [lastUpdated, setLastUpdated]           = useState(null);
  const [motiveIdx]                             = useState(() => Math.floor(Math.random() * MOTIVATIONAL.length));
  const refreshIntervalRef                      = useRef(null);

  const { user, isAdmin } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();

  const REFRESH_INTERVAL_MS = 30000;

  const fetchLiveData = useCallback(async () => {
    try {
      const [catRes, recRes, resultRes] = await Promise.all([
        quizAPI.getCategories(),
        resultAPI.getRecommendations(),
        resultAPI.getUserResults(),
      ]);
      setCategories(catRes.data);
      setRecommendations(recRes.data);

      const results      = resultRes.data || [];
      const validResults = results.filter(r => r.totalQuestions > 0);
      const avgScore     = validResults.length > 0
        ? Math.round(validResults.reduce((s, r) => s + (r.score / r.totalQuestions) * 100, 0) / validResults.length)
        : 0;

      setStats(prev => ({ ...prev, userAttempts: results.length, avgScore, badgeCount: user?.badges?.length || 0 }));

      const sorted = [...results].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
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
        const allQuizzesRes = await quizAPI.getAllQuizzes();
        setStats(prev => ({ ...prev, totalQuizzes: allQuizzesRes.data.length }));
        if (location.state?.selectedCategory) setSelectedCategory(location.state.selectedCategory);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
    refreshIntervalRef.current = setInterval(fetchLiveData, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshIntervalRef.current);
  }, [fetchLiveData, location.state]);

  useEffect(() => {
    if (selectedCategory && selectedDifficulty) fetchQuizCount();
  }, [selectedCategory, selectedDifficulty]);

  const fetchQuizCount = async () => {
    try {
      const response = await quizAPI.getQuizzesByFilter(selectedCategory, selectedDifficulty);
      setQuizCount(response.data.length);
    } catch (error) {
      console.error("Error fetching quiz count:", error);
    }
  };

  const handleStartQuiz = () => {
    if (selectedCategory && selectedDifficulty) {
      navigate("/quiz", { state: { category: selectedCategory, difficulty: selectedDifficulty } });
    }
  };

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <div className="dash-loading-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

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

          {/* ── Hero Banner ── */}
          <div className="hero-banner">
            <div className="hero-left">
              <div className="hero-greeting">
                <span className="hero-wave">👋</span>
                <span>Welcome back,</span>
              </div>
              <h1 className="hero-name">{user.username}!</h1>
              <p className="hero-motto">{MOTIVATIONAL[motiveIdx]}</p>
              <div className="hero-cta-row">
                {isAdmin && (
                  <button className="hero-pill hero-pill-white" onClick={() => navigate("/admin")}>
                    ⚙️ Admin Panel
                  </button>
                )}
                <button className="hero-pill hero-pill-ghost" onClick={() => navigate("/leaderboard")}>
                  🏆 Leaderboard
                </button>
                <button className="hero-pill hero-pill-ghost" onClick={() => navigate("/analytics")}>
                  📊 Analytics
                </button>
              </div>
            </div>

            <div className="hero-right">
              <div className="score-ring-wrap">
                <ProgressRing percentage={stats.avgScore} size={110} strokeWidth={10} />
                <div className="score-ring-label">
                  <span className="score-ring-value">{stats.avgScore}%</span>
                  <span className="score-ring-text">Avg Score</span>
                </div>
              </div>
              <div className="hero-badges">
                <div className="hero-badge-chip"><Trophy size={13} /> {stats.userAttempts} Attempts</div>
                <div className="hero-badge-chip"><Award  size={13} /> {stats.badgeCount} Badges</div>
              </div>
            </div>

            <div className="hero-live-tag">
              <span className="live-dot" />
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Live"}
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="stat-cards-row">
            {[
              { icon: "📝", value: stats.totalQuizzes, label: "Total Quizzes",  accent: "blue",   Icon: TrendingUp },
              { icon: "🏆", value: stats.userAttempts, label: "Quizzes Taken",  accent: "purple", Icon: BarChart2  },
              { icon: "🎯", value: `${stats.avgScore}%`, label: "Avg Score",    accent: "green",  Icon: Target     },
              { icon: "🥇", value: stats.badgeCount,   label: "Badges Earned", accent: "orange", Icon: Star       },
              { icon: "📂", value: categories.length,  label: "Categories",    accent: "teal",   Icon: BookOpen   },
            ].map(({ icon, value, label, accent, Icon }) => (
              <div key={label} className={`stat-card stat-card-${accent}`}>
                <span className="stat-card-icon">{icon}</span>
                <div className="stat-card-body">
                  <span className="stat-card-value">{value}</span>
                  <span className="stat-card-label">{label}</span>
                </div>
                <Icon size={20} className="stat-card-trend-icon" />
              </div>
            ))}
          </div>

          {/* ── Quiz Selection ── */}
          <div className="quiz-selection">
            {!selectedCategory ? (
              <div className="welcome-card">
                <div className="welcome-icon-wrap">
                  <Medal size={36} className="welcome-medal-icon" />
                </div>
                <h2 className="welcome-title">Ready to Test Your Knowledge?</h2>
                <p className="welcome-subtitle">
                  Pick a technology from the sidebar or the quick-start chips below to begin your challenge!
                </p>

                <div className="welcome-features">
                  <div className="feature-box">
                    <Star size={22} className="feature-icon feature-icon-star" />
                    <h4>Multiple Technologies</h4>
                    <p>HTML, CSS, JavaScript, React, Node.js, Python &amp; more</p>
                  </div>
                  <div className="feature-box">
                    <Zap size={22} className="feature-icon feature-icon-zap" />
                    <h4>3 Difficulty Levels</h4>
                    <p>Basic, Intermediate &amp; Hard challenges</p>
                  </div>
                  <div className="feature-box">
                    <Target size={22} className="feature-icon feature-icon-target" />
                    <h4>Instant Feedback</h4>
                    <p>Detailed results &amp; performance analysis</p>
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="quick-category-row">
                    <p className="quick-cat-label">⚡ Quick Start:</p>
                    <div className="quick-cat-chips">
                      {categories.slice(0, 6).map(cat => (
                        <button key={cat} className="quick-cat-chip" onClick={() => setSelectedCategory(cat)}>
                          {CATEGORY_EMOJI[cat] || "📚"} {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="welcome-footer">
                  <Stars size={14} /> Select any technology to begin your learning adventure!
                </div>
              </div>
            ) : (
              <div className="quiz-setup-card">
                <div className="selected-category-banner">
                  <span className="sel-cat-emoji">{CATEGORY_EMOJI[selectedCategory] || "📚"}</span>
                  <div>
                    <h3>{selectedCategory}</h3>
                    <p>Choose your difficulty level below</p>
                  </div>
                  <button className="btn-change-cat" onClick={() => { setSelectedCategory(""); setSelectedDifficulty(""); }}>
                    ← Change
                  </button>
                </div>

                <div className="difficulty-selection">
                  <p className="diff-label">Select Difficulty:</p>
                  <div className="difficulty-buttons">
                    {DIFFICULTIES.map(({ label, emoji, color, bg, border }) => (
                      <button
                        key={label}
                        className={`btn-difficulty ${selectedDifficulty === label ? "active" : ""}`}
                        style={selectedDifficulty === label ? { background: bg, borderColor: border, color } : {}}
                        onClick={() => setSelectedDifficulty(label)}
                      >
                        <span className="diff-emoji">{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDifficulty && (
                  <div className="quiz-info">
                    <div className={`quiz-info-badge ${quizCount > 0 ? "badge-green" : "badge-red"}`}>
                      {quizCount > 0
                        ? <><BookOpen size={15} /> {quizCount} question{quizCount !== 1 ? "s" : ""} ready</>
                        : "❌ No questions available for this selection"}
                    </div>
                    {quizCount > 0 && (
                      <button className="btn-start-quiz" onClick={handleStartQuiz}>
                        <Play size={17} /> Start Quiz
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Recommendations ── */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <div className="section-header">
                <h2>💡 Recommended for You</h2>
                <span className="section-badge">{recommendations.length} suggestions</span>
              </div>
              <div className="recommendations-grid">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-card">
                    <div className="rec-top">
                      <span className="rec-emoji">{CATEGORY_EMOJI[rec.category] || "📚"}</span>
                      <span className={`rec-difficulty difficulty-${rec.difficulty.toLowerCase()}`}>{rec.difficulty}</span>
                    </div>
                    <div className="rec-category">{rec.category}</div>
                    <div className="rec-score">Your avg: {rec.avgScore}%</div>
                    <div className="rec-reason">{rec.reason}</div>
                    <button
                      className="btn-start-quiz rec-btn"
                      onClick={() => navigate("/quiz", { state: { category: rec.category, difficulty: rec.difficulty } })}
                    >
                      <Play size={13} /> Practice Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent Activity ── */}
          {recentActivity.length > 0 && (
            <div className="recent-activity-section">
              <div className="section-header">
                <h2>🕐 Recent Activity</h2>
                <button className="btn-view-history" onClick={() => navigate("/history")}>
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="recent-activity-list">
                {recentActivity.map((result, idx) => {
                  const pct = result.totalQuestions > 0
                    ? Math.round((result.score / result.totalQuestions) * 100)
                    : 0;
                  return (
                    <div key={idx} className="activity-item">
                      <div className="activity-emoji-icon">{CATEGORY_EMOJI[result.category] || "📝"}</div>
                      <div className="activity-details">
                        <span className="activity-cat">{result.category}</span>
                        <span className={`activity-diff difficulty-${result.difficulty.toLowerCase()}`}>
                          {result.difficulty}
                        </span>
                      </div>
                      <div className="activity-progress">
                        <div className="activity-progress-bar">
                          <div
                            className="activity-progress-fill"
                            style={{ width: `${pct}%`, background: getScoreColor(pct) }}
                          />
                        </div>
                        <span className="activity-pct" style={{ color: getScoreColor(pct) }}>{pct}%</span>
                      </div>
                      <div className="activity-score-frac">{result.score}/{result.totalQuestions}</div>
                      <div className="activity-time">
                        <Clock size={12} /> {getTimeAgo(result.completedAt)}
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
