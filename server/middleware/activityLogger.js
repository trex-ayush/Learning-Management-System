const Activity = require('../models/Activity');

const activityLogger = async (req, res, next) => {
    // We use 'finish' to ensure we capture the outcome and any user set during the request (e.g. Login)
    res.on('finish', async () => {
        try {
            // 1. Only log state-changing methods
            if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                return;
            }

            // 2. Identify User
            // check req.user (from protect middleware) OR res.locals.user (from authController)
            const user = req.user || res.locals.user;
            if (!user) return; // Don't log anonymous actions

            const userId = user._id || user.id;

            // 3. Prepare Event Data (Body)
            let eventData = { ...req.body };

            // Sanitize sensitive fields
            if (eventData.password) delete eventData.password;
            if (eventData.token) delete eventData.token;

            const url = req.originalUrl;

            // 4. Determine Action Context (heuristic)
            let action = '';
            let details = '';
            let lectureId = null;

            // Auth
            if (url.includes('/login')) { action = 'Login'; details = 'User logged in'; }
            else if (url.includes('/register')) { action = 'Registered'; details = 'User registered'; }
            else if (url.includes('/updatepassword')) { action = 'Password Updated'; details = 'User updated password'; }
            // Course management
            else if (url.includes('/enroll') && req.method === 'DELETE') { action = 'Unenrolled'; }
            else if (url.includes('/enroll')) { action = 'Enrolled'; }
            else if (url.includes('/comments')) { action = 'Comment'; }
            else if (url.match(/\/lectures\/[a-f0-9]{24}\/progress/i)) { action = 'Status Updated'; }
            else if (url.match(/\/lectures\/[a-f0-9]{24}$/i) && req.method === 'PUT') { action = 'Lecture Updated'; }
            else if (url.match(/\/lectures\/[a-f0-9]{24}$/i) && req.method === 'DELETE') { action = 'Lecture Deleted'; }
            else if (url.match(/\/sections\/[a-f0-9]{24}\/lectures/i)) { action = 'Lecture Added'; }
            else if (url.match(/\/sections\/[a-f0-9]{24}$/i) && req.method === 'PUT') { action = 'Section Updated'; }
            else if (url.match(/\/sections\/[a-f0-9]{24}$/i) && req.method === 'DELETE') { action = 'Section Deleted'; }
            else if (url.match(/\/sections$/i) && req.method === 'POST') { action = 'Section Added'; }
            else if (url.match(/\/courses\/[a-f0-9]{24}$/i) && req.method === 'PUT') { action = 'Course Updated'; }
            else if (url.match(/\/courses\/[a-f0-9]{24}$/i) && req.method === 'DELETE') { action = 'Course Deleted'; }
            else if (url.match(/\/courses$/i) && req.method === 'POST') { action = 'Course Created'; }
            // Teachers
            else if (url.includes('/teachers') && req.method === 'POST') { action = 'Teacher Added'; }
            else if (url.includes('/teachers/leave')) { action = 'Teacher Left'; }
            else if (url.includes('/teachers') && req.method === 'DELETE') { action = 'Teacher Removed'; }
            else if (url.includes('/teachers') && req.method === 'PUT') { action = 'Teacher Updated'; }
            // Broadcasts
            else if (url.includes('/broadcasts') && url.includes('/mark-read')) { action = 'Broadcast Read'; }
            else if (url.includes('/broadcasts') && url.includes('/settings')) { action = 'Broadcast Settings'; }
            else if (url.includes('/broadcasts') && req.method === 'POST') { action = 'Broadcast Created'; }
            else if (url.includes('/broadcasts') && req.method === 'PUT') { action = 'Broadcast Updated'; }
            else if (url.includes('/broadcasts') && req.method === 'DELETE') { action = 'Broadcast Deleted'; }
            // Quizzes
            else if (url.includes('/quizzes') && url.includes('/start')) { action = 'Quiz Started'; }
            else if (url.includes('/quizzes') && url.includes('/submit')) { action = 'Quiz Submitted'; }
            else if (url.includes('/quizzes') && req.method === 'POST') { action = 'Quiz Created'; }
            else if (url.includes('/quizzes') && req.method === 'PUT') { action = 'Quiz Updated'; }
            else if (url.includes('/quizzes') && req.method === 'DELETE') { action = 'Quiz Deleted'; }
            // Admin actions
            else if (url.includes('/warn')) { action = 'User Warned'; }
            else if (url.includes('/block') && url.includes('/users')) { action = 'User Blocked'; }
            else if (url.includes('/unblock') && url.includes('/users')) { action = 'User Unblocked'; }
            else if (url.includes('/role')) { action = 'Role Changed'; }
            else if (url.includes('/block') && url.includes('/courses')) { action = 'Course Blocked'; }
            else if (url.includes('/unblock') && url.includes('/courses')) { action = 'Course Unblocked'; }

            // Extract lecture ID from URL pattern /lectures/:id
            const lectureMatch = url.match(/\/lectures\/([a-f0-9]{24})/i);
            if (lectureMatch) lectureId = lectureMatch[1];

            // 5. Construct Log
            const logData = {
                user: userId,
                action: action || req.method,
                method: req.method,
                url: req.originalUrl,
                data: eventData,
                details: details || `Request to ${req.originalUrl}`
            };

            if (lectureId) logData.lecture = lectureId;

            // Link to Course - extract from URL params, body, or parse from URL
            let courseId = req.body?.courseId || req.body?.course || req.params?.id || req.params?.courseId || res.locals.course?._id;

            // Fallback: extract course ID from URL pattern /courses/:id
            if (!courseId && url.includes('/courses/')) {
                const match = url.match(/\/courses\/([a-f0-9]{24})/i);
                if (match) courseId = match[1];
            }

            if (courseId) logData.course = courseId;

            // Override from Controller
            if (res.locals.activity) {
                if (res.locals.activity.skip) return;
                if (res.locals.activity.action) logData.action = res.locals.activity.action;
                if (res.locals.activity.details) logData.details = res.locals.activity.details;
                if (res.locals.activity.course) logData.course = res.locals.activity.course;
                if (res.locals.activity.lecture) logData.lecture = res.locals.activity.lecture;
            }

            await Activity.create(logData);

        } catch (err) {
            console.error('Activity Logger Error:', err.message);
        }
    });

    next();
};

module.exports = activityLogger;
