require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const connectDatabase = require('./config/database');
const { requirePageAuth } = require('./middleware/auth');
const { createServer } = require('http');
const { Server } = require('socket.io');

const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const quizRoutes = require('./routes/quizRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authenticateToken = require('./middleware/auth').authenticateToken;

const {
  router: authApiRouter,
  registerUser,
  loginUser,
  setRole,
} = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3010;
// ── Socket.IO setup ──
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  //user joins with their userId, this is used to track which socket belongs to which user for sending real-time updates to specific users.
  socket.on('user:join', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });
  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected and removed from userSockets`);
        break;
      }
    }
  });
});
//export for use in other modules like routes to emit events to specific users based on their userId, this allows us to send real-time updates to users when certain actions happen, like a quiz starting or a new message in the class chat.

module.exports = { io, userSockets };
// ── Middleware and routes setup ──

app.set('io', io);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../'));
app.use(express.static(path.join(__dirname, '../')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'buzzmind-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  }),
);

// ── Page routes ──
app.get('/', (req, res) => {
  res.render('index', { error: req.query.error });
});

app.get('/role', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.render('RolePage/RolePage', { error: req.query.error });
});

app.post('/set-role', setRole);
app.post('/', registerUser);
app.post('/login', loginUser);

app.get('/professor', requirePageAuth('professor'), (req, res, next) => {
  const filePath = path.resolve(
    __dirname,
    '..',
    'Prof page',
    'Classes page',
    'professor2.html',
  );
  console.log('Serving professor page via fs:', filePath);
  console.log('Session:', req.session);
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.error('professor fs.readFile error:', err);
      return next(err);
    }
    res.type('html').send(content);
  });
});

app.get('/student', requirePageAuth('student'), (req, res, next) => {
  const filePath = path.resolve(
    __dirname,
    '..',
    'Student pages',
    'Home Page',
    'Index.html',
  );
  console.log('Serving student page via fs:', filePath);
  console.log('student absolute?', path.isAbsolute(filePath));
  try {
    const real = fs.realpathSync(filePath);
    console.log('student realpath:', real);
  } catch (realErr) {
    console.error('student realpath error:', realErr);
  }
  console.log('Session:', req.session);
  console.log('student file exists:', fs.existsSync(filePath));
  try {
    const stat = fs.statSync(filePath);
    console.log('student file stat:', {
      isFile: stat.isFile(),
      size: stat.size,
    });
  } catch (fsErr) {
    console.error('student file stat error:', fsErr);
  }
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.error('student fs.readFile error:', err);
      return next(err);
    }
    res.type('html').send(content);
  });
});

app.get('/admin', requirePageAuth('admin'), (req, res, next) => {
  const filePath = path.resolve(
    __dirname,
    '..',
    'Admin pages',
    'Home page',
    'Admin Home.html',
  );
  console.log('Serving admin page via fs:', filePath);
  console.log('Session:', req.session);
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.error('admin fs.readFile error:', err);
      return next(err);
    }
    res.type('html').send(content);
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ── REST API ──
app.use('/api/auth', authApiRouter);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack || err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.status(500).send(err.message || 'Error');
});

// Start server after connecting to database
connectDatabase()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`BuzzMind running at http://localhost:${port}/`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
