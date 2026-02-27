import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FaUserCircle, FaLock, FaExclamationTriangle } from 'react-icons/fa';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
        setError('');
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwords;
        if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        setPwLoading(true);
        try {
            await api.put('/auth/updatepassword', { currentPassword, newPassword });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success('Password updated successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPwLoading(false);
        }
    };

    const roleBadge = {
        admin:      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
        instructor: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
        student:    'bg-sky-100   dark:bg-sky-900/30    text-sky-700    dark:text-sky-300',
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Left Sidebar ─────────────────────────────────────── */}
                    <div className="w-full lg:w-60 shrink-0 space-y-4">

                        {/* Profile card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 ring-4 ring-slate-200 dark:ring-slate-700">
                                <FaUserCircle className="text-slate-400 dark:text-slate-500 text-6xl" />
                            </div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-all">{user?.email}</p>
                            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge[user?.role] || roleBadge.student}`}>
                                {user?.role}
                            </span>
                        </div>

                        {/* Warnings sidebar badge */}
                        {user?.warnings?.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaExclamationTriangle className="text-amber-500 text-sm shrink-0" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Warnings</span>
                                </div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                                    {user.warnings.length} of {user.maxWarnings || 2} issued
                                </p>
                                <div className="w-full h-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${user.warnings.length >= (user.maxWarnings || 2) ? 'bg-red-500' : 'bg-amber-400'}`}
                                        style={{ width: `${Math.min(100, (user.warnings.length / (user.maxWarnings || 2)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right Main ───────────────────────────────────────── */}
                    <div className="flex-1 space-y-5">

                        {/* Change password */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <FaLock className="text-slate-500 dark:text-slate-400 text-sm" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Change Password</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Update your account password</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Current password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwords.currentPassword}
                                        onChange={handleChange}
                                        placeholder="Enter current password"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">New password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwords.newPassword}
                                            onChange={handleChange}
                                            placeholder="New password"
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Confirm password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwords.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Repeat new password"
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                                        <FaExclamationTriangle className="text-xs shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="pt-1">
                                    <button
                                        type="submit"
                                        disabled={pwLoading}
                                        className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                    >
                                        {pwLoading ? 'Saving…' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Warnings detail */}
                        {user?.warnings?.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/40 overflow-hidden">
                                <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <FaExclamationTriangle className="text-amber-500 text-sm" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Account Warnings</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {user.warnings.length} of {user.maxWarnings || 2} — further violations may result in suspension
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    {user.warnings.map((w, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                            <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{w.reason}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(w.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-amber-600 dark:text-amber-500 text-center pt-1">
                                        If you believe this is a mistake, please contact the admin.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
