const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { roleHome, safeNextUrl } = require('../utils/rolePaths');

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

function redirectAfterAuth(req, res, user) {
  const nextUrl = safeNextUrl(req.body.next || req.query.next);
  if (nextUrl) {
    return redirectWithSession(req, res, nextUrl);
  }
  if (user.Role === 'professor') return redirectWithSession(req, res, '/professor');
  if (user.Role === 'student') return redirectWithSession(req, res, '/student');
  if (user.Role === 'admin') return redirectWithSession(req, res, '/admin');
  return redirectWithSession(req, res, '/role');
}

function redirectToLoginWithError(req, res, code) {
  const role = req.body.preferredRole || req.query.role || '';
  const roleQs = role ? `&role=${encodeURIComponent(role)}` : '';
  const target = `/login?error=${code}${roleQs}`;

  if (!req.session) {
    return res.redirect(target);
  }
  req.session.destroy(() => res.redirect(target));
}

async function registerUser(req, res) {
  try {
    const { Name, Username, Password, Email, preferredRole } = req.body;

    if (!Name?.trim() || !Username?.trim() || !Password || !Email?.trim()) {
      return redirectToLoginWithError(req, res, 'missing_fields');
    }

    const emailNorm = Email.trim().toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ Email: emailNorm }, { Username: Username.trim() }],
    });

    if (existingUser) {
      if (existingUser.Email === emailNorm) {
        return redirectToLoginWithError(req, res, 'email_exists');
      }
      if (existingUser.Username === Username.trim()) {
        return redirectToLoginWithError(req, res, 'username_exists');
      }
      return redirectToLoginWithError(req, res, 'user_exists');
    }

    const hashedPassword = await hashPassword(Password);
    const userData = {
      Name: Name.trim(),
      Username: Username.trim(),
      Password: hashedPassword,
      Email: emailNorm,
    };

    // If the signup came with a preferred role (from ?role=...), apply it if valid.
    // Only student/professor are self-selectable; admin is never publicly assignable.
    if (preferredRole && ['professor', 'student'].includes(preferredRole)) {
      userData.Role = preferredRole;
    }

    const user = await User.create(userData);

    req.session.userId = user._id.toString();
    req.session.role = user.Role;

    return redirectAfterAuth(req, res, user);
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

    if (!user) {
      return res.redirect('/login?error=user_not_found');
    }

    const passwordMatches = await verifyPassword(password, user.Password);
    if (!passwordMatches) {
      return res.redirect('/login?error=wrong_password');
    }

    if (!user.Password.startsWith('$2')) {
      user.Password = await hashPassword(password);
      await user.save();
    }

    req.session.userId = user._id.toString();
    req.session.role = user.Role;

    return redirectAfterAuth(req, res, user);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Error');
  }
}

async function setRole(req, res) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const { role } = req.body;

    if (!role || !['professor', 'student'].includes(role)) {
      return res.redirect('/role?error=missing_role');
    }

    await User.findByIdAndUpdate(req.session.userId, { Role: role });
    req.session.role = role;

    return redirectAfterAuth(req, res, { Role: role });
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
