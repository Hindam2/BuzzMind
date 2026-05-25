const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  displayName: { type: String, required: true, trim: true },
  score: { type: Number, default: 0 },
  answers: [
    {
      questionIndex: Number,
      answerIndex: Number,
      correct: Boolean,
      answeredAt: { type: Date, default: Date.now },
    },
  ],
});

const gameSessionSchema = new mongoose.Schema(
  {
    pin: { type: String, required: true, unique: true, length: 6 },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'finished'],
      default: 'waiting',
    },
    currentQuestionIndex: { type: Number, default: 0 },
    questionOpen: { type: Boolean, default: false },
    players: [playerSchema],
    launchedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('GameSession', gameSessionSchema);
