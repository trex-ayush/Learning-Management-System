import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FaUserCircle, FaVideo, FaKey, FaChartLine, FaFire, FaCalendarAlt, FaAward, FaExclamationTriangle } from 'react-icons/fa';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalCompletedLectures: 0,
        currentStreak: 0,
        maxStreak: 0,
        dailyActivity: {}
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Password Form State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/courses/my/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
        setError('');
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwords;

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            await api.put('/auth/updatepassword', { currentPassword, newPassword });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password updated successfully");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password");
            toast.error("Failed to update password");
        }
    };

    const generateHeatmapData = () => {
        const heatmap = [];
        const today = new Date();
        const startDay = new Date(today);
        startDay.setMonth(today.getMonth() - 5); // 6 months back
        startDay.setDate(1); // Start of that month

        // Adjust to the start of the week (Sunday = 0)
        const adjustedStart = new Date(startDay);
        adjustedStart.setDate(startDay.getDate() - startDay.getDay());

        const totalDays = Math.ceil((today - adjustedStart) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(adjustedStart);
            date.setDate(adjustedStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            heatmap.push({
                date: dateStr,
                count: stats.dailyActivity[dateStr] || 0,
                isCurrentMonth: date >= startDay && date <= today
            });
        }
        return heatmap;
    };

    const heatmapData = generateHeatmapData();

    // Helper to group by week for vertical rendering
    const weeks = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
        weeks.push(heatmapData.slice(i, i + 7));
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
            <div className="container mx-auto px-4 py-12 max-w-6xl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">Your Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Track your learning journey and consistency.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: User & Streaks (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 dark:bg-slate-200 opacity-10 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 group-hover:scale-105 transition-transform duration-500">
                                <FaUserCircle size={70} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">{user?.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{user?.email}</p>

                            <div className="flex items-center gap-2">
                                <span className="px-5 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-xl uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none">
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        {/* Streak Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none relative group transition-all">
                                <div className="absolute top-4 right-4 text-orange-500 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <FaFire size={20} />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Streak</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-slate-800 dark:text-white leading-none">{stats.currentStreak}</span>
                                    <span className="text-[10px] font-medium text-slate-500 mb-0.5 uppercase tracking-tighter">Days</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none relative group transition-all">
                                <div className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <FaAward size={20} />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Streak</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-slate-800 dark:text-white leading-none">{stats.maxStreak}</span>
                                    <span className="text-[10px] font-medium text-slate-500 mb-0.5 uppercase tracking-tighter">Days</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Progress */}
                        <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 border border-transparent shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 dark:bg-slate-900/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Completed</p>
                            <h3 className="text-4xl font-bold text-white dark:text-slate-900 mb-6">{stats.totalCompletedLectures}</h3>
                            <div className="w-full bg-slate-800 dark:bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div
                                    className="bg-white dark:bg-slate-900 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (stats.totalCompletedLectures / 50) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-3 font-medium">Milestone: 50 Lectures</p>
                        </div>
                    </div>

                    {/* Right: Heatmap & Security (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Heatmap Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700">
                                        <FaCalendarAlt size={18} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight uppercase">Learning Activity</h3>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>Less</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/50"></div>
                                        <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-500"></div>
                                        <div className="w-3 h-3 rounded-sm bg-slate-800 dark:bg-white"></div>
                                    </div>
                                    <span>More</span>
                                </div>
                            </div>

                            {/* LeetCode Style Heatmap Grid */}
                            <div className="overflow-x-auto pb-4 scrollbar-hide">
                                <div className="inline-block min-w-full">
                                    <div className="flex gap-1.5 h-[98px]">
                                        {weeks.map((week, weekIdx) => (
                                            <div key={weekIdx} className="flex flex-col gap-1.5">
                                                {week.map((day, dayIdx) => {
                                                    let bgColor = 'bg-slate-100 dark:bg-slate-800/50';
                                                    if (day.count > 0 && day.count <= 1) bgColor = 'bg-slate-200 dark:bg-slate-700';
                                                    if (day.count > 1 && day.count <= 3) bgColor = 'bg-slate-400 dark:bg-slate-500';
                                                    if (day.count > 3) bgColor = 'bg-slate-800 dark:bg-white';

                                                    return (
                                                        <div
                                                            key={dayIdx}
                                                            className={`w-3 h-3 rounded-sm ${bgColor} transition-colors duration-200 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 cursor-pointer`}
                                                            title={`${day.date}: ${day.count} lessons`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-12">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Period</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">Last 6 Months</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Lessons</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">{heatmapData.reduce((acc, curr) => acc + curr.count, 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contribution</p>
                                    <p className="text-base font-bold text-slate-800 dark:text-white">
                                        {(heatmapData.filter(i => i.count > 0).length > 0
                                            ? (heatmapData.filter(i => i.count > 0).length / (6 * 30) * 100).toFixed(1)
                                            : 0)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Password/Security */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700">
                                    <FaKey size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none uppercase">Security</h3>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwords.currentPassword}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-slate-200 dark:focus:border-slate-800 text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-300"
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwords.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-slate-200 dark:focus:border-slate-800 text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-300"
                                                placeholder="New password"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwords.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-slate-200 dark:focus:border-slate-800 text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-300"
                                                placeholder="Repeat password"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100/50">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 px-8 rounded-xl hover:shadow-lg active:scale-[0.98] transition-all uppercase text-[10px] tracking-widest w-full md:w-auto"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Warnings Section - only show if user has warnings */}
                        {user?.warnings?.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] p-8 md:p-10 border border-amber-200 dark:border-amber-800/50 shadow-2xl shadow-amber-100/40 dark:shadow-none">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                                        <FaExclamationTriangle size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 tracking-tight uppercase">Account Warnings</h3>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                            {user.warnings.length} of {user.maxWarnings || 2} warnings issued. Further violations may result in account suspension.
                                        </p>
                                    </div>
                                </div>

                                {/* Warning progress bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
                                        <span>Warning Level</span>
                                        <span>{user.warnings.length}/{user.maxWarnings || 2}</span>
                                    </div>
                                    <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${user.warnings.length >= (user.maxWarnings || 2) ? 'bg-red-500' : 'bg-amber-400'}`}
                                            style={{ width: `${Math.min(100, (user.warnings.length / (user.maxWarnings || 2)) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Warning list */}
                                <div className="space-y-3">
                                    {user.warnings.map((w, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{w.reason}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                                                    {new Date(w.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-5 text-center font-medium">
                                    If you believe this is a mistake, please contact the admin.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
