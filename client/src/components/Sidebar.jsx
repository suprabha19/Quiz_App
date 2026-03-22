import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, LayoutDashboard, TrendingUp, Activity,
  BarChart2, History, Trophy, LogOut, Play,
} from "lucide-react";
import "../styles/Sidebar.css";

const getInitials = (name = "") => name.trim().slice(0, 2).toUpperCase() || "U";

const Sidebar = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  activeTab,
  setActiveTab,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dashTabs = [
    { id: "overview",  label: "Overview",    Icon: LayoutDashboard },
    { id: "quiz",      label: "Take Quiz",   Icon: Play            },
    { id: "progress",  label: "My Progress", Icon: TrendingUp      },
    { id: "activity",  label: "Activity",    Icon: Activity        },
  ];

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrap">
          <BookOpen size={20} />
        </div>
        <div>
          <h3 className="brand-name">QuizSphere</h3>
          <p className="brand-tagline">User Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {dashTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} className="nav-item-icon" />
            <span>{label}</span>
          </button>
        ))}

        <div className="sidebar-nav-divider" />

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

      {/* Footer */}
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
