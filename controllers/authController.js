
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');

function destroySession(req, onDone) {
  if (!req.session) {
    onDone();
    return;
  }

  req.session.destroy(() => onDone());
}

function getCurrentUser(req, res) {
  res.json({
    id: req.user._id,
    name: req.user.Name,
    username: req.user.Username,
    email: req.user.Email,
    role: req.user.Role,
    department: req.user.Department,
    emoji: req.user.Emoji,
  });
}

function logoutApi(req, res) {
  destroySession(req, () => {
    res.json({ success: true });
  });
}

function logoutPage(req, res) {
  destroySession(req, () => {
    res.redirect('/');
  });
}

function redirectWithSession(req, res, target) {
  if (!req.session) {
    res.redirect(target);
    return;
  }

  req.session.save((err) => {
    if (err) {
      console.error('Error saving session:', err);
      res.status(500).send('Error');
      return;
    }
    res.redirect(target);
  });
}

async function registerUser(req, res) {
  try {
    const { Name, Username, Password, Email } = req.body;
    const existingUser = await User.findOne({
      $or: [{ Email }, { Username }],
    });

    if (existingUser) {
      return res.redirect('/?error=user_exists');
    }

    const hashedPassword = await hashPassword(Password);
    const user = await User.create({
      Name,
      Username,
      Password: hashedPassword,
      Email,
    });

    req.session.userId = user._id.toString();
    req.session.role = user.Role;
    redirectWithSession(req, res, '/role');
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

    if (user.Role === 'professor')
      return redirectWithSession(req, res, '/professor');
    if (user.Role === 'student')
      return redirectWithSession(req, res, '/student');
    if (user.Role === 'admin') return redirectWithSession(req, res, '/admin');

    redirectWithSession(req, res, '/role');
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error');
  }
}

async function setRole(req, res) {
  if (!req.session.userId) {
    return res.redirect('/');
  }

  try {
    const { role } = req.body;

    if (!role || !['professor', 'student', 'admin'].includes(role)) {
      return res.redirect('/role?error=missing_role');
    }

    await User.findByIdAndUpdate(req.session.userId, { Role: role });
    req.session.role = role;

    if (role === 'professor')
      return redirectWithSession(req, res, '/professor');
    if (role === 'student') return redirectWithSession(req, res, '/student');
    if (role === 'admin') return redirectWithSession(req, res, '/admin');

    redirectWithSession(req, res, '/');
  } catch (error) {
    console.error('Error setting role:', error);
    res.status(500).send('Error');
  }
}

module.exports = {
  getCurrentUser,
  loginUser,
  logoutApi,
  logoutPage,
  registerUser,
  setRole,
};
