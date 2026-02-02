import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, authAPI } from '../services/api';
import '../styles/Admin.css';

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const navigate = useNavigate();

  const difficulties = ['All', 'Basic', 'Intermediate', 'Hard'];

  useEffect(() => {
    fetchQuizzes();
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterQuizzes();
  }, [selectedCategory, selectedDifficulty, quizzes]);

  const fetchQuizzes = async () => {
    try {
      const response = await quizAPI.getAllQuizzes();
      setQuizzes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await quizAPI.getCategories();
      setCategories(['All', ...response.data]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterQuizzes = () => {
    let filtered = quizzes;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    setFilteredQuizzes(filtered);
  };

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      await quizAPI.deleteQuiz(id);
      setQuizzes(quizzes.filter(q => q._id !== id));
      setDeleteConfirm(null);
      alert('Quiz deleted successfully!');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edit/${id}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <button 
            className="btn-create"
            onClick={() => navigate('/admin/create')}
          >
            + Create New Quiz
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          Manage Quizzes
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
      </div>

      {activeTab === 'quizzes' && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <h3>{quizzes.length}</h3>
              <p>Total Quizzes</p>
            </div>
            <div className="stat-card">
              <h3>{categories.length - 1}</h3>
              <p>Categories</p>
            </div>
            <div className="stat-card">
              <h3>{quizzes.filter(q => q.difficulty === 'Basic').length}</h3>
              <p>Basic Level</p>
            </div>
            <div className="stat-card">
              <h3>{quizzes.filter(q => q.difficulty === 'Intermediate').length}</h3>
              <p>Intermediate Level</p>
            </div>
            <div className="stat-card">
              <h3>{quizzes.filter(q => q.difficulty === 'Hard').length}</h3>
              <p>Hard Level</p>
            </div>
          </div>

          <div className="admin-filters">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Difficulty:</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="quizzes-table">
            <h2>Manage Quizzes ({filteredQuizzes.length})</h2>
            {filteredQuizzes.length === 0 ? (
              <p className="no-quizzes">No quizzes found. Create your first quiz!</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Options</th>
                    <th>Correct Answer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuizzes.map((quiz) => (
                    <tr key={quiz._id}>
                      <td className="question-cell">{quiz.question}</td>
                      <td>{quiz.category}</td>
                      <td>
                        <span className={`badge badge-${quiz.difficulty.toLowerCase()}`}>
                          {quiz.difficulty}
                        </span>
                      </td>
                      <td className="options-cell">
                        {quiz.options.map((opt, idx) => (
                          <div key={idx}>{String.fromCharCode(65 + idx)}: {opt}</div>
                        ))}
                      </td>
                      <td className="correct-answer">
                        {String.fromCharCode(65 + quiz.correctAnswer)}
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(quiz._id)}
                        >
                          Edit
                        </button>
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

      {activeTab === 'users' && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <h3>{users.length}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-card">
              <h3>{users.filter(u => u.role === 'admin').length}</h3>
              <p>Admins</p>
            </div>
            <div className="stat-card">
              <h3>{users.filter(u => u.role === 'user').length}</h3>
              <p>Regular Users</p>
            </div>
          </div>

          <div className="users-table">
            <h2>All Users ({users.length})</h2>
            {users.length === 0 ? (
              <p className="no-users">No users found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>
                        <span className={`badge badge-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
