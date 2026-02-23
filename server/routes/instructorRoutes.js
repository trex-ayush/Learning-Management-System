const express = require('express');
const router = express.Router();
const {
    becomeInstructor,
    getInstructorDashboard,
    getInstructorCourses,
    createMarketplaceCourse,
    updateMarketplaceCourse,
    getInstructorProfile,
    updateInstructorProfile,
    getCourseSales
} = require('../controllers/instructorController');
const { protect, instructorOnly } = require('../middleware/authMiddleware');

// Become instructor (available to students)
router.post('/become', protect, becomeInstructor);

// Instructor-only routes
router.get('/dashboard', protect, instructorOnly, getInstructorDashboard);
router.get('/courses', protect, instructorOnly, getInstructorCourses);
router.post('/course', protect, instructorOnly, createMarketplaceCourse);
router.put('/course/:id', protect, instructorOnly, updateMarketplaceCourse);
router.get('/course/:id/sales', protect, instructorOnly, getCourseSales);
router.get('/profile', protect, instructorOnly, getInstructorProfile);
router.put('/profile', protect, instructorOnly, updateInstructorProfile);

module.exports = router;
