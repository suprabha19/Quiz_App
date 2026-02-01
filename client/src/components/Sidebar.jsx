import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ categories, selectedCategory, setSelectedCategory }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Quiz Categories</h2>
      </div>
      
      <div className="categories-list">
        {categories.length === 0 ? (
          <p className="no-categories">No categories available</p>
        ) : (
          categories.map((category) => (
            <button
              key={category}
              className={`category-item ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <p><strong>{user.username}</strong></p>
          <p className="user-role">{user.role === 'admin' ? 'Admin' : 'User'}</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
