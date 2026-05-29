const express = require('express');
const User = require('../models/User');
const Class = require('../models/Class');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const { hashPassword } = require('../utils/password');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [professors, students, classes, quizzes, sessions] = await Promise.all([
      User.countDocuments({ Role: 'professor' }),
      User.countDocuments({ Role: 'student' }),
      Class.countDocuments(),
      Quiz.countDocuments(),
      GameSession.countDocuments(),
    ]);
    res.json({ professors, students, classes, quizzes, sessions });
  } catch (err) {
    next(err);
  }
});

router.get('/professors', async (req, res, next) => {
  try {
    const professors = await User.find({ Role: 'professor' }).select('-Password');
    const enriched = await Promise.all(
      professors.map(async (prof) => {
        const classCount = await Class.countDocuments({ professor: prof._id });
        const classes = await Class.find({ professor: prof._id }).select('students');
        const studentCount = classes.reduce((sum, c) => sum + c.students.length, 0);
        return {
          id: prof._id,
          name: prof.Name,
          email: prof.Email,
          username: prof.Username,
          department: prof.Department || 'GENERAL',
          classCount,
          studentCount,
        };
      }),
    );
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.post('/professors', async (req, res, next) => {
  try {
    const { name, email, username, password, department } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const existing = await User.findOne({
      $or: [{ Email: email.toLowerCase() }, { Username: username }],
    });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const baseUsername =
      username?.trim() ||
      email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    let finalUsername = baseUsername;
    let n = 1;
    while (await User.findOne({ Username: finalUsername })) {
      finalUsername = `${baseUsername}${n++}`;
    }

    const prof = await User.create({
      Name: name.trim(),
      Email: email.trim().toLowerCase(),
      Username: finalUsername,
      Password: await hashPassword(password || 'Professor1'),
      Role: 'professor',
      Department: (department || 'GENERAL').toUpperCase(),
    });

    res.status(201).json({
      id: prof._id,
      name: prof.Name,
      email: prof.Email,
      department: prof.Department,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/professors/:id', async (req, res, next) => {
  try {
    const prof = await User.findOneAndDelete({
      _id: req.params.id,
      Role: 'professor',
    });
    if (!prof) return res.status(404).json({ error: 'Professor not found' });
    await Class.deleteMany({ professor: prof._id });
    await Quiz.deleteMany({ professor: prof._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
