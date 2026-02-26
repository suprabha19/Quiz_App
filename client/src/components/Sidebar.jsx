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
  Code2,
  Layout,
  Braces,
  Atom,
  Server,
  Database,
  Coffee,
  Terminal,
  ChevronRight,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import "../styles/Sidebar.css";

const iconMap = {
  HTML: Code2,
  CSS: Layout,
  JavaScript: Braces,
  React: Atom,
  "Node.js": Server,
  Nodejs: Server,
  MongoDB: Database,
  Java: Coffee,
  Python: Terminal,
};

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
      {/* top card */}
      <div className="sidebar-top-card">
        <div className="top-icon">
          <BookOpen size={18} />
        </div>

        <div>
          <h3>QuizSphere</h3>
          <p>Test your knowledge & improve skills</p>
        </div>
      </div>

      <div className="sidebar-nav">
        <button
          className="sidebar-nav-item"
          onClick={() => {
            setSelectedCategory("");
            navigate("/dashboard");
          }}
        >
          🏠 Dashboard
        </button>
        
        <button
          className={`sidebar-nav-item ${isQuizzesExpanded ? "expanded" : ""}`}
          onClick={() => setIsQuizzesExpanded(!isQuizzesExpanded)}
        >
          <span>📝 Quizzes</span>
          {isQuizzesExpanded ? (
            <ChevronDown size={18} className="chevron-icon" />
          ) : (
            <ChevronRight size={18} className="chevron-icon" />
          )}
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
                  onClick={() => {
                    setSelectedCategory(category);
                    navigate("/dashboard");
                  }}
                >
                  {category}
                </button>
              ))
            )}
          </div>
        )}

        <button
          className="sidebar-nav-item"
          onClick={() => navigate("/analytics")}
        >
          📊 Analytics
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => navigate("/history")}
        >
          📋 My History
        </button>
        <button
          className="sidebar-nav-item"
          onClick={() => navigate("/leaderboard")}
        >
          🏆 Leaderboard
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="username">{user.username}</p>
          <span className="role">
            {user.role === "admin" ? "Admin" : "User"}
          </span>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
