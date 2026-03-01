import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AuthContext from '../../context/AuthContext';
import { FaPlayCircle, FaChevronDown, FaChevronUp, FaArrowLeft, FaClock, FaBars, FaTimes, FaStepBackward, FaStepForward, FaStickyNote, FaSave, FaLock } from 'react-icons/fa';
import StatusSelector from '../../components/ui/StatusSelector';
import LectureSidebarItem from '../../components/course/LectureSidebarItem';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const getYouTubeEmbedUrl = (url) => {
    try {
        const parsed = new URL(url);
        let videoId = null;
        if (parsed.hostname === 'youtu.be') {
            videoId = parsed.pathname.slice(1);
        } else {
            videoId = parsed.searchParams.get('v');
        }
        if (!videoId) return null;
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3`;
    } catch {
        return null;
    }
};

const CourseView = () => {
    const { id, lectureId } = useParams(); // Get lectureId from URL
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [course, setCourse] = useState(null);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [isEnrolled, setIsEnrolled] = useState(false);

    // Comments state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // State to toggle section accordion
    const [expandedSections, setExpandedSections] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
    const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Desktop sidebar toggle - open by default
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'discussion'

    // Navigation Helpers
    const getFlattenedLectures = () => {
        if (!course || !course.sections) return [];
        return course.sections.flatMap(section => section.lectures || []);
    };

    const handleNextLecture = () => {
        const lectures = getFlattenedLectures();
        const currentIndex = lectures.findIndex(l => l._id === selectedLecture._id);
        if (currentIndex < lectures.length - 1) {
            handleSelectLecture(lectures[currentIndex + 1]);
        }
    };

    const handlePrevLecture = () => {
        const lectures = getFlattenedLectures();
        const currentIndex = lectures.findIndex(l => l._id === selectedLecture._id);
        if (currentIndex > 0) {
            handleSelectLecture(lectures[currentIndex - 1]);
        }
    };

    useEffect(() => {
        if (course) {
            document.title = `Skill Path | ${course.title}`;
        }
        return () => {
            document.title = 'Skill Path';
        };
    }, [course]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${id}`);
                const courseData = res.data;
                setCourse(courseData);

                // Expand first section by default
                if (courseData.sections && courseData.sections.length > 0) {
                    setExpandedSections({ [courseData.sections[0]._id]: true });
                    // Select first lecture if available
                    if (courseData.sections && courseData.sections.length > 0 && courseData.sections[0].lectures.length > 0) {
                        const firstLec = courseData.sections[0].lectures[0];
                        setSelectedLecture(firstLec);
                        fetchComments(firstLec._id);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCourse();
    }, [id]);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user) return; // Skip if guest
            try {
                const res = await api.get('/courses/my/enrolled');
                const currentCourseProgress = res.data.find(p => p.course._id === id || p.course === id);

                if (currentCourseProgress && currentCourseProgress.completedLectures) {
                    const map = {};
                    currentCourseProgress.completedLectures.forEach(item => {
                        map[item.lecture] = {
                            status: item.status,
                            notes: item.notes,
                            completedAt: item.completedAt
                        };
                    });
                    setProgressMap(map);
                    setIsEnrolled(true);
                } else {
                    setIsEnrolled(false);
                }
            } catch (err) {
                console.error(err);
                setIsEnrolled(false);
            }
        };
        fetchProgress();
    }, [id]);

    const fetchComments = async (lectureId) => {
        try {
            const res = await api.get(`/courses/lectures/${lectureId}/comments`);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to fetch comments");
        }
    };

    // Show toast reminder once when a lecture is manually selected and its status hasn't been updated
    useEffect(() => {
        if (user && selectedLecture && isEnrolled) {
            const status = progressMap[selectedLecture._id]?.status;
            const defaultStatus = course?.lectureStatuses?.[0]?.label || 'Not Started';
            if (!status || status === defaultStatus) {
                toast('Don\'t forget to update your lecture status!', {
                    id: 'lecture-status-reminder',
                    icon: '⏰',
                    duration: 4000,
                    style: {
                        background: '#0f172a',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '14px',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        border: '1px solid #f59e0b',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    },
                });
            }
        }
    }, [selectedLecture?._id]);

    const handleSelectLecture = (lecture) => {
        setSelectedLecture(lecture);
        setCurrentPage(1);
        fetchComments(lecture._id);

        // Sync Notes from progress map
        const lectureProgress = progressMap[lecture._id];
        setNotes(lectureProgress?.notes || '');

        // Auto-expand the section containing this lecture
        if (course && course.sections) {
            const section = course.sections.find(s => s.lectures.some(l => l._id === lecture._id));
            if (section) {
                setExpandedSections({ [section._id]: true });
            }
        }
    };

    // Initialize View based on URL or Default
    useEffect(() => {
        if (course && course.sections?.length > 0) {
            let targetLecture = null;
            let targetSectionId = null;

            if (lectureId) {
                // Find specific lecture from URL
                for (const sec of course.sections) {
                    const found = sec.lectures.find(l => l._id === lectureId);
                    if (found) {
                        targetLecture = found;
                        targetSectionId = sec._id;
                        setNotes(progressMap[found._id]?.notes || '');
                        break;
                    }
                }
            }

            // Fallback to first lecture if no URL param or not found
            if (!targetLecture && !selectedLecture) {
                targetLecture = course.sections[0].lectures[0];
                targetSectionId = course.sections[0]._id;
            }

            if (targetLecture && (!selectedLecture || selectedLecture._id !== targetLecture._id)) {
                setSelectedLecture(targetLecture);
                fetchComments(targetLecture._id);
                setExpandedSections({ [targetSectionId]: true });
            }
        }
    }, [course, lectureId]);

    const handleSaveNotes = async () => {
        if (!selectedLecture || isSavingNotes) return;
        setIsSavingNotes(true);
        try {
            await api.put(`/courses/lectures/${selectedLecture._id}/progress`, {
                notes: notes
            });

            // Update local progress map
            setProgressMap(prev => ({
                ...prev,
                [selectedLecture._id]: {
                    ...prev[selectedLecture._id],
                    notes: notes
                }
            }));
            toast.success('Notes saved!');
        } catch (error) {
            toast.error('Failed to save notes');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleUpdateProgress = async (newStatus, targetLectureId) => {
        const lecId = targetLectureId || selectedLecture?._id;
        if (!lecId) return;
        if (!isEnrolled) {
            toast.error("You are in Preview Mode (Not Enrolled). Progress cannot be saved.");
            return;
        }
        try {
            const existingNotes = progressMap[lecId]?.notes || '';
            const payload = { courseId: id, status: newStatus, notes: existingNotes };
            await api.put(`/courses/lectures/${lecId}/progress`, payload);

            setProgressMap(prev => ({
                ...prev,
                [lecId]: { status: newStatus, notes: existingNotes }
            }));
            toast.success('Progress saved!');
        } catch (err) {
            console.error("Failed to update progress", err);
            toast.error('Failed to save progress');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.post(`/courses/lectures/${selectedLecture._id}/comments`, {
                content: newComment,
                courseId: id
            });

            setNewComment('');
            fetchComments(selectedLecture._id);
            toast.success('Comment posted!');
        } catch (error) {
            toast.error('Error posting comment');
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    if (!course) return <div className="flex justify-center items-center h-screen text-slate-500 font-medium bg-gray-50 dark:bg-slate-950 dark:text-slate-400">Loading Experience...</div>;


    // Check access
    const hasAccess = isEnrolled || (user && user.role === 'admin') || (course && user && course.user === user._id) || (selectedLecture && selectedLecture.isPreview);


    return (
        <div className="bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 font-sans transition-colors duration-300 min-h-screen">

            {/* Mobile Header */}
            <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-3 flex items-center justify-between z-50 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/course/${id}`)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <FaArrowLeft size={16} />
                    </button>
                    <h1 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] text-sm">{course?.title}</h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
            </div>

            <div className="flex relative">
                {/* Mobile Sidebar Overlay (Backdrop) */}
                <div
                    className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar (Sheet-like) */}
                <div className={`
                        fixed lg:sticky top-0 inset-y-0 left-0 h-screen z-40 lg:z-10 shrink-0
                        bg-white dark:bg-slate-900 lg:border-r border-gray-100 dark:border-slate-800 shadow-2xl lg:shadow-none
                        flex flex-col transform transition-all duration-300
                        ${isSidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 w-[280px]'}
                        ${!isSidebarVisible ? 'lg:w-16' : 'lg:w-80'}
                    `}>
                    <div className={`p-3 bg-white dark:bg-slate-900 sticky top-0 z-10 hidden lg:flex items-center border-b border-gray-100 dark:border-slate-800 ${!isSidebarVisible ? 'justify-center' : 'justify-between'}`}>
                        {isSidebarVisible ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => navigate(`/course/${id}`)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                        <FaArrowLeft />
                                    </button>
                                    <h2 className="font-semibold text-slate-900 dark:text-white truncate text-sm" title={course.title}>{course.title}</h2>
                                </div>
                                <button
                                    onClick={() => setIsSidebarVisible(false)}
                                    className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                                    title="Minimize sidebar"
                                >
                                    <FaBars size={18} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsSidebarVisible(true)}
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                                title="Expand sidebar"
                            >
                                <FaBars size={18} />
                            </button>
                        )}
                    </div>

                    {/* Mobile Sidebar Header (Close button) */}
                    <div className="lg:hidden p-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                        <h2 className="font-bold text-slate-900 dark:text-white text-lg">Course Content</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className={`px-1 py-1 space-y-0.5 flex-1 overflow-y-auto ${!isSidebarVisible ? 'hidden' : ''}`}>
                        {course.sections && course.sections.map((section) => {
                            // Section Progress Logic
                            const totalSecLectures = section.lectures ? section.lectures.length : 0;
                            const completionLabel = course.completedStatus || 'Completed';
                            const completedSecLectures = section.lectures ? section.lectures.filter(l => progressMap[l._id]?.status === completionLabel).length : 0;
                            const secPercent = totalSecLectures > 0 ? Math.round((completedSecLectures / totalSecLectures) * 100) : 0;

                            return (
                                <div key={section._id}>
                                    <div className="px-2 pt-1 pb-0.5">
                                        <button
                                            onClick={() => toggleSection(section._id)}
                                            className="w-full flex justify-between items-center group mb-1 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-md p-1 -mx-1 transition-colors"
                                        >
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{section.title}</span>
                                            {expandedSections[section._id] ?
                                                <FaChevronUp className="text-[10px] text-slate-400 dark:text-slate-500" /> :
                                                <FaChevronDown className="text-[10px] text-slate-400 dark:text-slate-500" />
                                            }
                                        </button>
                                        <div className="h-0.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden w-full mb-2">
                                            <div
                                                className="h-full bg-slate-900 dark:bg-blue-600 transition-all duration-500"
                                                style={{ width: `${secPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {expandedSections[section._id] && (
                                        <div className="space-y-0.5 mt-0 mb-3 ml-2 border-l border-gray-100 dark:border-slate-800 pl-2">
                                            {section.lectures.map((lec) => {
                                                const status = progressMap[lec._id]?.status || 'Not Started';
                                                const isSelected = selectedLecture && selectedLecture._id === lec._id;

                                                return (
                                                    <LectureSidebarItem
                                                        key={lec._id}
                                                        lecture={lec}
                                                        isSelected={isSelected}
                                                        onClick={() => {
                                                            handleSelectLecture(lec);
                                                            setIsSidebarOpen(false); // Close sidebar on mobile selection
                                                        }}
                                                        status={status}
                                                        showStatus={true}
                                                        customStatuses={course?.lectureStatuses}
                                                        completedStatus={course?.completedStatus}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Minimized Sidebar - Show lecture numbers only */}
                    {!isSidebarVisible && (
                        <div className="hidden lg:flex flex-col items-center gap-2 py-2 flex-1 overflow-y-auto">
                            {course.sections && course.sections.map((section, sectionIndex) => {
                                // Alternate colors: even sections = black, odd sections = white
                                const isEvenSection = sectionIndex % 2 === 0;

                                return (
                                    <div key={section._id} className="w-full flex flex-col items-center">
                                        {/* Horizontal separator between sections */}
                                        {sectionIndex > 0 && (
                                            <div className="w-full h-px bg-slate-300 dark:bg-slate-700 mb-2"></div>
                                        )}

                                        {/* Bordered Container for Section with Lectures */}
                                        <div
                                            className={`w-12 border-2 rounded-lg p-1 flex flex-col items-center gap-1 ${isEvenSection
                                                ? 'border-slate-900 dark:border-white'
                                                : 'border-slate-300 dark:border-slate-700'
                                                }`}
                                            title={section.title}
                                        >
                                            {/* Lecture Numbers inside the bordered box */}
                                            {section.lectures && section.lectures.map((lec) => {
                                                const status = progressMap[lec._id]?.status || 'Not Started';
                                                const isSelected = selectedLecture && selectedLecture._id === lec._id;
                                                const completionLabel = course.completedStatus || 'Completed';
                                                const isCompleted = status === completionLabel;

                                                return (
                                                    <button
                                                        key={lec._id}
                                                        onClick={() => handleSelectLecture(lec)}
                                                        className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold transition-all ${isSelected
                                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                                            : isCompleted
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                            }`}
                                                        title={`${lec.title} (${status})`}
                                                    >
                                                        {lec.number}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 bg-white dark:bg-slate-950 transition-colors duration-300">
                    {selectedLecture ? (
                        <div className="w-full max-w-[1800px] mx-auto">

                            {/* Video Player - Full Width */}
                            <div className="bg-black w-full" style={{ aspectRatio: '16/9', maxHeight: '65vh' }}>
                                <div className="w-full h-full relative">
                                    {hasAccess ? (
                                        selectedLecture.resourceUrl ? (
                                            selectedLecture.resourceUrl.includes('youtube') || selectedLecture.resourceUrl.includes('youtu.be') ? (
                                                <iframe
                                                    src={getYouTubeEmbedUrl(selectedLecture.resourceUrl)}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title="Video"
                                                ></iframe>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                                    <a href={selectedLecture.resourceUrl} target="_blank" rel="noreferrer" className="text-white hover:text-blue-400 flex flex-col items-center gap-3 transition-colors p-4">
                                                        <FaPlayCircle className="text-5xl" />
                                                        <span className="text-base font-medium text-center">Open External Resource</span>
                                                    </a>
                                                </div>
                                            )
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500 flex-col p-4">
                                                <span className="text-5xl mb-3">📚</span>
                                                <span className="font-medium text-base">No Video Resource</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 z-10 p-6 text-center">
                                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                                                <FaLock size={24} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Content Locked</h3>
                                            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md text-sm">
                                                This lecture is part of the full course. Enroll now to unlock all content.
                                            </p>
                                            {!user ? (
                                                <button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold transition-colors shadow-lg shadow-indigo-500/30 text-sm">
                                                    Login to Enroll
                                                </button>
                                            ) : (
                                                <button onClick={() => navigate(`/marketplace/course/${id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold transition-colors shadow-lg shadow-indigo-500/30 text-sm">
                                                    View Course
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lecture Info Bar */}
                            <div className="px-4 sm:px-6 lg:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    {/* Title and meta */}
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedLecture.title}</h1>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lecture {selectedLecture.number}</span>
                                            {selectedLecture.resourceUrl && (
                                                <a href={selectedLecture.resourceUrl} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-all border border-blue-100 dark:border-blue-800/50">
                                                    <FaPlayCircle className="text-xs" /> Open URL
                                                </a>
                                            )}
                                            {selectedLecture.dueDate && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                                                    <FaClock className="text-xs" /> Due {new Date(selectedLecture.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status + Navigation */}
                                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                                        <div className="flex-1 sm:flex-initial">
                                            <StatusSelector
                                                status={progressMap[selectedLecture._id]?.status || 'Not Started'}
                                                onChange={(newStatus) => handleUpdateProgress(newStatus)}
                                                disabled={false}
                                                customStatuses={course?.lectureStatuses}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={handlePrevLecture}
                                                disabled={getFlattenedLectures().findIndex(l => l._id === selectedLecture._id) === 0}
                                                className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                            >
                                                <FaStepBackward className="group-hover:-translate-x-0.5 transition-transform text-xs" />
                                                <span className="hidden sm:inline">Previous</span>
                                            </button>
                                            <button
                                                onClick={handleNextLecture}
                                                disabled={getFlattenedLectures().findIndex(l => l._id === selectedLecture._id) === getFlattenedLectures().length - 1}
                                                className="group flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed transition-all"
                                            >
                                                <span>Next</span>
                                                <FaStepForward className="group-hover:translate-x-0.5 transition-transform text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Strip */}
                            <div className="flex border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4">
                                {[
                                    { id: 'overview', label: 'Overview' },
                                    { id: 'notes', label: 'Notes', icon: <FaStickyNote className="text-amber-400 text-[10px]" /> },
                                    { id: 'discussion', label: `Discussion${comments.length > 0 ? ` (${comments.length})` : ''}` },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {tab.icon}{tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="px-4 sm:px-6 lg:px-4 py-5 pb-8">

                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div>
                                        {selectedLecture.description ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedLecture.description}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 dark:text-slate-500">No description for this lecture.</p>
                                        )}
                                    </div>
                                )}

                                {/* Notes Tab */}
                                {activeTab === 'notes' && (
                                    <div>
                                        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                            {/* Notes card header */}
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
                                                <div className="flex items-center gap-2">
                                                    <FaStickyNote className="text-amber-500 text-sm" />
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">My Notes</span>
                                                    <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-full">Private</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {notes.length > 0 && (
                                                        <span className="text-[10px] text-slate-400 hidden sm:block">{notes.length.toLocaleString()} chars</span>
                                                    )}
                                                    <button
                                                        onClick={handleSaveNotes}
                                                        disabled={isSavingNotes}
                                                        className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                                                    >
                                                        {isSavingNotes ? (
                                                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <FaSave className="text-xs" />
                                                        )}
                                                        <span>{isSavingNotes ? 'Saving…' : 'Save'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Textarea */}
                                            <textarea
                                                className="w-full min-h-[300px] bg-white dark:bg-slate-900/50 p-5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none resize-y placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-7"
                                                placeholder={`Jot down notes for this lecture…\n\n• Key concepts\n• Timestamps e.g. [2:30]\n• Questions to revisit`}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Discussion Tab */}
                                {activeTab === 'discussion' && (
                                    <div className="space-y-4">
                                        {/* Comment Input */}
                                        <form onSubmit={handleAddComment} className="flex gap-3 items-start">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase shrink-0">
                                                {user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 flex gap-2 items-center bg-slate-50 dark:bg-slate-900 rounded-full px-4 py-2 border border-gray-200 dark:border-slate-700">
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                                                    placeholder="Add a comment…"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newComment.trim()}
                                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                                >
                                                    Post
                                                </button>
                                            </div>
                                        </form>

                                        {/* Comments List */}
                                        {comments.length > 0 ? (
                                            <>
                                                <div className="space-y-3">
                                                    {comments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((comment) => (
                                                        <div key={comment._id} className="flex gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 uppercase">
                                                                {(comment.user?.name || comment.student?.name || '?').charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-3">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        {(comment.user?._id || comment.student?._id) === user?._id ? 'You' : (comment.user?.name || comment.student?.name || 'Unknown')}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">{comment.details}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={Math.ceil(comments.length / itemsPerPage)}
                                                    totalItems={comments.length}
                                                    itemsPerPage={itemsPerPage}
                                                    onPageChange={(newPage) => setCurrentPage(newPage)}
                                                    onLimitChange={(newLimit) => { setItemsPerPage(newLimit); setCurrentPage(1); }}
                                                    compact={true}
                                                />
                                            </>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet. Be the first!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-slate-400 dark:text-slate-500 space-y-4 p-4">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">👈</div>
                            <p className="text-base font-medium text-slate-600 dark:text-slate-400 text-center">Select a lecture from the sidebar to start learning.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseView;
