const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updatePassword,
    googleAuth,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
