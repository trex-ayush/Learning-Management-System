const express = require('express');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const activityLogger = require('./middleware/activityLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/db');
const cors = require('cors');
const https = require('https');
const http = require('http');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

// Trust proxy (required for Render, rate-limiting, and correct client IP)
app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/purchase/webhook',
    express.raw({ type: 'application/json' }),
    require('./controllers/purchaseController').handleStripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check route (no auth, no rate limit)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

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

// AI generation routes
app.use('/api/ai', require('./routes/aiRoutes'));

// Student AI chatbot routes
app.use('/api/student-ai', require('./routes/studentAiRoutes'));

// Admin routes
app.use('/api/admin', require('./routes/adminRoutes'));

// Error handler middleware
app.use((err, req, res, next) => {
    // res.statusCode defaults to 200, so treat 200 as unset (use 500 for errors)
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);

    // Keep-alive: self-ping at random intervals (30s - 120s) to prevent Render cold starts
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_URL) {
        const pingServer = () => {
            const delay = Math.floor(Math.random() * (120000 - 30000 + 1)) + 30000;
            setTimeout(() => {
                const url = `${RENDER_URL}/api/health`;
                const client = url.startsWith('https') ? https : http;
                client.get(url, (res) => {
                    console.log(`[Keep-Alive] Pinged ${url} — Status: ${res.statusCode} (next in ${Math.round(delay / 1000)}s)`);
                }).on('error', (err) => {
                    console.error(`[Keep-Alive] Ping failed:`, err.message);
                });
                pingServer();
            }, delay);
        };
        pingServer();
        console.log('[Keep-Alive] Self-ping enabled for Render');
    }
});
