const express = require('express');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const activityLogger = require('./middleware/activityLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/db');
const cors = require('cors');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/purchase/webhook',
    express.raw({ type: 'application/json' }),
    require('./controllers/purchaseController').handleStripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Activity Logger - Tracks non-GET requests
app.use(activityLogger);

// Existing routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/broadcasts', require('./routes/broadcastRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));

// Marketplace routes
app.use('/api/marketplace', require('./routes/marketplaceRoutes'));
app.use('/api/purchase', require('./routes/purchaseRoutes'));
app.use('/api/instructor', require('./routes/instructorRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Error handler middleware - need to create this file too
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

app.listen(port, () => console.log(`Server started on port ${port}`));

