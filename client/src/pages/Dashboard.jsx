import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { quizAPI } from "../services/api";
import "../styles/Dashboard.css";
import { Medal, Star, Zap, Target, Stars } from "lucide-react";

const Dashboard = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [quizCount, setQuizCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const difficulties = ["Basic", "Intermediate", "Hard"];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedDifficulty) {
      fetchQuizCount();
    }
  }, [selectedCategory, selectedDifficulty]);

  const fetchCategories = async () => {
    try {
      const response = await quizAPI.getCategories();
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  const fetchQuizCount = async () => {
    try {
      const response = await quizAPI.getQuizzesByFilter(
        selectedCategory,
        selectedDifficulty,
      );
      setQuizCount(response.data.length);
    } catch (error) {
      console.error("Error fetching quiz count:", error);
    }
  };

  const handleStartQuiz = () => {
    if (selectedCategory && selectedDifficulty) {
      navigate("/quiz", {
        state: {
          category: selectedCategory,
          difficulty: selectedDifficulty,
        },
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="main-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.username}!</h1>
          {isAdmin && (
            <button className="btn-admin" onClick={() => navigate("/admin")}>
              Admin Panel
            </button>
          )}
        </div>
        {/* <div className="welcome-card">
          <div className="welcome-icon">🏅</div>

          <h2 className="welcome-title">Welcome to Tech Quiz Master</h2>

          <p className="welcome-subtitle">
            Select a technology from the sidebar to start your quiz journey.
            Test your knowledge at basic, intermediate, or advanced levels.
          </p>

          <div className="welcome-features">
            <div className="feature-box">
              ⭐<h4>Multiple Technologies</h4>
              <p>HTML, CSS, JavaScript, React and more</p>
            </div>

            <div className="feature-box">
              ⚡<h4>Three Difficulty Levels</h4>
              <p>Basic, Intermediate and Hard challenges</p>
            </div>

            <div className="feature-box">
              🎯
              <h4>Instant Feedback</h4>
              <p>Get detailed results and performance analysis</p>
            </div>
          </div>

          <div className="welcome-footer">
            ✨ Select any technology to begin your learning adventure!
          </div>
        </div> */}

        <div className="quiz-selection">
          {/* <h2>Select Your Quiz</h2> */}

          {!selectedCategory ? (
            // <div className="instruction">
            //   <p>👈 Please select a category from the sidebar</p>
            // </div>
            <div className="welcome-card">
              <div className="welcome-icon">
                <Medal size={30} />
              </div>

              <h2 className="welcome-title">Welcome to Tech QuizSphere</h2>

              <p className="welcome-subtitle">
                Select a technology from the sidebar to start your quiz journey.
                Test your knowledge at basic, intermediate, or advanced levels.
              </p>

              <div className="welcome-features">
                <div className="feature-box">
                  <Star color="black" size={18} />
                  <h4>Multiple Technologies</h4>
                  <p>HTML, CSS, JavaScript, React and more</p>
                </div>

                <div className="feature-box">
                  <Zap color="black" size={18} />
                  <h4>Three Difficulty Levels</h4>
                  <p>Basic, Intermediate and Hard challenges</p>
                </div>

                <div className="feature-box">
                  <Target color="black" size={18} />
                  <h4>Instant Feedback</h4>
                  <p>Get detailed results and performance analysis</p>
                </div>
              </div>

              <div className="welcome-footer">
                <Stars size={14} />
                Select any technology to begin your learning adventure!
              </div>
            </div>
          ) : (
            <>
              <div className="selected-category">
                <h3>Category: {selectedCategory}</h3>
              </div>

              <div className="difficulty-selection">
                <h3>Select Difficulty Level:</h3>
                <div className="difficulty-buttons">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      className={`btn-difficulty ${selectedDifficulty === difficulty ? "active" : ""}`}
                      onClick={() => setSelectedDifficulty(difficulty)}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDifficulty && (
                <div className="quiz-info">
                  <p className="quiz-count">
                    {quizCount > 0
                      ? `${quizCount} question${quizCount !== 1 ? "s" : ""} available`
                      : "No questions available for this selection"}
                  </p>
                  {quizCount > 0 && (
                    <button
                      className="btn-start-quiz"
                      onClick={handleStartQuiz}
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
