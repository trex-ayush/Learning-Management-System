import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaCheckDouble, FaTimes, FaRobot, FaBullhorn, FaBook, FaClipboardList, FaClock, FaTrophy, FaPaperPlane, FaTrash } from 'react-icons/fa';
import api from '../api/axios';
import Pagination from '../components/ui/Pagination';

const typeConfig = {
    new_content: { icon: FaBook, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'New Content' },
    broadcast: { icon: FaBullhorn, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Announcement' },
    quiz: { icon: FaClipboardList, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Quiz' },
    due_date: { icon: FaClock, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Due Date' },
    ai_access: { icon: FaRobot, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'AI Access' },
    milestone: { icon: FaTrophy, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Milestone' },
    custom: { icon: FaPaperPlane, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', label: 'Custom' },
};

const priorityBadge = {
    urgent: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    important: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    normal: ''
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filter, setFilter] = useState('all'); // all | unread
    const limit = 15;

    const fetchNotifications = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/notifications?page=${p}&limit=${limit}`);
            setNotifications(res.data.notifications);
            setPagination(res.data.pagination);
        } catch {} finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(page);
    }, [page]);

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch {}
    };

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch {}
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch {}
    };

    const handleClick = (notif) => {
        if (!notif.read) handleMarkRead(notif._id);
        if (notif.link) navigate(notif.link);
    };

    const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <FaBell className="text-indigo-500" size={18} />
                            </div>
                            Notifications
                            {unreadCount > 0 && (
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-0.5 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </h1>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <FaCheckDouble size={11} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 mb-4 border-b border-gray-200 dark:border-slate-800">
                    {[{ v: 'all', l: 'All' }, { v: 'unread', l: `Unread (${unreadCount})` }].map(f => (
                        <button
                            key={f.v}
                            onClick={() => setFilter(f.v)}
                            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors ${filter === f.v
                                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            {f.l}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaBell className="text-slate-300 dark:text-slate-600" size={24} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </h3>
                        <p className="text-xs text-slate-400">{filter === 'unread' ? 'You\'re all caught up!' : 'Notifications from your courses will appear here'}</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800/50 overflow-hidden">
                        {filtered.map(notif => {
                            const config = typeConfig[notif.type] || typeConfig.custom;
                            const Icon = config.icon;
                            return (
                                <div
                                    key={notif._id}
                                    onClick={() => handleClick(notif)}
                                    className={`group flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 ${!notif.read ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={config.color} size={16} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {notif.title}
                                                </p>
                                                {notif.message && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notif.read && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleMarkRead(notif._id); }} className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-400 hover:text-green-500 transition-colors" title="Mark as read">
                                                        <FaCheck size={10} />
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(notif._id); }} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>{config.label}</span>
                                            {notif.course?.title && (
                                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{notif.course.title}</span>
                                            )}
                                            {priorityBadge[notif.priority] && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${priorityBadge[notif.priority]}`}>{notif.priority}</span>
                                            )}
                                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                                                {new Date(notif.createdAt).toLocaleDateString()} · {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={pagination.pages}
                            totalItems={pagination.total}
                            itemsPerPage={limit}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
