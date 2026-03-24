import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, authAPI, resultAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { RefreshCw, Search, Download, FileText, Users, BarChart2, Target, FolderOpen, ShieldCheck } from 'lucide-react';
import '../styles/Admin.css';
import '../styles/AdminSidebar.css';

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [quizSearch, setQuizSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [userFilter, setUserFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('overview');
  const [roleUpdating, setRoleUpdating] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const refreshIntervalRef = useRef(null);

  const REFRESH_INTERVAL_MS = 30000;
  const difficulties = ['All', 'Basic', 'Intermediate', 'Hard'];

  const addActivity = useCallback((message, type = 'info') => {
    setActivityLog(prev => [
      { id: Date.now(), message, type, time: new Date() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [quizRes, catRes, userRes, resultRes] = await Promise.all([
        quizAPI.getAllQuizzes(),
        quizAPI.getCategories(),
        authAPI.getAllUsers(),
        resultAPI.getAllResults(),
      ]);
      setQuizzes(quizRes.data);
      setCategories(['All', ...catRes.data]);
      setUsers(userRes.data);
      setResults(resultRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(false);
    // Auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshIntervalRef.current);
  }, [fetchAll]);

  useEffect(() => {
    let filtered = quizzes;
    if (selectedCategory !== 'All') filtered = filtered.filter(q => q.category === selectedCategory);
    if (selectedDifficulty !== 'All') filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    if (quizSearch.trim()) {
      const q = quizSearch.toLowerCase();
      filtered = filtered.filter(quiz =>
        quiz.question.toLowerCase().includes(q) ||
        quiz.category.toLowerCase().includes(q)
      );
    }
    setFilteredQuizzes(filtered);
  }, [selectedCategory, selectedDifficulty, quizSearch, quizzes]);

  useEffect(() => {
    let filtered = results;
    if (userFilter !== 'All') filtered = filtered.filter(r => r.user?.username === userFilter);
    if (categoryFilter !== 'All') filtered = filtered.filter(r => r.category === categoryFilter);
    setFilteredResults(filtered);
  }, [userFilter, categoryFilter, results]);

  const filteredUsers = userSearch.trim()
    ? users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'promote to Admin' : 'demote to User';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    setRoleUpdating(userId);
    try {
      const response = await authAPI.updateUserRole(userId, newRole);
      const updatedUser = users.find(u => u._id === userId);
      setUsers(users.map(u => u._id === userId ? { ...u, role: response.data.role } : u));
      addActivity(`Role updated: ${updatedUser?.username} → ${newRole}`, 'warning');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    try {
      const quiz = quizzes.find(q => q._id === id);
      await quizAPI.deleteQuiz(id);
      setQuizzes(quizzes.filter(q => q._id !== id));
      setDeleteConfirm(null);
      addActivity(`Quiz deleted: "${quiz?.question?.slice(0, 40)}..."`, 'danger');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  const handleEdit = (id) => navigate(`/admin/edit/${id}`);

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => data[0][k] === null || typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(row =>
      keys.map(k => JSON.stringify(row[k] ?? '')).join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addActivity(`Exported ${filename}`, 'info');
  };

  // Overview stats
  const validResults = results.filter(r => r.totalQuestions > 0);
  const avgScore = validResults.length > 0
    ? Math.round(validResults.reduce((s, r) => s + (r.score / r.totalQuestions) * 100, 0) / validResults.length)
    : 0;
  const recentResults = [...results].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 5);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="admin-main">
        {/* Admin TopBar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <h2 className="admin-page-title">
              {activeTab === 'overview' && '📊 Overview'}
              {activeTab === 'quizzes' && '📝 Manage Quizzes'}
              {activeTab === 'users' && '👥 Manage Users'}
              {activeTab === 'results' && '📈 User Results'}
              {activeTab === 'activity' && '🕐 Activity Log'}
            </h2>
          </div>
          <div className="admin-topbar-right">
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live
            </div>
            <span className="last-updated">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
              onClick={() => fetchAll(true)}
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="admin-main-body">

          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <>
              <div className="admin-stats-grid">
                <div className="admin-stat-card purple">
                  <div className="stat-icon"><FileText size={20} /></div>
                  <div>
                    <h3>{quizzes.length}</h3>
                    <p>Total Quizzes</p>
                  </div>
                </div>
                <div className="admin-stat-card blue">
                  <div className="stat-icon"><Users size={20} /></div>
                  <div>
                    <h3>{users.length}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="admin-stat-card green">
                  <div className="stat-icon"><BarChart2 size={20} /></div>
                  <div>
                    <h3>{results.length}</h3>
                    <p>Quiz Attempts</p>
                  </div>
                </div>
                <div className="admin-stat-card orange">
                  <div className="stat-icon"><Target size={20} /></div>
                  <div>
                    <h3>{avgScore}%</h3>
                    <p>Avg Score</p>
                  </div>
                </div>
                <div className="admin-stat-card teal">
                  <div className="stat-icon"><FolderOpen size={20} /></div>
                  <div>
                    <h3>{categories.length - 1}</h3>
                    <p>Categories</p>
                  </div>
                </div>
                <div className="admin-stat-card red">
                  <div className="stat-icon"><ShieldCheck size={20} /></div>
                  <div>
                    <h3>{users.filter(u => u.role === 'admin').length}</h3>
                    <p>Admins</p>
                  </div>
                </div>
              </div>

              {/* Difficulty Distribution Bar */}
              <div className="overview-card">
                <h3>Quiz Difficulty Distribution</h3>
                <div className="difficulty-bars">
                  {['Basic', 'Intermediate', 'Hard'].map(diff => {
                    const count = quizzes.filter(q => q.difficulty === diff).length;
                    const pct = quizzes.length > 0 ? Math.round((count / quizzes.length) * 100) : 0;
                    return (
                      <div key={diff} className="diff-bar-row">
                        <span className="diff-label">{diff}</span>
                        <div className="diff-bar-track">
                          <div
                            className={`diff-bar-fill diff-bar-${diff.toLowerCase()}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="diff-count">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="overview-card">
                <h3>Questions per Category</h3>
                <div className="category-grid">
                  {categories.filter(c => c !== 'All').map(cat => {
                    const count = quizzes.filter(q => q.category === cat).length;
                    return (
                      <div key={cat} className="cat-stat-chip">
                        <span className="cat-name-stat">{cat}</span>
                        <span className="cat-count-badge">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Quiz Attempts */}
              <div className="overview-card">
                <div className="overview-card-header">
                  <h3>Recent Quiz Attempts</h3>
                  <button className="btn-view-all" onClick={() => setActiveTab('results')}>
                    View All →
                  </button>
                </div>
                {recentResults.length === 0 ? (
                  <p className="no-data-msg">No quiz attempts yet.</p>
                ) : (
                  <div className="recent-results-list">
                    {recentResults.map(r => {
                      const pct = r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0;
                      return (
                        <div key={r._id} className="recent-result-row">
                          <div className="rr-user">👤 {r.user?.username || 'Unknown'}</div>
                          <div className="rr-category">{r.category}</div>
                          <div className={`rr-diff badge badge-${r.difficulty.toLowerCase()}`}>{r.difficulty}</div>
                          <div className="rr-score">{r.score}/{r.totalQuestions}</div>
                          <div className={`percentage-badge ${pct >= 90 ? 'excellent' : pct >= 70 ? 'great' : pct >= 50 ? 'good' : 'poor'}`}>{pct}%</div>
                          <div className="rr-time">{new Date(r.completedAt).toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== QUIZZES TAB ===== */}
          {activeTab === 'quizzes' && (
            <>
              <div className="admin-stats">
                <div className="stat-card"><h3>{quizzes.length}</h3><p>Total Quizzes</p></div>
                <div className="stat-card"><h3>{categories.length - 1}</h3><p>Categories</p></div>
                <div className="stat-card"><h3>{quizzes.filter(q => q.difficulty === 'Basic').length}</h3><p>Basic</p></div>
                <div className="stat-card"><h3>{quizzes.filter(q => q.difficulty === 'Intermediate').length}</h3><p>Intermediate</p></div>
                <div className="stat-card"><h3>{quizzes.filter(q => q.difficulty === 'Hard').length}</h3><p>Hard</p></div>
              </div>

              <div className="admin-toolbar">
                <div className="toolbar-search">
                  <Search size={16} />
                  <input
                    placeholder="Search quizzes..."
                    value={quizSearch}
                    onChange={e => setQuizSearch(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Category:</label>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Difficulty:</label>
                  <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)}>
                    {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button className="btn-export" onClick={() => exportCSV(filteredQuizzes.map(q => ({
                  question: q.question, category: q.category, difficulty: q.difficulty,
                  correctAnswer: String.fromCharCode(65 + q.correctAnswer)
                })), 'quizzes.csv')}>
                  <Download size={14} /> Export CSV
                </button>
                <button className="btn-create" onClick={() => navigate('/admin/create')}>
                  + Create Quiz
                </button>
              </div>

              <div className="quizzes-table">
                <h2>Quizzes ({filteredQuizzes.length})</h2>
                {filteredQuizzes.length === 0 ? (
                  <p className="no-quizzes">No quizzes found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Category</th>
                        <th>Difficulty</th>
                        <th>Options</th>
                        <th>Answer</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuizzes.map(quiz => (
                        <tr key={quiz._id}>
                          <td className="question-cell">{quiz.question}</td>
                          <td>{quiz.category}</td>
                          <td><span className={`badge badge-${quiz.difficulty.toLowerCase()}`}>{quiz.difficulty}</span></td>
                          <td className="options-cell">
                            {quiz.options.map((opt, idx) => (
                              <div key={idx}>{String.fromCharCode(65 + idx)}: {opt}</div>
                            ))}
                          </td>
                          <td className="correct-answer">{String.fromCharCode(65 + quiz.correctAnswer)}</td>
                          <td className="actions-cell">
                            <button className="btn-edit" onClick={() => handleEdit(quiz._id)}>Edit</button>
                            <button
                              className={`btn-delete ${deleteConfirm === quiz._id ? 'confirm' : ''}`}
                              onClick={() => handleDelete(quiz._id)}
                            >
                              {deleteConfirm === quiz._id ? 'Confirm?' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ===== USERS TAB ===== */}
          {activeTab === 'users' && (
            <>
              <div className="admin-stats">
                <div className="stat-card"><h3>{users.length}</h3><p>Total Users</p></div>
                <div className="stat-card"><h3>{users.filter(u => u.role === 'admin').length}</h3><p>Admins</p></div>
                <div className="stat-card"><h3>{users.filter(u => u.role === 'user').length}</h3><p>Regular Users</p></div>
              </div>

              <div className="admin-toolbar">
                <div className="toolbar-search">
                  <Search size={16} />
                  <input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
                <button className="btn-export" onClick={() => exportCSV(filteredUsers.map(u => ({
                  username: u.username, role: u.role, joined: new Date(u.createdAt).toLocaleDateString()
                })), 'users.csv')}>
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="users-table">
                <h2>Users ({filteredUsers.length})</h2>
                {filteredUsers.length === 0 ? (
                  <p className="no-users">No users found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Quiz Attempts</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => {
                        const userAttempts = results.filter(r => r.user?._id === user._id).length;
                        return (
                          <tr key={user._id}>
                            <td>{user.username}</td>
                            <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>{userAttempts}</td>
                            <td className="actions-cell">
                              {user._id !== currentUser?._id ? (
                                <button
                                  className={user.role === 'admin' ? 'btn-delete' : 'btn-edit'}
                                  disabled={roleUpdating === user._id}
                                  onClick={() => handleRoleToggle(user._id, user.role)}
                                >
                                  {roleUpdating === user._id ? 'Updating...' : user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </button>
                              ) : (
                                <span className="self-label">You</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ===== RESULTS TAB ===== */}
          {activeTab === 'results' && (
            <>
              <div className="admin-stats">
                <div className="stat-card"><h3>{results.length}</h3><p>Total Attempts</p></div>
                <div className="stat-card"><h3>{new Set(results.map(r => r.user?._id).filter(Boolean)).size}</h3><p>Active Users</p></div>
                <div className="stat-card"><h3>{avgScore}%</h3><p>Avg Score</p></div>
                <div className="stat-card"><h3>{results.filter(r => r.totalQuestions > 0 && (r.score / r.totalQuestions) >= 0.9).length}</h3><p>Perfect (≥90%)</p></div>
              </div>

              <div className="admin-toolbar">
                <div className="filter-group">
                  <label>User:</label>
                  <select value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                    <option value="All">All Users</option>
                    {[...new Set(results.map(r => r.user?.username).filter(Boolean))].sort().map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Category:</label>
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    {[...new Set(results.map(r => r.category))].sort().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button className="btn-export" onClick={() => exportCSV(filteredResults.map(r => ({
                  user: r.user?.username, category: r.category, difficulty: r.difficulty,
                  score: r.score, total: r.totalQuestions,
                  pct: r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) + '%' : '0%',
                  date: new Date(r.completedAt).toLocaleString()
                })), 'results.csv')}>
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="results-table">
                <h2>Results ({filteredResults.length})</h2>
                {filteredResults.length === 0 ? (
                  <p className="no-results">No results found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Category</th>
                        <th>Difficulty</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map(result => {
                        const pct = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
                        return (
                          <tr key={result._id}>
                            <td className="user-cell"><strong>{result.user?.username || 'Unknown'}</strong></td>
                            <td>{result.category}</td>
                            <td><span className={`badge badge-${result.difficulty.toLowerCase()}`}>{result.difficulty}</span></td>
                            <td className="score-cell">{result.score} / {result.totalQuestions}</td>
                            <td>
                              <span className={`percentage-badge ${pct >= 90 ? 'excellent' : pct >= 70 ? 'great' : pct >= 50 ? 'good' : 'poor'}`}>
                                {pct}%
                              </span>
                            </td>
                            <td>{new Date(result.completedAt).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ===== ACTIVITY LOG TAB ===== */}
          {activeTab === 'activity' && (
            <div className="activity-log-container">
              <div className="overview-card-header" style={{ marginBottom: 16 }}>
                <h3>Activity Log</h3>
                <button className="btn-secondary" onClick={() => setActivityLog([])}>Clear Log</button>
              </div>
              {activityLog.length === 0 ? (
                <div className="overview-card">
                  <p className="no-data-msg">No activity recorded yet. Actions like deleting quizzes or changing user roles will appear here.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {activityLog.map(entry => (
                    <div key={entry.id} className={`activity-entry activity-${entry.type}`}>
                      <span className="activity-msg">{entry.message}</span>
                      <span className="activity-time">{entry.time.toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
