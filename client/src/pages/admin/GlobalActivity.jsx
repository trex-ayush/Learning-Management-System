import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FaHistory, FaCheckCircle, FaPlayCircle, FaBook, FaUser, FaClock, FaStickyNote, FaUserPlus, FaComment } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/ui/Pagination';

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
    const [actionFilter, setActionFilter] = useState('');
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

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    page,
                    limit,
                    search: debouncedSearch,
                    action: actionFilter === 'All' ? '' : actionFilter,
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
    }, [page, limit, debouncedSearch, actionFilter, debouncedUser]);

    const handleReset = () => {
        setSearchTerm('');
        setActionFilter('');
        setUserFilter('');
        setPage(1);
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'Completed': return <FaCheckCircle className="text-green-500" />;
            case 'Started': return <FaPlayCircle className="text-blue-500" />;
            case 'In Progress': return <FaClock className="text-amber-500" />;
            case 'Note Updated': return <FaStickyNote className="text-purple-500" />;
            case 'Enrolled': return <FaUserPlus className="text-indigo-500" />;
            case 'Comment': return <FaComment className="text-slate-500" />;
            case 'Registered': return <FaUserPlus className="text-emerald-500" />;
            case 'Login': return <FaCheckCircle className="text-blue-600" />;
            case 'POST': return <FaCheckCircle className="text-green-600" />;
            case 'PUT': return <FaCheckCircle className="text-amber-600" />;
            case 'DELETE': return <FaCheckCircle className="text-red-600" />;
            default: return <FaHistory className="text-slate-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10">
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
                <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
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
                    <div className="w-full md:w-48">
                        <select
                            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="">All Actions</option>
                            <option value="Login">Login</option>
                            <option value="Comment">Comment</option>
                            <option value="Note Updated">Note Updated</option>
                            <option value="Registered">Registered</option>
                            <option value="Status Updated">Status Updated</option>
                            <option value="Enrolled">Enrolled</option>
                        </select>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        Reset
                    </button>
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
                                                        <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${log.action === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                            log.action === 'Started' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                                                log.action === 'Enrolled' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span
                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate hover:underline cursor-pointer block"
                                                            title={log.course?.title || 'System Event'}
                                                            onClick={() => log.course && navigate(`/admin/course/${log.course._id}`)}
                                                        >
                                                            {log.course?.title || <span className="text-slate-400 italic">Global Event</span>}
                                                        </span>
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
