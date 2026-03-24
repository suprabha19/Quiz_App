import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resultAPI, authAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { quizAPI } from '../services/api';
import '../styles/QuizHistory.css';
import { Target, Star, Award, Trophy, BookOpen, Medal, Sparkles, ThumbsUp, Dumbbell } from 'lucide-react';

const BADGE_INFO = {
  first_quiz:       { Icon: Target,   label: 'First Quiz',       desc: 'Completed your first quiz' },
  perfect_score:    { Icon: Star,     label: 'Perfect Score',    desc: 'Got 100% on a quiz' },
  top_scorer:       { Icon: Award,    label: 'Star Performer',   desc: 'Scored 90%+ on a quiz' },
  quiz_veteran:     { Icon: Trophy,   label: 'Quiz Veteran',     desc: 'Completed 10 quizzes' },
  knowledge_seeker: { Icon: BookOpen, label: 'Knowledge Seeker', desc: 'Explored 3+ categories' }
};

const QuizHistory = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [badges, setBadges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, categoriesRes, profileRes] = await Promise.all([
          resultAPI.getUserResults(),
          quizAPI.getCategories(),
          authAPI.getProfile()
        ]);
        setResults(resultsRes.data);
        setCategories(categoriesRes.data);
        setBadges(profileRes.data.badges || []);
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
        <TopBar 
          categories={categories}
          onCategorySelect={(category) => {
            navigate('/dashboard', { state: { selectedCategory: category } });
          }}
        />
        
        <div className="main-content-body">
          <div className="dashboard-header">
            <h1>My Quiz History</h1>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Take a Quiz
            </button>
          </div>

        {badges.length > 0 && (
          <div className="history-badges-section">
            <h2><Medal size={20} /> My Achievements</h2>
            <div className="history-badges-grid">
              {badges.map(badge => {
                const BadgeIcon = BADGE_INFO[badge]?.Icon || Award;
                return (
                  <div key={badge} className="history-badge-card">
                    <span className="hb-icon"><BadgeIcon size={28} /></span>
                    <span className="hb-label">{BADGE_INFO[badge]?.label}</span>
                    <span className="hb-desc">{BADGE_INFO[badge]?.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {results.length === 0 ? (
          <div className="history-empty">
            <p>No quiz attempts yet. Start your first quiz!</p>
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
                      {percentage >= 90 ? <><Sparkles size={14} /> Excellent</> :
                       percentage >= 70 ? <><ThumbsUp size={14} /> Great</> :
                       percentage >= 50 ? <><ThumbsUp size={14} /> Good</> : <><Dumbbell size={14} /> Keep Going</>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default QuizHistory;

