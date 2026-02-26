import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, User, ChevronDown } from 'lucide-react';
import '../styles/TopBar.css';

const TopBar = () => {
  const { user } = useAuth();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDetails(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-search">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search quizzes, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="topbar-user" ref={dropdownRef}>
        <button
          className="user-button"
          onClick={() => setShowUserDetails(!showUserDetails)}
        >
          <div className="user-avatar">
            <User size={20} />
          </div>
          <span className="user-name">{user.username}</span>
          <ChevronDown size={16} className={`dropdown-arrow ${showUserDetails ? 'open' : ''}`} />
        </button>

        {showUserDetails && (
          <div className="user-details-dropdown">
            <div className="user-details-header">
              <div className="user-avatar-large">
                <User size={32} />
              </div>
              <div className="user-details-info">
                <p className="user-details-name">{user.username}</p>
                <p className="user-details-role">
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
            </div>
            <div className="user-details-body">
              <div className="user-detail-item">
                <span className="detail-label">Account ID:</span>
                <span className="detail-value">{user._id}</span>
              </div>
              <div className="user-detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user.email || 'Not provided'}</span>
              </div>
              <div className="user-detail-item">
                <span className="detail-label">Member Since:</span>
                <span className="detail-value">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
