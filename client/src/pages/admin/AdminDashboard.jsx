import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUsers, FaChalkboardTeacher, FaGraduationCap, FaBook,
    FaRupeeSign, FaChartLine, FaMoneyCheckAlt, FaHistory,
    FaArrowRight, FaExclamationCircle, FaCheckCircle, FaSearch,
    FaBan, FaUnlock, FaExclamationTriangle, FaTimes, FaUserCog, FaChevronDown, FaChevronUp, FaEdit
} from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);
    const [instructors, setInstructors] = useState([]);
    const [instructorSearch, setInstructorSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Payout modal
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bank_transfer', transactionId: '', note: '' });
    const [payoutLoading, setPayoutLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashRes, instRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/instructors')
            ]);
            setDashboard(dashRes.data);
            setInstructors(instRes.data);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

    const openPayoutModal = (instructor) => {
        setSelectedInstructor(instructor);
        setPayoutForm({ amount: '', method: instructor.preferredMethod || 'bank_transfer', transactionId: '', note: '' });
        setShowPayoutModal(true);
    };

    const handlePayout = async (e) => {
        e.preventDefault();
        if (!payoutForm.amount || Number(payoutForm.amount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        setPayoutLoading(true);
        try {
            await api.post('/admin/payouts', {
                instructorId: selectedInstructor._id,
                amount: Number(payoutForm.amount),
                method: payoutForm.method,
                transactionId: payoutForm.transactionId,
                note: payoutForm.note
            });
            toast.success('Payout recorded successfully');
            setShowPayoutModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create payout');
        } finally {
            setPayoutLoading(false);
        }
    };

    const filteredInstructors = instructors.filter(i =>
        i.name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
        i.email.toLowerCase().includes(instructorSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    const stats = dashboard?.stats || {};

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Platform overview and instructor management</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'instructors', label: 'Instructors' },
                        { id: 'payouts', label: 'Payouts' },
                        { id: 'users', label: 'Users' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard icon={FaUsers} label="Total Users" value={stats.totalUsers} color="blue" />
                            <StatCard icon={FaChalkboardTeacher} label="Instructors" value={stats.totalInstructors} color="purple" />
                            <StatCard icon={FaGraduationCap} label="Students" value={stats.totalStudents} color="green" />
                            <StatCard icon={FaBook} label="Courses" value={`${stats.publishedCourses}/${stats.totalCourses}`} color="orange" />
                        </div>

                        {/* Revenue Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <FaRupeeSign className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Revenue</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{stats.totalSales} sales total</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <FaMoneyCheckAlt className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Paid Out</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalPaidOut)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">To all instructors</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <FaExclamationCircle className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Pending Payout</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.pendingPayout)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Owed to instructors</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Purchases */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Recent Sales</h2>
                                    <Link to="/admin/activities" className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                        View all <FaArrowRight className="text-[10px]" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {(dashboard?.recentPurchases || []).slice(0, 5).map(p => (
                                        <div key={p._id} className="px-5 py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {p.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.user?.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.course?.title}</p>
                                            </div>
                                            <span className="text-sm font-medium text-green-600 dark:text-green-400">+{formatCurrency(p.amount)}</span>
                                        </div>
                                    ))}
                                    {(!dashboard?.recentPurchases || dashboard.recentPurchases.length === 0) && (
                                        <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No sales yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Payouts */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Recent Payouts</h2>
                                    <button onClick={() => setActiveTab('payouts')} className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                        View all <FaArrowRight className="text-[10px]" />
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {(dashboard?.recentPayouts || []).map(p => (
                                        <div key={p._id} className="px-5 py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                {p.instructor?.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.instructor?.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {p.method.replace('_', ' ')} &middot; {new Date(p.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`text-sm font-medium ${
                                                p.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {formatCurrency(p.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    {(!dashboard?.recentPayouts || dashboard.recentPayouts.length === 0) && (
                                        <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No payouts yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Instructors Tab */}
                {activeTab === 'instructors' && (
                    <div>
                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative max-w-md">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search instructors..."
                                    value={instructorSearch}
                                    onChange={e => setInstructorSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Instructors Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Instructor</th>
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Courses</th>
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Sales</th>
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Earned</th>
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Paid</th>
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Pending</th>
                                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Bank</th>
                                            <th className="text-right px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {filteredInstructors.map(inst => (
                                            <tr key={inst._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                            {inst.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">{inst.name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{inst.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{inst.courseCount}</td>
                                                <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{inst.totalSales}</td>
                                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(inst.totalEarnings)}</td>
                                                <td className="px-5 py-3 text-green-600 dark:text-green-400">{formatCurrency(inst.totalPaidOut)}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`font-medium ${inst.pendingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {formatCurrency(inst.pendingAmount)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {inst.hasBankDetails ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                            <FaCheckCircle /> Added
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Not added</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {inst.pendingAmount > 0 && (
                                                        <button
                                                            onClick={() => openPayoutModal(inst)}
                                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            Pay
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredInstructors.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                                                    No instructors found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payouts Tab */}
                {activeTab === 'payouts' && (
                    <PayoutsTab formatCurrency={formatCurrency} />
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <UsersTab />
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && selectedInstructor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Record Payout</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Pay {selectedInstructor.name} &middot; Pending: {formatCurrency(selectedInstructor.pendingAmount)}
                            </p>
                        </div>
                        <form onSubmit={handlePayout} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={payoutForm.amount}
                                    onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                    max={selectedInstructor.pendingAmount}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Method</label>
                                <select
                                    value={payoutForm.method}
                                    onChange={e => setPayoutForm({ ...payoutForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="upi">UPI</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Transaction ID</label>
                                <input
                                    type="text"
                                    value={payoutForm.transactionId}
                                    onChange={e => setPayoutForm({ ...payoutForm, transactionId: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Optional reference ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note</label>
                                <input
                                    type="text"
                                    value={payoutForm.note}
                                    onChange={e => setPayoutForm({ ...payoutForm, note: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Optional note"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPayoutModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={payoutLoading}
                                    className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {payoutLoading ? 'Processing...' : 'Record Payout'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Stat card component
const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

// Payouts tab component
const PayoutsTab = ({ formatCurrency }) => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPayouts();
    }, [page]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/payouts', { params: { page, limit: 15 } });
            setPayouts(res.data.payouts);
            setTotalPages(res.data.pages);
        } catch {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading payouts...</div>;
    }

    if (payouts.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <FaHistory className="text-3xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No payouts recorded yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Instructor</th>
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Amount</th>
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Method</th>
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Transaction ID</th>
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Processed By</th>
                            <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {payouts.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-slate-900 dark:text-white">{p.instructor?.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.instructor?.email}</p>
                                </td>
                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(p.amount)}</td>
                                <td className="px-5 py-3 text-slate-700 dark:text-slate-300 capitalize">{p.method.replace('_', ' ')}</td>
                                <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.transactionId || '-'}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                        p.status === 'completed'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                            : p.status === 'pending'
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    }`}>
                                        {p.status === 'completed' && <FaCheckCircle />}
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{p.processedBy?.name || '-'}</td>
                                <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

// Users management tab
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    // Warn modal
    const [warnModal, setWarnModal] = useState({ open: false, user: null });
    const [warnReason, setWarnReason] = useState('');
    const [warnLoading, setWarnLoading] = useState(false);

    // Block modal
    const [blockModal, setBlockModal] = useState({ open: false, user: null });
    const [blockReason, setBlockReason] = useState('');
    const [hideCourses, setHideCourses] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);

    // Expanded warnings per user
    const [expandedWarnings, setExpandedWarnings] = useState({});
    // Inline max-warnings editing
    const [editMaxWarnings, setEditMaxWarnings] = useState({});
    const [maxWarningsInput, setMaxWarningsInput] = useState({});

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === 'all' ||
            (filter === 'students' && u.role === 'student') ||
            (filter === 'instructors' && u.role === 'instructor') ||
            (filter === 'blocked' && u.isBlocked) ||
            (filter === 'warned' && (u.warnings?.length > 0) && !u.isBlocked);
        return matchSearch && matchFilter;
    });

    const isLastWarning = (user) => (user.warnings?.length || 0) + 1 >= (user.maxWarnings || 2);

    const handleWarn = async () => {
        if (!warnReason.trim()) { toast.error('Please provide a reason'); return; }
        setWarnLoading(true);
        try {
            const res = await api.post(`/admin/users/${warnModal.user._id}/warn`, { reason: warnReason });
            setUsers(prev => prev.map(u => u._id === res.data._id ? res.data : u));
            toast.success(res.data.isBlocked ? 'Warning issued — user auto-blocked' : 'Warning issued');
            setWarnModal({ open: false, user: null });
            setWarnReason('');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to warn user');
        } finally {
            setWarnLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!blockReason.trim()) { toast.error('Please provide a reason'); return; }
        setBlockLoading(true);
        try {
            const res = await api.post(`/admin/users/${blockModal.user._id}/block`, { reason: blockReason, hideCourses });
            setUsers(prev => prev.map(u => u._id === res.data._id ? res.data : u));
            toast.success('User blocked');
            setBlockModal({ open: false, user: null });
            setBlockReason('');
            setHideCourses(false);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to block user');
        } finally {
            setBlockLoading(false);
        }
    };

    const handleUnblock = async (userId) => {
        try {
            const res = await api.post(`/admin/users/${userId}/unblock`);
            setUsers(prev => prev.map(u => u._id === res.data._id ? res.data : u));
            toast.success('User unblocked');
        } catch {
            toast.error('Failed to unblock user');
        }
    };

    const handleChangeRole = async (userId, role) => {
        try {
            const res = await api.post(`/admin/users/${userId}/role`, { role });
            setUsers(prev => prev.map(u => u._id === res.data._id ? res.data : u));
            toast.success(`Role changed to ${role}`);
        } catch {
            toast.error('Failed to change role');
        }
    };

    const handleRemoveWarning = async (userId, index) => {
        try {
            const res = await api.delete(`/admin/users/${userId}/warnings/${index}`);
            setUsers(prev => prev.map(u => u._id === res.data._id ? res.data : u));
            toast.success('Warning removed');
        } catch {
            toast.error('Failed to remove warning');
        }
    };

    const handleSetMaxWarnings = async (userId) => {
        const val = parseInt(maxWarningsInput[userId]);
        if (!val || val < 1) { toast.error('Must be at least 1'); return; }
        try {
            await api.post(`/admin/users/${userId}/max-warnings`, { maxWarnings: val });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, maxWarnings: val } : u));
            setEditMaxWarnings(prev => ({ ...prev, [userId]: false }));
            toast.success('Max warnings updated');
        } catch {
            toast.error('Failed to update');
        }
    };

    if (loading) return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading users...</div>;

    const filterOptions = [
        { id: 'all', label: 'All' },
        { id: 'students', label: 'Students' },
        { id: 'instructors', label: 'Instructors' },
        { id: 'warned', label: 'Warned' },
        { id: 'blocked', label: 'Blocked' },
    ];

    return (
        <div>
            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {filterOptions.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                filter === f.id
                                    ? f.id === 'blocked' ? 'bg-red-500 border-red-500 text-white'
                                    : f.id === 'warned' ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                            }`}
                        >
                            {f.label}
                            {f.id === 'blocked' && ` (${users.filter(u => u.isBlocked).length})`}
                            {f.id === 'warned' && ` (${users.filter(u => u.warnings?.length > 0 && !u.isBlocked).length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">User</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Role</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Warnings</th>
                                <th className="text-left px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                                <th className="text-right px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredUsers.map(user => {
                                const warnCount = user.warnings?.length || 0;
                                const maxWarn = user.maxWarnings || 2;
                                const isExpanded = expandedWarnings[user._id];
                                const isEditingMax = editMaxWarnings[user._id];

                                return (
                                    <>
                                        <tr key={user._id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${user.isBlocked ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                            {/* User info */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${user.isBlocked ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                        {user.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                        {user.isBlocked && (
                                                            <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]" title={user.blockReason}>
                                                                Reason: {user.blockReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role with change dropdown */}
                                            <td className="px-5 py-3">
                                                <select
                                                    value={user.role}
                                                    onChange={e => handleChangeRole(user._id, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="instructor">Instructor</option>
                                                </select>
                                            </td>

                                            {/* Warnings */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        warnCount === 0 ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                        : warnCount >= maxWarn ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        {warnCount > 0 && <FaExclamationTriangle className="text-[9px]" />}
                                                        {warnCount}/{maxWarn}
                                                    </span>

                                                    {/* Edit max warnings */}
                                                    {isEditingMax ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={maxWarningsInput[user._id] || maxWarn}
                                                                onChange={e => setMaxWarningsInput(prev => ({ ...prev, [user._id]: e.target.value }))}
                                                                className="w-12 text-xs px-1 py-0.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                            />
                                                            <button onClick={() => handleSetMaxWarnings(user._id)} className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-medium">✓</button>
                                                            <button onClick={() => setEditMaxWarnings(prev => ({ ...prev, [user._id]: false }))} className="text-xs text-slate-400 hover:text-slate-600">✗</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setEditMaxWarnings(prev => ({ ...prev, [user._id]: true })); setMaxWarningsInput(prev => ({ ...prev, [user._id]: maxWarn })); }}
                                                            className="text-slate-400 hover:text-indigo-500 transition-colors"
                                                            title="Edit max warnings"
                                                        >
                                                            <FaEdit className="text-[10px]" />
                                                        </button>
                                                    )}

                                                    {/* Toggle warning history */}
                                                    {warnCount > 0 && (
                                                        <button
                                                            onClick={() => setExpandedWarnings(prev => ({ ...prev, [user._id]: !prev[user._id] }))}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                        >
                                                            {isExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status badge */}
                                            <td className="px-5 py-3">
                                                {user.isBlocked ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                        <FaBan className="text-[9px]" /> Blocked
                                                    </span>
                                                ) : warnCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                                        <FaExclamationTriangle className="text-[9px]" /> Warned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                        <FaCheckCircle className="text-[9px]" /> Active
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!user.isBlocked && (
                                                        <button
                                                            onClick={() => { setWarnModal({ open: true, user }); setWarnReason(''); }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                                        >
                                                            Warn
                                                        </button>
                                                    )}
                                                    {user.isBlocked ? (
                                                        <button
                                                            onClick={() => handleUnblock(user._id)}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors flex items-center gap-1"
                                                        >
                                                            <FaUnlock className="text-[9px]" /> Unblock
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setBlockModal({ open: true, user }); setBlockReason(''); setHideCourses(false); }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 transition-colors flex items-center gap-1"
                                                        >
                                                            <FaBan className="text-[9px]" /> Block
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Warning history expanded row */}
                                        {isExpanded && warnCount > 0 && (
                                            <tr key={`${user._id}-warnings`} className="bg-amber-50/50 dark:bg-amber-900/10">
                                                <td colSpan={5} className="px-5 py-3">
                                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">Warning History</p>
                                                    <div className="space-y-2">
                                                        {user.warnings.map((w, i) => (
                                                            <div key={i} className="flex items-start justify-between gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-900/40">
                                                                <div>
                                                                    <p className="text-xs text-slate-700 dark:text-slate-300">{w.reason}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(w.issuedAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoveWarning(user._id, i)}
                                                                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                                                                    title="Remove warning"
                                                                >
                                                                    <FaTimes className="text-xs" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warn Modal */}
            {warnModal.open && warnModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Issue Warning</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{warnModal.user.name}</p>
                            </div>
                            <button onClick={() => setWarnModal({ open: false, user: null })} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Warning count progress */}
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500 dark:text-slate-400">Current warnings</span>
                                <span className={`font-medium ${isLastWarning(warnModal.user) ? 'text-red-500' : 'text-amber-500'}`}>
                                    {warnModal.user.warnings?.length || 0} / {warnModal.user.maxWarnings || 2}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${isLastWarning(warnModal.user) ? 'bg-red-500' : 'bg-amber-400'}`}
                                    style={{ width: `${Math.min(100, (((warnModal.user.warnings?.length || 0) + 1) / (warnModal.user.maxWarnings || 2)) * 100)}%` }}
                                />
                            </div>

                            {/* Final warning alert */}
                            {isLastWarning(warnModal.user) && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <FaExclamationTriangle className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-700 dark:text-red-400">
                                        <strong>Final warning!</strong> After this warning, the user will be automatically blocked.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    value={warnReason}
                                    onChange={e => setWarnReason(e.target.value)}
                                    placeholder="Explain why this warning is being issued..."
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setWarnModal({ open: false, user: null })}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWarn}
                                    disabled={warnLoading}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isLastWarning(warnModal.user) ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                                >
                                    {warnLoading ? 'Issuing...' : isLastWarning(warnModal.user) ? 'Warn & Block User' : 'Issue Warning'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Modal */}
            {blockModal.open && blockModal.user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Block User</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{blockModal.user.name}</p>
                            </div>
                            <button onClick={() => setBlockModal({ open: false, user: null })} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Block Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    value={blockReason}
                                    onChange={e => setBlockReason(e.target.value)}
                                    placeholder="This reason will be shown to the user when they try to log in..."
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>
                            {blockModal.user.role === 'instructor' && (
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hideCourses}
                                        onChange={e => setHideCourses(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Also hide this instructor's courses from marketplace</span>
                                </label>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setBlockModal({ open: false, user: null })}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBlock}
                                    disabled={blockLoading}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <FaBan className="text-xs" />
                                    {blockLoading ? 'Blocking...' : 'Block User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
