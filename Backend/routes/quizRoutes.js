const express = require('express');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const { generatePin } = require('../utils/pin');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/library', async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ status: 'published' })
      .populate('professor', 'Name Department')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(
      quizzes.map((q) => ({
        id: q._id,
        title: q.title,
        questionCount: q.questions.length,
        professorName: q.professor?.Name || 'Unknown',
        createdAt: q.createdAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.get('/', requireRole('professor'), async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ professor: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('professor'), async (req, res, next) => {
  try {
    const { title, questions, totalTime, classId, status } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }
    for (const q of questions) {
      if (!q.text?.trim() || !Array.isArray(q.answers) || q.answers.length !== 4) {
        return res.status(400).json({ error: 'Each question needs text and 4 answers' });
      }
      if (q.correctIndex < 0 || q.correctIndex > 3) {
        return res.status(400).json({ error: 'Invalid correct answer index' });
      }
    }
    const quiz = await Quiz.create({
      title: title.trim(),
      professor: req.user._id,
      classId: classId || null,
      totalTime: totalTime || 20,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        imageUrl: q.imageUrl || null,
        answers: q.answers.map((a) => String(a).trim()),
        correctIndex: q.correctIndex,
      })),
      status: status || 'published',
    });
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const isOwner =
      req.user.Role === 'professor' &&
      quiz.professor.toString() === req.user._id.toString();
    if (!isOwner && quiz.status !== 'published') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('professor'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { title, questions, totalTime, status } = req.body;
    if (title) quiz.title = title.trim();
    if (totalTime) quiz.totalTime = totalTime;
    if (status) quiz.status = status;
    if (questions) quiz.questions = questions;

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('professor'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/launch', requireRole('professor'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let pin;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 20) {
      pin = generatePin();
      exists = await GameSession.findOne({ pin, status: { $ne: 'finished' } });
      attempts++;
    }
    if (exists) {
      return res.status(500).json({ error: 'Could not generate unique PIN' });
    }

    const session = await GameSession.create({
      pin,
      quiz: quiz._id,
      professor: req.user._id,
      status: 'waiting',
    });

    res.status(201).json({
      sessionId: session._id,
      pin: session.pin,
      quizTitle: quiz.title,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
