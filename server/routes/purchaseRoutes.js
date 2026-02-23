const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    handleStripeWebhook,
    getMyPurchases,
    verifyPurchase,
    getSessionStatus
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');

// Stripe webhook (must be before JSON body parser in main app)
// Note: This route is mounted separately in index.js with raw body parser
router.post('/webhook', handleStripeWebhook);

// Protected routes
router.post('/checkout', protect, createCheckoutSession);
router.get('/my-purchases', protect, getMyPurchases);
router.get('/verify/:courseId', protect, verifyPurchase);
router.get('/session/:sessionId', protect, getSessionStatus);

module.exports = router;
