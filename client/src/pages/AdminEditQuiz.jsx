import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizAPI } from '../services/api';
import '../styles/Admin.css';

const AdminEditQuiz = () => {
  const [formData, setFormData] = useState({
    category: '',
    difficulty: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  const difficulties = ['Basic', 'Intermediate', 'Hard'];
  const predefinedCategories = ['General Knowledge', 'Science', 'History', 'Sports', 'Technology'];

  useEffect(() => {
    fetchQuiz();
    fetchCategories();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const response = await quizAPI.getQuizById(id);
      const quiz = response.data;
      setFormData({
        category: quiz.category,
        difficulty: quiz.difficulty,
        question: quiz.question,
        options: quiz.options,
        correctAnswer: quiz.correctAnswer
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await quizAPI.getCategories();
      const allCategories = [...new Set([...predefinedCategories, ...response.data])];
      setCategories(allCategories);
    } catch (error) {
      setCategories(predefinedCategories);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const validateForm = () => {
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.difficulty) {
      setError('Please select a difficulty level');
      return false;
    }
    if (!formData.question.trim()) {
      setError('Please enter a question');
      return false;
    }
    if (formData.options.some(opt => !opt.trim())) {
      setError('Please fill in all 4 options');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await quizAPI.updateQuiz(id, formData);
      alert('Quiz updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating quiz:', error);
      setError(error.response?.data?.message || 'Failed to update quiz');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Edit Quiz</h1>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/admin')}
        >
          Back to Admin Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-section">
          <h3>Quiz Information</h3>
          
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              disabled={submitting}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level *</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              disabled={submitting}
              required
            >
              <option value="">Select difficulty</option>
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Question</h3>
          
          <div className="form-group">
            <label htmlFor="question">Question Text *</label>
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Enter your question here"
              rows="4"
              disabled={submitting}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Answer Options</h3>
          
          {formData.options.map((option, index) => (
            <div key={index} className="form-group option-group">
              <label htmlFor={`option${index}`}>
                Option {String.fromCharCode(65 + index)} *
              </label>
              <div className="option-input-group">
                <input
                  type="text"
                  id={`option${index}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                  disabled={submitting}
                  required
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  value={index}
                  checked={formData.correctAnswer === index}
                  onChange={() => setFormData({ ...formData, correctAnswer: index })}
                  disabled={submitting}
                />
                <label className="radio-label">Correct</label>
              </div>
            </div>
          ))}
          
          <p className="form-hint">Select the radio button next to the correct answer</p>
        </div>

        <div className="form-actions">
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/admin')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditQuiz;
