import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { FaPlayCircle, FaBook, FaCheckCircle, FaChevronDown, FaChevronUp, FaBullhorn, FaClipboardList, FaTrophy, FaClock, FaRedo, FaLock, FaUnlock, FaRobot } from 'react-icons/fa';
import BroadcastList from '../../components/broadcast/BroadcastList';
import AIChatPanel from '../../components/chat/AIChatPanel';
import AuthContext from '../../context/AuthContext';

const StudentCourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'content';
    const { user } = useContext(AuthContext);

    const [course, setCourse] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    // Broadcast State
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastsLoaded, setBroadcastsLoaded] = useState(false);
    const [canBroadcast, setCanBroadcast] = useState(false);
    const [broadcastPage, setBroadcastPage] = useState(1);
    const [broadcastPagination, setBroadcastPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [unreadBroadcastCount, setUnreadBroadcastCount] = useState(0);

    // Quiz State
    const [quizzes, setQuizzes] = useState([]);
    const [quizzesLoaded, setQuizzesLoaded] = useState(false);

    // Tab definitions
    const tabs = [
        { id: 'content', label: 'Content', icon: FaBook },
        { id: 'quizzes', label: 'Quizzes', icon: FaClipboardList },
        { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
        { id: 'ai-assistant', label: 'AI Assistant', icon: FaRobot },
    ];

    // Tab change handler
    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    // Toggle Section Logic
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Set Document Title
    useEffect(() => {
        if (course) {
            document.title = `Skill Path | ${course.title}`;
        }
        return () => {
            document.title = 'Skill Path';
        };
    }, [course]);

    // Fetch Course & Progress (initial load - optimized with parallel requests)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch course details and progress in parallel (optimized)
                // Wrap progress/unread calls to prevent page crash if they fail (e.g. not enrolled/logged in)
                const [courseRes, progressRes, unreadRes] = await Promise.all([
                    api.get(`/courses/${id}`),
                    api.get(`/courses/${id}/my-progress`).catch(() => ({ data: null })),
                    api.get(`/broadcasts/course/${id}/unread-count`).catch(() => ({ data: { unreadCount: 0 } }))
                ]);

                // 1. Set Course Details
                setCourse(courseRes.data);

                // Auto-expand all sections by default
                if (courseRes.data.sections) {
                    const initialExpanded = {};
                    courseRes.data.sections.forEach(sec => initialExpanded[sec._id] = true);
                    setExpandedSections(initialExpanded);
                }

                // 2. Set Student's Progress (from optimized endpoint)
                if (progressRes.data && progressRes.data.completedLectures) {
                    setIsEnrolled(true);
                    const map = {};
                    progressRes.data.completedLectures.forEach(item => {
                        map[item.lecture] = {
                            status: item.status,
                            completedAt: item.completedAt
                        };
                    });
                    setProgressMap(map);
                }

                // 3. Set unread broadcast count
                setUnreadBroadcastCount(unreadRes.data.unreadCount || 0);
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, [id]);

    // Lazy load broadcasts when announcements tab is activated
    useEffect(() => {
        if (activeTab === 'announcements' && id) {
            if (!broadcastsLoaded) {
                fetchBroadcasts();
                fetchBroadcastPermission();
            }
            // Mark broadcasts as read when viewing the tab
            if (unreadBroadcastCount > 0) {
                markBroadcastsAsRead();
            }
        }
        // Lazy load quizzes when quizzes tab is activated
        if (activeTab === 'quizzes' && id && !quizzesLoaded) {
            fetchQuizzes();
        }
    }, [activeTab, broadcastsLoaded, id, unreadBroadcastCount, quizzesLoaded]);

    // Fetch quizzes for this course
    const fetchQuizzes = async () => {
        try {
            const res = await api.get(`/quizzes/course/${id}`);
            setQuizzes(res.data);
            setQuizzesLoaded(true);
        } catch (err) {
            console.error("Failed to fetch quizzes", err);
        }
    };

    // Fetch broadcast permission
    const fetchBroadcastPermission = async () => {
        try {
            const permRes = await api.get(`/broadcasts/course/${id}/can-broadcast`);
            setCanBroadcast(permRes.data.canBroadcast);
        } catch (err) {
            console.error("Failed to check broadcast permission", err);
        }
    };

    // Fetch broadcasts
    const fetchBroadcasts = async (page = 1) => {
        try {
            const res = await api.get(`/broadcasts/course/${id}/active?page=${page}&limit=5`);
            setBroadcasts(res.data.broadcasts);
            setBroadcastPagination(res.data.pagination);
            setBroadcastPage(page);
            setBroadcastsLoaded(true);
        } catch (err) {
            console.error("Failed to fetch broadcasts", err);
        }
    };

    // Fetch unread broadcast count
    const fetchUnreadCount = async () => {
        try {
            const res = await api.get(`/broadcasts/course/${id}/unread-count`);
            setUnreadBroadcastCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error("Failed to fetch unread count", err);
        }
    };

    // Mark broadcasts as read
    const markBroadcastsAsRead = async () => {
        try {
            await api.post(`/broadcasts/course/${id}/mark-read`);
            setUnreadBroadcastCount(0);
        } catch (err) {
            console.error("Failed to mark broadcasts as read", err);
        }
    };

    // Find the lecture to resume from (last accessed, then next if completed)
    const getResumeLecture = () => {
        if (!course?.sections) return null;
        const completionLabel = course.completedStatus || 'Completed';
        const allLectures = [];
        for (const sec of course.sections) {
            if (!sec.isPublic) continue;
            for (const lec of sec.lectures) {
                allLectures.push(lec);
            }
        }
        if (allLectures.length === 0) return null;

        // No progress yet — start from first lecture
        if (Object.keys(progressMap).length === 0) return allLectures[0];

        // Find the most recently accessed lecture by completedAt timestamp
        let lastAccessedId = null;
        let latestTime = 0;
        for (const [lecId, progress] of Object.entries(progressMap)) {
            const t = progress.completedAt ? new Date(progress.completedAt).getTime() : 0;
            if (t >= latestTime) {
                latestTime = t;
                lastAccessedId = lecId;
            }
        }

        const lastIdx = allLectures.findIndex(l => l._id === lastAccessedId);
        if (lastIdx === -1) return allLectures[0];

        // If that lecture is fully completed, go to the next one
        const lastStatus = progressMap[lastAccessedId]?.status;
        if (lastStatus === completionLabel && lastIdx < allLectures.length - 1) {
            return allLectures[lastIdx + 1];
        }

        // Otherwise resume at that lecture
        return allLectures[lastIdx];
    };

    const hasAnyProgress = () => {
        return Object.keys(progressMap).length > 0;
    };

    const getProgressStats = () => {
        if (!course) return { completed: 0, total: 0, percent: 0 };
        let totalLectures = 0;
        course.sections.forEach(s => totalLectures += s.lectures.length);

        let completed = 0;
        const completionLabel = course.completedStatus || 'Completed';
        Object.values(progressMap).forEach(p => {
            if (p.status === completionLabel) completed++;
        });

        const percent = totalLectures === 0 ? 0 : Math.round((completed / totalLectures) * 100);
        return { completed, total: totalLectures, percent };
    };

    // Render Content Tab (Curriculum + Progress)
    const renderContentTab = () => {
        const stats = getProgressStats();

        // Determine progress color based on percentage
        const getProgressColor = () => {
            if (stats.percent >= 80) return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30', light: 'bg-green-50 dark:bg-green-900/10' };
            if (stats.percent >= 50) return { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/30', light: 'bg-blue-50 dark:bg-blue-900/10' };
            if (stats.percent >= 20) return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/30', light: 'bg-amber-50 dark:bg-amber-900/10' };
            return { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/30', light: 'bg-purple-50 dark:bg-purple-900/10' };
        };

        const getEncouragingMessage = () => {
            if (stats.percent === 100) return "🎉 Course completed! Well done!";
            if (stats.percent >= 80) return "Almost there! Keep pushing forward!";
            if (stats.percent >= 50) return "Great job! You're halfway through!";
            if (stats.percent >= 20) return "Nice start! Keep the momentum going!";
            return "Let's begin your learning journey!";
        };

        const colors = getProgressColor();

        return (
            <div className="space-y-3 sm:space-y-4">
                {/* Progress Card - Compact and prominent */}
                <div className={`bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-lg sm:rounded-xl border ${colors.border} p-3 sm:p-4 shadow-sm hover:shadow transition-all duration-200`}>
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Progress Circle - Smaller */}
                        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colors.light} flex items-center justify-center shrink-0`}>
                            <div className="text-center">
                                <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>{stats.percent}%</div>
                            </div>
                            {/* Circular progress indicator */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    className="text-gray-200 dark:text-slate-700"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                    strokeDasharray={`${stats.percent * 2.827} 283`}
                                    strokeLinecap="round"
                                    className={colors.text.replace('text-', 'stroke-')}
                                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                />
                            </svg>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                            <div>
                                <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Progress</h2>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{stats.completed} of {stats.total} Lectures</p>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                <div
                                    className={`h-full ${colors.bg} rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${stats.percent}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {getEncouragingMessage()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Curriculum Section */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-end justify-between border-b border-gray-200 dark:border-slate-800 pb-3 sm:pb-4">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Curriculum</h2>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{course.sections.length} Sections</span>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        {course.sections && course.sections.length > 0 ? (
                            course.sections.filter(section => section.isPublic).map((section) => {
                                // Section Progress Logic
                                const totalSecLectures = section.lectures ? section.lectures.length : 0;
                                const completionLabel = course.completedStatus || 'Completed';
                                const completedSecLectures = section.lectures ? section.lectures.filter(l => progressMap[l._id]?.status === completionLabel).length : 0;
                                const secPercent = totalSecLectures > 0 ? Math.round((completedSecLectures / totalSecLectures) * 100) : 0;
                                const isExpanded = expandedSections[section._id];

                                return (
                                    <div key={section._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-colors duration-300">

                                        {/* Section Header (Accordion) */}
                                        <div
                                            onClick={() => toggleSection(section._id)}
                                            className="bg-gray-50/50 dark:bg-slate-950/50 px-5 py-4 border-b border-gray-100 dark:border-slate-800 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/80 flex flex-col gap-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                    <FaBook className="text-slate-300 dark:text-slate-600 text-xs" />
                                                    {section.title}
                                                </h3>
                                                {isExpanded ?
                                                    <FaChevronUp className="text-slate-400 text-xs" /> :
                                                    <FaChevronDown className="text-slate-400 text-xs" />
                                                }
                                            </div>

                                            {/* Section Progress Bar */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${secPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 min-w-[3rem] text-right">
                                                    {completedSecLectures} / {totalSecLectures}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Lectures List (Collapsible) */}
                                        {isExpanded && (
                                            <div className="divide-y divide-gray-100 dark:divide-slate-800 animate-in slide-in-from-top-2 duration-200">
                                                {section.lectures && section.lectures.length > 0 ? (
                                                    [...section.lectures].sort((a, b) => a.number - b.number).map((lec) => {
                                                        const isPreview = lec.isPreview || section.isPreview;
                                                        const progress = progressMap[lec._id] || { status: 'Not Started' };
                                                        const status = progress.status;
                                                        const completedAt = progress.completedAt ? new Date(progress.completedAt) : null;
                                                        const dueDate = lec.dueDate ? new Date(lec.dueDate) : null;

                                                        const completionLabel = course.completedStatus || 'Completed';
                                                        const isLate = status === completionLabel && completedAt && dueDate && completedAt > dueDate;

                                                        return (
                                                            <div
                                                                key={lec._id}
                                                                onClick={() => {
                                                                    if (isEnrolled || isPreview) {
                                                                        navigate(`/course/${id}/lecture/${lec._id}`);
                                                                    }
                                                                }}
                                                                className={`group transition-colors p-4 flex items-center justify-between ${isEnrolled || isPreview
                                                                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                                                                    : 'opacity-60 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="shrink-0">
                                                                        {(status && status !== 'Not Started') ? (
                                                                            <div style={{ color: course?.lectureStatuses?.find(s => s.label === status)?.color || '#10b981' }}>
                                                                                {status === completionLabel ?
                                                                                    <FaCheckCircle size={16} /> :
                                                                                    <FaPlayCircle size={16} />
                                                                                }
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${!isEnrolled && !isPreview
                                                                                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                                                                                    : isPreview && !isEnrolled
                                                                                        ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                                                                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                                                                }`}>
                                                                                {!isEnrolled ? (
                                                                                    isPreview ? <FaUnlock size={12} /> : <FaLock size={12} />
                                                                                ) : (
                                                                                    lec.number
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                                                                            {lec.title}
                                                                        </span>
                                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                            {/* Preview Badge */}
                                                                            {isPreview && !isEnrolled && (
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wide">
                                                                                    Free Preview
                                                                                </span>
                                                                            )}

                                                                            {lec.dueDate ? (
                                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isLate
                                                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                                                    {isLate ? 'Late Submission: ' : 'Due: '}
                                                                                    {new Date(lec.dueDate).toLocaleDateString()}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No Due Date</span>
                                                                            )}

                                                                            {/* Status Chip */}
                                                                            <span
                                                                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors`}
                                                                                style={{
                                                                                    backgroundColor: `${course?.lectureStatuses?.find(s => s.label === status)?.color || '#64748b'}20`,
                                                                                    borderColor: `${course?.lectureStatuses?.find(s => s.label === status)?.color || '#64748b'}40`,
                                                                                    color: course?.lectureStatuses?.find(s => s.label === status)?.color || '#64748b'
                                                                                }}
                                                                            >
                                                                                {status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>


                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-md">
                                                                        Watch
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-6 text-center">
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No lectures available.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                        }
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-slate-500 dark:text-slate-400">Course content is being prepared.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        );
    };

    // Render Quizzes Tab
    const renderQuizzesTab = () => {
        if (!quizzesLoaded) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
                </div>
            );
        }

        if (quizzes.length === 0) {
            return (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaClipboardList className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">No Quizzes Available</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quizzes will appear here once added by the instructor.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex items-end justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Course Quizzes</h2>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{quizzes.length} Quiz{quizzes.length !== 1 ? 'zes' : ''}</span>
                </div>

                <div className="grid gap-4">
                    {quizzes.map((quiz) => {
                        const canTake = quiz.attemptsAllowed < 0 || quiz.attemptCount < quiz.attemptsAllowed;
                        const attemptsText = quiz.attemptsAllowed < 0 ? 'Unlimited' : `${quiz.attemptCount}/${quiz.attemptsAllowed}`;

                        return (
                            <div
                                key={quiz._id}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">{quiz.title}</h3>
                                            {quiz.isRequired && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium shrink-0">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        {quiz.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{quiz.description}</p>
                                        )}

                                        {/* Quiz Info */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <FaClipboardList size={10} />
                                                <span>{quiz.questions?.length || 0} Questions</span>
                                            </div>
                                            {quiz.timeLimit > 0 && (
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                    <FaClock size={10} />
                                                    <span>{quiz.timeLimit} min</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <FaRedo size={10} />
                                                <span>Attempts: {attemptsText}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                <FaTrophy size={10} />
                                                <span>Pass: {quiz.passingScore}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Status & Action */}
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 shrink-0">
                                        {quiz.hasPassed ? (
                                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                <FaCheckCircle size={14} />
                                                <span className="text-xs font-semibold">Passed</span>
                                            </div>
                                        ) : quiz.bestScore > 0 ? (
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Best Score</p>
                                                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{quiz.bestScore}%</p>
                                            </div>
                                        ) : null}

                                        {quiz.hasPassed ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/course/${id}/quiz/${quiz._id}`)}
                                                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                                {canTake && (
                                                    <button
                                                        onClick={() => navigate(`/course/${id}/quiz/${quiz._id}?retake=true`)}
                                                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-colors flex items-center gap-1"
                                                    >
                                                        <FaRedo size={10} /> Retake
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/course/${id}/quiz/${quiz._id}`)}
                                                disabled={!canTake}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${canTake
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {canTake ? (quiz.attemptCount > 0 ? 'Retry' : 'Start Quiz') : 'No Attempts Left'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Announcements Tab (using shared component)
    const renderAnnouncementsTab = () => {
        if (!broadcastsLoaded) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
                </div>
            );
        }

        return (
            <BroadcastList
                courseId={id}
                broadcasts={broadcasts}
                pagination={broadcastPagination}
                currentPage={broadcastPage}
                onPageChange={fetchBroadcasts}
                onRefresh={() => fetchBroadcasts(broadcastPage)}
                canBroadcast={canBroadcast}
                isOwner={false}
                currentUserId={user?._id}
            />
        );
    };

    if (!course) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading Course...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">

            {/* Header - Compact on mobile */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-30 transition-colors duration-300 shadow-sm">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">{course.title}</h1>
                        <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{course.description}</p>
                    </div>
                    <button
                        onClick={() => {
                            const resumeLec = getResumeLecture();
                            if (resumeLec) {
                                navigate(`/course/${id}/lecture/${resumeLec._id}`);
                            }
                        }}
                        className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        <FaPlayCircle size={14} /> {hasAnyProgress() ? 'Continue' : 'Start'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="container mx-auto px-3 sm:px-4">
                    <div className="flex gap-0.5 border-t border-gray-100 dark:border-slate-800">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const showBadge = tab.id === 'announcements' && unreadBroadcastCount > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-all border-b-2 -mb-[1px] ${isActive
                                        ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <Icon size={12} />
                                    {tab.label}
                                    {showBadge && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {unreadBroadcastCount > 99 ? '99+' : unreadBroadcastCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {activeTab === 'content' && renderContentTab()}
                {activeTab === 'quizzes' && renderQuizzesTab()}
                {activeTab === 'announcements' && renderAnnouncementsTab()}
                {activeTab === 'ai-assistant' && <AIChatPanel courseId={id} courseTitle={course?.title} />}
            </div>
        </div>
    );
};

export default StudentCourseDetails;
