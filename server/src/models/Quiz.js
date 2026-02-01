import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['React', 'MongoDB', 'Express', 'CSS', 'HTML', 'JavaScript', 'Node.js', 'Java', 'Python']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Basic', 'Intermediate', 'Hard']
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 4;
      },
      message: 'Quiz must have exactly 4 options'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
