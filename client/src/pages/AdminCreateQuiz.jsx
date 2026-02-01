import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import '../styles/Admin.css';

const AdminCreateQuiz = () => {
  const [quizInfo, setQuizInfo] = useState({
    category: '',
    difficulty: ''
  });
  const [questions, setQuestions] = useState([{
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  }]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const difficulties = ['Basic', 'Intermediate', 'Hard'];
  const predefinedCategories = ['React', 'MongoDB', 'Express', 'CSS', 'HTML', 'JavaScript', 'Node.js', 'Java', 'Python'];

  useEffect(() => {
    fetchCategories();
  }, []);

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
    setQuizInfo({
      ...quizInfo,
      [name]: value
    });
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, answerIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].correctAnswer = answerIndex;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, index) => index !== questionIndex);
      setQuestions(newQuestions);
    } else {
      setError('At least one question is required');
    }
  };

  const handleCategorySelect = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewCategory(true);
      setQuizInfo({ ...quizInfo, category: '' });
    } else {
      setShowNewCategory(false);
      setQuizInfo({ ...quizInfo, category: value });
    }
  };

  const handleNewCategory = (e) => {
    const value = e.target.value;
    setNewCategory(value);
    setQuizInfo({ ...quizInfo, category: value });
  };

  const validateForm = () => {
    if (!quizInfo.category) {
      setError('Please select or enter a category');
      return false;
    }
    if (!quizInfo.difficulty) {
      setError('Please select a difficulty level');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Please enter question ${i + 1}`);
        return false;
      }
      if (q.options.some(opt => !opt.trim())) {
        setError(`Please fill in all 4 options for question ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Format questions with category and difficulty
      const formattedQuestions = questions.map(q => ({
        category: quizInfo.category,
        difficulty: quizInfo.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      }));

      await quizAPI.createQuiz({ questions: formattedQuestions });
      alert(`${questions.length} question(s) created successfully!`);
      navigate('/admin');
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError(error.response?.data?.message || 'Failed to create quiz');
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Create New Quiz</h1>
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
              value={showNewCategory ? 'new' : quizInfo.category}
              onChange={handleCategorySelect}
              disabled={loading}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="new">+ Add New Category</option>
            </select>
          </div>

          {showNewCategory && (
            <div className="form-group">
              <label htmlFor="newCategory">New Category Name *</label>
              <input
                type="text"
                id="newCategory"
                value={newCategory}
                onChange={handleNewCategory}
                placeholder="Enter new category name"
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level *</label>
            <select
              id="difficulty"
              name="difficulty"
              value={quizInfo.difficulty}
              onChange={handleInputChange}
              disabled={loading}
              required
            >
              <option value="">Select difficulty</option>
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </div>

        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="form-section question-section">
            <div className="question-header">
              <h3>Question {questionIndex + 1}</h3>
              {questions.length > 1 && (
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={loading}
                >
                  Remove Question
                </button>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor={`question-${questionIndex}`}>Question Text *</label>
              <textarea
                id={`question-${questionIndex}`}
                value={question.question}
                onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                placeholder="Enter your question here"
                rows="4"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Answer Options *</label>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="option-group">
                  <label htmlFor={`q${questionIndex}-option${optionIndex}`}>
                    Option {String.fromCharCode(65 + optionIndex)} *
                  </label>
                  <div className="option-input-group">
                    <input
                      type="text"
                      id={`q${questionIndex}-option${optionIndex}`}
                      value={option}
                      onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                      placeholder={`Enter option ${String.fromCharCode(65 + optionIndex)}`}
                      disabled={loading}
                      required
                    />
                    <input
                      type="radio"
                      name={`correctAnswer-${questionIndex}`}
                      value={optionIndex}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => handleCorrectAnswerChange(questionIndex, optionIndex)}
                      disabled={loading}
                    />
                    <label className="radio-label">Correct</label>
                  </div>
                </div>
              ))}
              <p className="form-hint">Select the radio button next to the correct answer</p>
            </div>
          </div>
        ))}

        <div className="form-section">
          <button 
            type="button"
            className="btn-add-question"
            onClick={addQuestion}
            disabled={loading}
          >
            + Add Another Question
          </button>
        </div>

        <div className="form-actions">
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/admin')}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : `Create ${questions.length} Question(s)`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateQuiz;
