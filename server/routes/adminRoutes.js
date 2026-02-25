const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getInstructors,
    getInstructorDetail,
    createPayout,
    getPayouts
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, admin, getAdminDashboard);
router.get('/instructors', protect, admin, getInstructors);
router.get('/instructors/:id', protect, admin, getInstructorDetail);
router.post('/payouts', protect, admin, createPayout);
router.get('/payouts', protect, admin, getPayouts);

module.exports = router;
