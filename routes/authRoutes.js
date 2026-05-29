const express = require('express');

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/logout', authController.logoutApi);

module.exports = router;
