import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, FileQuestion, Users, BarChart2, PlusCircle, LogOut, Activity } from 'lucide-react';
import '../styles/AdminSidebar.css';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'quizzes', label: 'Manage Quizzes', icon: FileQuestion },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'results', label: 'User Results', icon: BarChart2 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-brand-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <h3>QuizSphere</h3>
          <p>Admin Panel</p>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`admin-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}

        <div className="admin-nav-divider" />

        <button
          className="admin-nav-item"
          onClick={() => navigate('/admin/create')}
        >
          <PlusCircle size={18} />
          <span>Create Quiz</span>
        </button>

        <button
          className="admin-nav-item"
          onClick={() => navigate('/dashboard')}
        >
          <span>🏠</span>
          <span>User Dashboard</span>
        </button>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <p className="admin-username">{user.username}</p>
          <span className="admin-role-badge">Admin</span>
        </div>
        <button className="admin-btn-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
