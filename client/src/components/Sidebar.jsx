// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import '../styles/Sidebar.css';

// const Sidebar = ({ categories, selectedCategory, setSelectedCategory }) => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <div className="sidebar">
//       <div className="sidebar-header">
//         <h2>Quiz Categories</h2>
//       </div>

//       <div className="categories-list">
//         {categories.length === 0 ? (
//           <p className="no-categories">No categories available</p>
//         ) : (
//           categories.map((category) => (
//             <button
//               key={category}
//               className={`category-item ${selectedCategory === category ? 'active' : ''}`}
//               onClick={() => setSelectedCategory(category)}
//             >
//               {category}
//             </button>
//           ))
//         )}
//       </div>

//       <div className="sidebar-footer">
//         <div className="user-info">
//           <p><strong>{user.username}</strong></p>
//           <p className="user-role">{user.role === 'admin' ? 'Admin' : 'User'}</p>
//         </div>
//         <button className="btn-logout" onClick={handleLogout}>
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronDown,
  LogOut,
  Home,
  BarChart2,
  History,
  Trophy,
  BookOpen,
} from "lucide-react";
import "../styles/Sidebar.css";

const CATEGORY_EMOJI = {
  HTML: "🌐", CSS: "🎨", JavaScript: "⚡", React: "⚛️",
  "Node.js": "🟢", Nodejs: "🟢", MongoDB: "🍃", Java: "☕", Python: "🐍",
};

const getInitials = (name = "") =>
  name.trim().slice(0, 2).toUpperCase() || "U";

const Sidebar = ({ categories, selectedCategory, setSelectedCategory }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isQuizzesExpanded, setIsQuizzesExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrap">
          <BookOpen size={20} />
        </div>
        <div>
          <h3 className="brand-name">QuizSphere</h3>
          <p className="brand-tagline">Level up your knowledge</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <button
          className="sidebar-nav-item"
          onClick={() => { setSelectedCategory(""); navigate("/dashboard"); }}
        >
          <Home size={17} className="nav-item-icon" />
          <span>Dashboard</span>
        </button>

        <button
          className={`sidebar-nav-item ${isQuizzesExpanded ? "expanded" : ""}`}
          onClick={() => setIsQuizzesExpanded(!isQuizzesExpanded)}
        >
          <BookOpen size={17} className="nav-item-icon" />
          <span>Quizzes</span>
          {isQuizzesExpanded
            ? <ChevronDown size={15} className="chevron-icon" />
            : <ChevronRight size={15} className="chevron-icon" />}
        </button>

        {isQuizzesExpanded && (
          <div className="quizzes-subsection">
            {categories.length === 0 ? (
              <p className="no-categories">No categories available</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  className={`subsection-item ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => { setSelectedCategory(category); navigate("/dashboard"); }}
                >
                  <span className="sub-emoji">{CATEGORY_EMOJI[category] || "📚"}</span>
                  {category}
                </button>
              ))
            )}
          </div>
        )}

        <button className="sidebar-nav-item" onClick={() => navigate("/analytics")}>
          <BarChart2 size={17} className="nav-item-icon" />
          <span>Analytics</span>
        </button>
        <button className="sidebar-nav-item" onClick={() => navigate("/history")}>
          <History size={17} className="nav-item-icon" />
          <span>My History</span>
        </button>
        <button className="sidebar-nav-item" onClick={() => navigate("/leaderboard")}>
          <Trophy size={17} className="nav-item-icon" />
          <span>Leaderboard</span>
        </button>
      </nav>

      {/* Footer – user info */}
      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <div className="sidebar-avatar">{getInitials(user.username)}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-username">{user.username}</p>
            <span className="sidebar-role-badge">
              {user.role === "admin" ? "Admin" : "User"}
            </span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
