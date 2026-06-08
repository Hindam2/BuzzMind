const express = require('express');
const GameSession = require('../models/GameSession');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function formatPin(pin) {
  return pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin;
}

function sessionPayload(session, quiz, options = {}) {
  const base = {
    sessionId: session._id,
    pin: session.pin,
    pinFormatted: formatPin(session.pin),
    status: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    questionOpen: session.questionOpen,
    playerCount: session.players.length,
    quizTitle: quiz?.title,
    totalQuestions: quiz?.questions?.length || 0,
    totalTime: quiz?.totalTime || 20,
  };
  if (options.includePlayers) {
    base.players = session.players.map((p) => ({
      id: p._id,
      displayName: p.displayName,
      score: p.score,
    }));
  }
  if (options.includeQuestion && quiz && session.questionOpen) {
    const q = quiz.questions[session.currentQuestionIndex];
    if (q) {
        base.question = {
          index: session.currentQuestionIndex,
          text: q.text,
          imageUrl: q.imageUrl,
          answers: q.answers,
          answerImages: q.answerImages || ['', '', '', ''],
          total: quiz.questions.length,
        };
    }
  }
  if (options.includeCorrect && quiz) {
    const q = quiz.questions[session.currentQuestionIndex];
    if (q) base.correctIndex = q.correctIndex;
  }
  return base;
}

function emitSessionEvent(req, session, eventName, payload) {
  const io = req.app.get('io');
  if (io && session?._id) {
    io.to(`session:${session._id.toString()}`).emit(eventName, payload);
  }
}

