require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');

const connectDatabase = require('./config/database');

const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const quizRoutes = require('./routes/quizRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3010;
const isProduction = process.env.NODE_ENV === 'production';

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('user:join', (userId) => {
    if (userId) {
      userSockets.set(String(userId), socket.id);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('userSockets', userSockets);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'buzzmind-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(express.static(path.join(__dirname, 'public')));

app.use(pageRoutes);
app.use('/api/auth', authRoutes);
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

connectDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`BuzzMind running at http://localhost:${port}/`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

module.exports = { app, server, io, userSockets };
