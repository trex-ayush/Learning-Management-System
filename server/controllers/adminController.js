const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Course = require('../models/Course');
const Purchase = require('../models/Purchase');
const Payout = require('../models/Payout');
const BankDetail = require('../models/BankDetail');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalInstructors,
        totalStudents,
        totalCourses,
        publishedCourses,
        revenueResult,
        totalPayoutsResult,
        recentPurchases,
        recentPayouts
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'instructor' }),
        User.countDocuments({ role: 'student' }),
        Course.countDocuments({ isMarketplace: true }),
        Course.countDocuments({ isMarketplace: true, status: 'Published' }),
        Purchase.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Payout.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Purchase.find({ status: 'completed' })
            .populate('user', 'name email')
            .populate('course', 'title')
            .populate('instructor', 'name')
            .sort({ purchasedAt: -1 })
            .limit(10),
        Payout.find()
            .populate('instructor', 'name email')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
    ]);

    const revenue = revenueResult[0] || { total: 0, count: 0 };
    const totalPaidOut = totalPayoutsResult[0]?.total || 0;

    res.status(200).json({
        stats: {
            totalUsers,
            totalInstructors,
            totalStudents,
            totalCourses,
            publishedCourses,
            totalRevenue: revenue.total,
            totalSales: revenue.count,
            totalPaidOut,
            pendingPayout: revenue.total - totalPaidOut
        },
        recentPurchases,
        recentPayouts
    });
});

// @desc    Get all instructors with their earnings
// @route   GET /api/admin/instructors
// @access  Private (Admin)
const getInstructors = asyncHandler(async (req, res) => {
    const instructors = await User.find({ role: 'instructor' })
        .select('name email bio profileImage createdAt')
        .sort({ createdAt: -1 });

    // Get earnings and payout data for each instructor
    const instructorData = await Promise.all(
        instructors.map(async (instructor) => {
            const [earningsResult, payoutResult, courseCount, bankDetail] = await Promise.all([
                Purchase.aggregate([
                    { $match: { instructor: instructor._id, status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' }, sales: { $sum: 1 } } }
                ]),
                Payout.aggregate([
                    { $match: { instructor: instructor._id, status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                Course.countDocuments({ user: instructor._id, isMarketplace: true }),
                BankDetail.findOne({ user: instructor._id })
            ]);

            const earnings = earningsResult[0] || { total: 0, sales: 0 };
            const paidOut = payoutResult[0]?.total || 0;

            return {
                ...instructor.toObject(),
                totalEarnings: earnings.total,
                totalSales: earnings.sales,
                totalPaidOut: paidOut,
                pendingAmount: earnings.total - paidOut,
                courseCount,
                hasBankDetails: !!bankDetail,
                preferredMethod: bankDetail?.preferredMethod || null
            };
        })
    );

    res.status(200).json(instructorData);
});

// @desc    Get instructor detail with bank info (admin view)
// @route   GET /api/admin/instructors/:id
// @access  Private (Admin)
const getInstructorDetail = asyncHandler(async (req, res) => {
    const instructor = await User.findById(req.params.id).select('-password');
    if (!instructor || instructor.role !== 'instructor') {
        res.status(404);
        throw new Error('Instructor not found');
    }

    const [bankDetail, earningsResult, payoutResult, courses, payouts] = await Promise.all([
        BankDetail.findOne({ user: instructor._id }),
        Purchase.aggregate([
            { $match: { instructor: instructor._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, sales: { $sum: 1 } } }
        ]),
        Payout.aggregate([
            { $match: { instructor: instructor._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Course.find({ user: instructor._id, isMarketplace: true }).select('title price enrollmentCount status'),
        Payout.find({ instructor: instructor._id })
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(20)
    ]);

    const earnings = earningsResult[0] || { total: 0, sales: 0 };
    const paidOut = payoutResult[0]?.total || 0;

    res.status(200).json({
        instructor: instructor.toObject(),
        bankDetail,
        totalEarnings: earnings.total,
        totalSales: earnings.sales,
        totalPaidOut: paidOut,
        pendingAmount: earnings.total - paidOut,
        courses,
        payouts
    });
});

// @desc    Create a payout for instructor
// @route   POST /api/admin/payouts
// @access  Private (Admin)
const createPayout = asyncHandler(async (req, res) => {
    const { instructorId, amount, method, transactionId, note } = req.body;

    if (!instructorId || !amount || !method) {
        res.status(400);
        throw new Error('Please provide instructor, amount, and method');
    }

    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
        res.status(404);
        throw new Error('Instructor not found');
    }

    // Verify amount doesn't exceed pending
    const [earningsResult, payoutResult] = await Promise.all([
        Purchase.aggregate([
            { $match: { instructor: instructor._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payout.aggregate([
            { $match: { instructor: instructor._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
    ]);

    const totalEarnings = earningsResult[0]?.total || 0;
    const totalPaid = payoutResult[0]?.total || 0;
    const pending = totalEarnings - totalPaid;

    if (amount > pending) {
        res.status(400);
        throw new Error(`Amount exceeds pending balance of ₹${pending}`);
    }

    const payout = await Payout.create({
        instructor: instructorId,
        amount,
        method,
        transactionId: transactionId || '',
        note: note || '',
        status: 'completed',
        processedBy: req.user.id,
        processedAt: new Date()
    });

    await payout.populate('instructor', 'name email');
    await payout.populate('processedBy', 'name');

    res.status(201).json(payout);
});

// @desc    Get all payouts
// @route   GET /api/admin/payouts
// @access  Private (Admin)
const getPayouts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, instructorId } = req.query;
    const query = {};
    if (instructorId) query.instructor = instructorId;

    const [payouts, total] = await Promise.all([
        Payout.find(query)
            .populate('instructor', 'name email')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit)),
        Payout.countDocuments(query)
    ]);

    res.status(200).json({
        payouts,
        total,
        pages: Math.ceil(total / limit),
        page: Number(page)
    });
});

module.exports = {
    getAdminDashboard,
    getInstructors,
    getInstructorDetail,
    createPayout,
    getPayouts
};
