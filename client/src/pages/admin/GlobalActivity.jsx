import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { FaHistory, FaCheckCircle, FaPlayCircle, FaBook, FaUser, FaClock, FaStickyNote, FaUserPlus, FaComment, FaSignInAlt, FaTrash, FaPen, FaPlus, FaBullhorn, FaUserTie, FaBookmark, FaBookOpen, FaChevronDown, FaTimes, FaUserSecret } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/ui/Pagination';

const ALL_ACTIONS = [
    'Login', 'Registered', 'Enrolled', 'Unenrolled',
    'Status Updated', 'Marked for Revision', 'Removed from Revision',
    'Completed', 'Started', 'Comment', 'Note Updated',
    'Lecture Added', 'Lecture Updated', 'Lecture Deleted',
    'Section Added', 'Section Updated',
    'Course Updated', 'Course Created',
    'Broadcast Created', 'Teacher Added',
    'Impersonated',
];

const GlobalActivity = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(15);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedActions, setSelectedActions] = useState([]); // multi-select
    const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
    const actionDropdownRef = useRef(null);
    const [userFilter, setUserFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedUser, setDebouncedUser] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedUser(userFilter), 500);
        return () => clearTimeout(timer);
    }, [userFilter]);

    // Close action dropdown on outside click
    useEffect(() => {
        if (!actionDropdownOpen) return;
        const handler = (e) => { if (actionDropdownRef.current && !actionDropdownRef.current.contains(e.target)) setActionDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [actionDropdownOpen]);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    page,
                    limit,
                    search: debouncedSearch,
                    action: selectedActions.length > 0 ? selectedActions.join(',') : '',
                    user: debouncedUser
                };
                const res = await api.get('/activities', { params });
                setActivities(res.data.activities);
                setTotalPages(res.data.pages);
                setTotal(res.data.total || 0);
            } catch (error) {
                console.error("Failed to fetch activities", error);
                setError(error.response?.data?.message || error.message || "Failed to load logs");
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [page, limit, debouncedSearch, selectedActions, debouncedUser]);

    const toggleAction = (action) => {
        setSelectedActions(prev =>
            prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
        );
        setPage(1);
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedActions([]);
        setUserFilter('');
        setPage(1);
    };

    const getActionIcon = (action) => {
        if (!action) return <FaHistory className="text-slate-400" />;
        if (action === 'Completed') return <FaCheckCircle className="text-green-500" />;
        if (action === 'Started' || action === 'In Progress') return <FaPlayCircle className="text-blue-500" />;
        if (action === 'Status Updated') return <FaClock className="text-amber-500" />;
        if (action === 'Note Updated') return <FaStickyNote className="text-purple-500" />;
        if (action === 'Marked for Revision') return <FaBookmark className="text-amber-500" />;
        if (action === 'Removed from Revision') return <FaBookOpen className="text-slate-400" />;
        if (action === 'Impersonated') return <FaUserSecret className="text-orange-500" />;
        if (action === 'Enrolled') return <FaUserPlus className="text-indigo-500" />;
        if (action === 'Unenrolled') return <FaTrash className="text-red-500" />;
        if (action === 'Comment') return <FaComment className="text-slate-500" />;
        if (action === 'Registered') return <FaUserPlus className="text-emerald-500" />;
        if (action === 'Login') return <FaSignInAlt className="text-cyan-500" />;
        if (action === 'Password Updated') return <FaPen className="text-violet-500" />;
        if (action.includes('Deleted')) return <FaTrash className="text-red-500" />;
        if (action.includes('Added') || action.includes('Created')) return <FaPlus className="text-emerald-500" />;
        if (action.includes('Updated')) return <FaPen className="text-violet-500" />;
        if (action.includes('Broadcast')) return <FaBullhorn className="text-amber-500" />;
        if (action.includes('Teacher')) return <FaUserTie className="text-blue-500" />;
        if (action.includes('Quiz')) return <FaBook className="text-indigo-500" />;
        return <FaHistory className="text-slate-400" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-navbar z-10">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FaHistory className="text-slate-400" />
                            Global Activity Log
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time student actions across all courses</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters Bar */}
                <div className="flex flex-col gap-3 mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search details..."
                                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Filter by User Name..."
                                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                            />
                        </div>

                        {/* Multi-select Action Filter */}
                        <div className="relative w-full md:w-56" ref={actionDropdownRef}>
                            <button
                                onClick={() => setActionDropdownOpen(prev => !prev)}
                                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border text-sm transition-colors ${actionDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-slate-700'} text-slate-900 dark:text-white`}
                            >
                                <span className="truncate text-sm text-slate-500 dark:text-slate-400">
                                    {selectedActions.length === 0 ? 'All Actions' : `${selectedActions.length} selected`}
                                </span>
                                <FaChevronDown className={`text-slate-400 text-xs shrink-0 ml-2 transition-transform ${actionDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {actionDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto py-1">
                                        {ALL_ACTIONS.map(action => {
                                            const isSelected = selectedActions.includes(action);
                                            return (
                                                <button
                                                    key={action}
                                                    onClick={() => toggleAction(action)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                                >
                                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-600'}`}>
                                                        {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                    </span>
                                                    {getActionIcon(action)}
                                                    {action}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedActions.length > 0 && (
                                        <div className="border-t border-gray-100 dark:border-slate-700 px-3 py-2">
                                            <button
                                                onClick={() => { setSelectedActions([]); setPage(1); }}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                                            >
                                                Clear selection
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors shrink-0"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Active filter chips */}
                    {selectedActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedActions.map(action => (
                                <span
                                    key={action}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                >
                                    {getActionIcon(action)}
                                    {action}
                                    <button
                                        onClick={() => toggleAction(action)}
                                        className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                                    >
                                        <FaTimes size={9} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64 text-slate-400 animate-pulse">Loading Logs...</div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="text-red-500 dark:text-red-400 font-bold mb-2">Error Loading Activity</div>
                        <div className="text-sm text-red-400 dark:text-red-300">{error}</div>
                    </div>
                ) : activities.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-slate-950 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold border-b border-gray-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 w-[250px]">User</th>
                                        <th className="px-6 py-4 w-[150px]">Action</th>
                                        <th className="px-6 py-4 w-[250px]">Resource</th>
                                        <th className="px-6 py-4 w-[200px]">Details</th>
                                        <th className="px-6 py-4 w-[150px]">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {activities.map((log) => {
                                        // Render activity row
                                        const user = log.user || log.student;
                                        return (
                                            <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs uppercase shrink-0">
                                                            {user?.name ? user.name.charAt(0) : <FaUser />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{user?.name || 'Unknown User'}</div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-xs text-slate-500 dark:text-slate-500 truncate max-w-[120px]">{user?.email}</div>
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                    {user?.role || 'user'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap align-top">
                                                    <div className="flex items-center gap-2">
                                                        {getActionIcon(log.action)}
                                                        <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${
                                                            log.action === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                            log.action === 'Started' || log.action === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                                            log.action === 'Enrolled' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                                            log.action === 'Impersonated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                                            log.action === 'Login' || log.action === 'Registered' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400' :
                                                            log.action === 'Comment' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                            log.action === 'Note Updated' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                            log.action === 'Marked for Revision' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                            log.action === 'Removed from Revision' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                                            log.action.includes('Deleted') || log.action === 'Unenrolled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                            log.action.includes('Added') || log.action.includes('Created') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                            log.action.includes('Updated') ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400' :
                                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        {log.course ? (
                                                            <span
                                                                className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate hover:underline cursor-pointer block"
                                                                title={log.course.title}
                                                                onClick={() => navigate(`/admin/course/${log.course._id}`)}
                                                            >
                                                                {log.course.title}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                                                                {log.action === 'Login' || log.action === 'Registered' ? 'Authentication' :
                                                                 log.action === 'Password Updated' ? 'Account' :
                                                                 log.action === 'Impersonated' ? 'Admin Panel' :
                                                                 log.action === 'Role Changed' || log.action === 'User Warned' || log.action === 'User Blocked' || log.action === 'User Unblocked' ? 'User Management' :
                                                                 'Platform Activity'}
                                                            </span>
                                                        )}
                                                        {log.lecture && (
                                                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                                <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">Lec</span>
                                                                <span className="text-xs truncate max-w-[180px]" title={log.lecture.title}>{log.lecture.title}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="max-w-[200px] min-w-0">
                                                        <div className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                                                            <div className="line-clamp-2 break-words text-xs leading-relaxed" title={log.details || ''}>
                                                                {log.details || 'No details'}
                                                            </div>
                                                            {log.url && (
                                                                <div className="mt-1 text-[10px] text-slate-400 font-mono truncate cursor-help" title={`${log.method} ${log.url}`}>
                                                                    <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">{log.method}</span>
                                                                    {log.url}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap align-top">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            itemsPerPage={limit}
                            onPageChange={(newPage) => setPage(newPage)}
                            onLimitChange={(newLimit) => {
                                setLimit(newLimit);
                                setPage(1);
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaHistory className="text-slate-300 dark:text-slate-600 text-2xl" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No activity yet</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Students activity will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalActivity;
