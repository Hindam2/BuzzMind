const express = require('express');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.Name,
    username: req.user.Username,
    email: req.user.Email,
    role: req.user.Role,
    department: req.user.Department,
    emoji: req.user.Emoji,
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;

async function registerUser(req, res) {
  try {
    const { Name, Username, Password, Email } = req.body;
    const existingUser = await User.findOne({
      $or: [{ Email }, { Username }],
    });
    if (existingUser) {
      return res.redirect('/?error=user_exists');
    }
    const hashed = await hashPassword(Password);
    const user = await User.create({
      Name,
      Username,
      Password: hashed,
      Email,
    });
    req.session.userId = user._id.toString();
    res.redirect('/role');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error');
  }
}

async function loginUser(req, res) {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({
      $or: [{ Email: emailOrUsername }, { Username: emailOrUsername }],
    });
    if (!user || !(await verifyPassword(password, user.Password))) {
      return res.redirect('/?error=invalid_credentials');
    }
    if (!user.Password.startsWith('$2')) {
      user.Password = await hashPassword(password);
      await user.save();
    }
    req.session.userId = user._id.toString();
    req.session.role = user.Role;
    if (user.Role === 'professor') return res.redirect('/professor');
    if (user.Role === 'student') return res.redirect('/student');
    if (user.Role === 'admin') return res.redirect('/admin');
    res.redirect('/role');
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error');
  }
}

async function setRole(req, res) {
  if (!req.session.userId) return res.redirect('/');
  try {
    const { role } = req.body;
    if (!role || !['professor', 'student', 'admin'].includes(role)) {
      return res.redirect('/role?error=missing_role');
    }
    await User.findByIdAndUpdate(req.session.userId, { Role: role });
    req.session.role = role;
    if (role === 'professor') return res.redirect('/professor');
    if (role === 'student') return res.redirect('/student');
    if (role === 'admin') return res.redirect('/admin');
    res.redirect('/');
  } catch (error) {
    console.error('Error setting role:', error);
    res.status(500).send('Error');
  }
}

module.exports.router = router;
module.exports.registerUser = registerUser;
module.exports.loginUser = loginUser;
module.exports.setRole = setRole;