router.post('/join', async (req, res, next) => {
  try {
    const pin = String(req.body.pin || '').replace(/\D/g, '');
    let displayName = (req.body.displayName || req.body.name || '').trim();
    const userRole = req.session.role || null;

    if (pin.length !== 6) {
      return res.status(400).json({ error: 'PIN must be 6 digits' });
    }

    // Only use the logged-in account name when the joiner is a student (never professor/admin)
    if (!displayName && req.session.userId && userRole === 'student') {
      const user = await User.findById(req.session.userId).select('Username Name');
      displayName = (user?.Username || user?.Name || '').trim();
    }

    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const session = await GameSession.findOne({ pin, status: { $ne: 'finished' } });
    if (!session) {
      return res.status(404).json({ error: 'Invalid or expired game PIN' });
    }

    const already = session.players.find(
      (p) =>
        p.displayName.toLowerCase() === displayName.toLowerCase() &&
        (!req.session.userId ||
          !p.userId ||
          p.userId.toString() === req.session.userId),
    );
    let playerForResponse = already;
    let joinedPlayer = null;
    if (!already) {
      // Only attach a userId to the player when the requester is an actual student account
      const playerUserId = req.session.userId && userRole === 'student' ? req.session.userId : null;
      session.players.push({
        userId: playerUserId,
        displayName: displayName.slice(0, 50),
        score: 0,
      });
      await session.save();
      joinedPlayer = session.players[session.players.length - 1];
      playerForResponse = joinedPlayer;
      // Notify professor in real-time (if connected via socket.io)
      try {
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        if (io && userSockets) {
          const profSocketId = userSockets.get(String(session.professor));
          if (profSocketId && joinedPlayer) {
            io.to(profSocketId).emit('session:playerJoined', {
              sessionId: session._id.toString(),
              player: {
                id: joinedPlayer._id.toString(),
                displayName: joinedPlayer.displayName,
                score: joinedPlayer.score || 0,
              },
            });
          }
        }
      } catch (e) {
        console.error('Failed to emit playerJoined event', e);
      }
    }
    const quiz = await Quiz.findById(session.quiz);
    if (joinedPlayer) {
      emitSessionEvent(req, session, 'session:playersUpdated', {
        ...sessionPayload(session, quiz, { includePlayers: true }),
        player: {
          id: joinedPlayer._id.toString(),
          displayName: joinedPlayer.displayName,
          score: joinedPlayer.score || 0,
        },
      });
    }
    res.json({
      ...sessionPayload(session, quiz, { includePlayers: true }),
      playerId: playerForResponse?._id,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/pin/:pin', async (req, res, next) => {
  try {
    const pin = String(req.params.pin).replace(/\D/g, '');
    const session = await GameSession.findOne({ pin, status: { $ne: 'finished' } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const quiz = await Quiz.findById(session.quiz).select('title questions totalTime');
    res.json(sessionPayload(session, quiz, { includePlayers: true }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const session = await GameSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const quiz = await Quiz.findById(session.quiz);
    const isProf =
      req.session.role === 'professor' &&
      session.professor.toString() === req.user._id.toString();

    if (isProf) {
      return res.json({
        ...sessionPayload(session, quiz, {
          includePlayers: true,
          includeQuestion: true,
          includeCorrect: true,
        }),
        questions: quiz.questions,
      });
    }

    const player = session.players.find(
      (p) => p.userId && p.userId.toString() === req.user._id.toString(),
    );
    if (!player && req.session.role !== 'admin') {
      return res.status(403).json({ error: 'Not in this session' });
    }

    res.json(
      sessionPayload(session, quiz, {
        includePlayers: false,
        includeQuestion: session.questionOpen,
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:id/quiz', async (req, res, next) => {
  try {
    const session = await GameSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const quiz = await Quiz.findById(session.quiz);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const playerId = req.query.playerId;
    const isProf =
      req.session.userId &&
      session.professor.toString() === req.session.userId.toString();
    const isPlayer =
      playerId && session.players.some((p) => p._id.toString() === playerId);
    const isLoggedInPlayer =
      req.session.userId &&
      session.players.some(
        (p) => p.userId && p.userId.toString() === req.session.userId,
      );

    if (!isProf && !isPlayer && !isLoggedInPlayer && session.status !== 'waiting') {
      return res.status(403).json({ error: 'Not allowed to view this quiz' });
    }

    res.json({
      title: quiz.title,
      totalTime: quiz.totalTime,
      questions: quiz.questions.map((q, i) => ({
        id: i + 1,
        text: q.text,
        imageUrl: q.imageUrl,
        answers: q.answers,
        answerImages: q.answerImages || ['', '', '', ''],
        correctIndex: isProf ? q.correctIndex : undefined,
      })),
      sessionStatus: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      questionOpen: session.questionOpen,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/start', requireAuth, requireRole('professor'), async (req, res, next) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.status = 'active';
    session.currentQuestionIndex = 0;
    session.questionOpen = true;
    await session.save();

    const quiz = await Quiz.findById(session.quiz);
    const studentPayload = sessionPayload(session, quiz, { includeQuestion: true });
    emitSessionEvent(req, session, 'session:started', studentPayload);
    res.json(sessionPayload(session, quiz, { includeQuestion: true, includeCorrect: true }));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/next', requireAuth, requireRole('professor'), async (req, res, next) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const quiz = await Quiz.findById(session.quiz);
    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= quiz.questions.length) {
      session.status = 'finished';
      session.questionOpen = false;
      session.endedAt = new Date();
      await session.save();
      await saveResults(session, quiz);
      const payload = { finished: true, ...sessionPayload(session, quiz) };
      emitSessionEvent(req, session, 'session:ended', payload);
      return res.json(payload);
    }

    session.currentQuestionIndex = nextIndex;
    session.questionOpen = true;
    await session.save();

    emitSessionEvent(req, session, 'session:questionChanged', sessionPayload(session, quiz, {
      includeQuestion: true,
    }));
    res.json(sessionPayload(session, quiz, { includeQuestion: true, includeCorrect: true }));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/end', requireAuth, requireRole('professor'), async (req, res, next) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.status = 'finished';
    session.questionOpen = false;
    session.endedAt = new Date();
    await session.save();

    const quiz = await Quiz.findById(session.quiz);
    await saveResults(session, quiz);

    const leaderboard = buildLeaderboard(session);
    emitSessionEvent(req, session, 'session:ended', {
      finished: true,
      ...sessionPayload(session, quiz),
      leaderboard,
    });
    res.json({ finished: true, leaderboard });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/answer', async (req, res, next) => {
  try {
    const { playerId, answerIndex, displayName } = req.body;
    const session = await GameSession.findById(req.params.id);
    if (!session || session.status !== 'active' || !session.questionOpen) {
      return res.status(400).json({ error: 'Cannot submit answer now' });
    }

    const quiz = await Quiz.findById(session.quiz);
    const qIndex = session.currentQuestionIndex;
    const question = quiz.questions[qIndex];
    if (!question) return res.status(400).json({ error: 'No active question' });

    let player = null;
    if (playerId) player = session.players.id(playerId);
    if (!player && displayName) {
      player = session.players.find(
        (p) => p.displayName.toLowerCase() === displayName.trim().toLowerCase(),
      );
    }
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const already = player.answers.some((a) => a.questionIndex === qIndex);
    if (already) {
      return res.status(400).json({ error: 'Already answered this question' });
    }

    const correct = Number(answerIndex) === question.correctIndex;
    if (correct) player.score += 1000;

    player.answers.push({
      questionIndex: qIndex,
      answerIndex: Number(answerIndex),
      correct,
    });
    await session.save();

    const answeredCount = session.players.filter((p) =>
      p.answers.some((a) => a.questionIndex === qIndex),
    ).length;
    emitSessionEvent(req, session, 'session:answerSubmitted', {
      sessionId: session._id.toString(),
      questionIndex: qIndex,
      playerId: player._id.toString(),
      displayName: player.displayName,
      score: player.score,
      answeredCount,
      totalPlayers: session.players.length,
    });

    res.json({
      correct,
      correctIndex: question.correctIndex,
      score: player.score,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const session = await GameSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ leaderboard: buildLeaderboard(session) });
  } catch (err) {
    next(err);
  }
});

function buildLeaderboard(session) {
  return [...session.players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      name: p.displayName,
      score: p.score,
    }));
}

async function saveResults(session, quiz) {
  const total = quiz.questions.length;
  for (const player of session.players) {
    const correctCount = player.answers.filter((a) => a.correct).length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    let userId = player.userId || null;
    if (!userId && player.displayName) {
      const escaped = String(player.displayName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linked = await User.findOne({
        Role: 'student',
        $or: [
          { Username: new RegExp(`^${escaped}$`, 'i') },
          { Name: new RegExp(`^${escaped}$`, 'i') },
        ],
      }).select('_id');
      userId = linked?._id || null;
    }

    await QuizResult.create({
      userId,
      displayName: player.displayName,
      sessionId: session._id,
      quizId: quiz._id,
      quizTitle: quiz.title,
      score: player.score,
      totalQuestions: total,
      accuracy,
    });
  }
}

module.exports = router;
