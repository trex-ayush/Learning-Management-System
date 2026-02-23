import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaPlus, FaRupeeSign, FaUsers, FaBook, FaChartLine,
    FaEdit, FaTag, FaEye, FaArrowRight
} from 'react-icons/fa';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';

const InstructorDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState({
        courses: [],
        totalCourses: 0,
        totalRevenue: 0,
        totalSales: 0,
        totalStudents: 0,
        recentPurchases: []
    });

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/instructor/dashboard');
            setDashboard(res.data);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Instructor Dashboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Welcome back, {user?.name}!
                        </p>
                    </div>
                    <Link
                        to="/instructor/create-course"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    >
                        <FaPlus />
                        Create Course
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <FaRupeeSign className="text-3xl opacity-80" />
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">Total</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(dashboard.totalRevenue)}</p>
                        <p className="text-sm opacity-80 mt-1">Total Revenue</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <FaChartLine className="text-3xl opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{dashboard.totalSales}</p>
                        <p className="text-sm opacity-80 mt-1">Total Sales</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <FaUsers className="text-3xl opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{dashboard.totalStudents}</p>
                        <p className="text-sm opacity-80 mt-1">Total Students</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <FaBook className="text-3xl opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{dashboard.totalCourses}</p>
                        <p className="text-sm opacity-80 mt-1">Published Courses</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Courses List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Your Courses
                                    </h2>
                                    <Link
                                        to="/instructor/courses"
                                        className="text-indigo-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-1"
                                    >
                                        View all <FaArrowRight className="text-xs" />
                                    </Link>
                                </div>
                            </div>

                            {dashboard.courses.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaBook className="text-2xl text-indigo-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                        No courses yet
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        Create your first course and start earning!
                                    </p>
                                    <Link
                                        to="/instructor/create-course"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                                    >
                                        <FaPlus /> Create Course
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {dashboard.courses.map(course => (
                                        <div key={course._id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                                                        {course.title}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <FaUsers className="text-xs" />
                                                            {course.enrollmentCount} students
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <FaRupeeSign className="text-xs" />
                                                            {course.price}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${course.status === 'Published'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                                            }`}>
                                                            {course.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/instructor/course/${course._id}/edit`)}
                                                        className="p-2 text-slate-500 hover:text-indigo-500 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/instructor/course/${course._id}/coupons`)}
                                                        className="p-2 text-slate-500 hover:text-green-500 transition-colors"
                                                        title="Coupons"
                                                    >
                                                        <FaTag />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/marketplace/course/${course._id}`)}
                                                        className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                                                        title="Preview"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Sales */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    Recent Sales
                                </h2>
                            </div>

                            {dashboard.recentPurchases.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-slate-500 dark:text-slate-400">
                                        No sales yet
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {dashboard.recentPurchases.slice(0, 5).map(purchase => (
                                        <div key={purchase._id} className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 font-medium">
                                                    {purchase.user?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                                        {purchase.user?.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                        {purchase.course?.title}
                                                    </p>
                                                </div>
                                                <span className="text-green-500 font-medium">
                                                    +{formatCurrency(purchase.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboard;
