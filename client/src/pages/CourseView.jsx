import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AuthContext from '../context/AuthContext';
import { FaPlayCircle, FaCheckCircle, FaRegCircle, FaChevronDown, FaChevronUp, FaArrowLeft, FaClock, FaBars, FaTimes, FaStepBackward, FaStepForward, FaStickyNote, FaSave, FaLock, FaUnlock } from 'react-icons/fa';
import StatusSelector from '../components/StatusSelector';
import LectureSidebarItem from '../components/LectureSidebarItem';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

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
    const [isSidebarVisible, setIsSidebarVisible] = useState(false); // Desktop sidebar toggle - minimized by default

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
                setExpandedSections(prev => ({
                    ...prev,
                    [section._id]: true
                }));
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
                setExpandedSections(prev => ({ ...prev, [targetSectionId]: true }));
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

    const handleUpdateProgress = async (newStatus) => {
        if (!selectedLecture) return;
        if (!isEnrolled) {
            toast.error("You are in Preview Mode (Not Enrolled). Progress cannot be saved.");
            return;
        }
        try {
            const existingNotes = progressMap[selectedLecture._id]?.notes || '';
            const payload = { courseId: id, status: newStatus, notes: existingNotes };
            await api.put(`/courses/lectures/${selectedLecture._id}/progress`, payload);

            setProgressMap(prev => ({
                ...prev,
                [selectedLecture._id]: { status: newStatus, notes: existingNotes }
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

    const currentProgress = selectedLecture ? progressMap[selectedLecture._id] || { status: 'Not Started', notes: '' } : {};

    // Check access
    const hasAccess = isEnrolled || (user && user.role === 'admin') || (course && user && course.user === user._id) || (selectedLecture && selectedLecture.isPreview);


    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">

            {/* Mobile Header */}
            <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-3 flex items-center justify-between z-20 sticky top-0">
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

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay (Backdrop) */}
                <div
                    className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar (Sheet-like) */}
                <div className={`
                        absolute lg:static inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 lg:border-r border-gray-100 dark:border-slate-800 shadow-2xl lg:shadow-none
                        transform transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col
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
                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300 w-full">
                    {selectedLecture ? (
                        <div className="w-full max-w-[1800px] mx-auto">
                            {/* Top Section: Video + Notes (Side by Side on Desktop) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-4 p-0 lg:p-4">
                                {/* Video Player */}
                                <div className="lg:col-span-2">
                                    <div className="bg-black w-full" style={{ aspectRatio: '16/9', maxHeight: '65vh' }}>
                                        <div className="w-full h-full relative group">
                                            {hasAccess ? (
                                                selectedLecture.resourceUrl ? (
                                                    selectedLecture.resourceUrl.includes('youtube') || selectedLecture.resourceUrl.includes('youtu.be') ? (
                                                        <iframe
                                                            src={selectedLecture.resourceUrl.replace('watch?v=', 'embed/').split('&')[0]}
                                                            className="w-full h-full"
                                                            frameBorder="0"
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
                                                        <button
                                                            onClick={() => navigate('/login')}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold transition-colors shadow-lg shadow-indigo-500/30 text-sm"
                                                        >
                                                            Login to Enroll
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/marketplace/course/${id}`)}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold transition-colors shadow-lg shadow-indigo-500/30 text-sm"
                                                        >
                                                            View Course
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section - Right Side */}
                                <div className="lg:col-span-1 p-4 lg:p-0">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm" style={{ maxHeight: '65vh' }}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                                    <FaStickyNote className="text-amber-500 text-sm" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">My Notes</h3>
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Private</p>
                                                </div>
                                            </div>
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
                                                <span>{isSavingNotes ? 'Saving' : 'Save'}</span>
                                            </button>
                                        </div>

                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-950/50 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/50 transition-all resize-none placeholder:text-slate-400 border border-transparent focus:border-amber-200 dark:focus:border-amber-800/50 leading-relaxed"
                                            style={{ height: 'calc(65vh - 100px)' }}
                                            placeholder="Write notes, timestamps, key points..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        ></textarea>

                                        <div className="mt-2 text-[10px] text-slate-400 text-right">
                                            {notes.length > 0 && `${notes.length.toLocaleString()} chars`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Title, Details and Status Section - All in one line */}
                            <div className="px-4 sm:px-6 lg:px-4 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    {/* Title and Details */}
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedLecture.title}</h1>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lecture {selectedLecture.number}</span>
                                            {selectedLecture.resourceUrl && (
                                                <a
                                                    href={selectedLecture.resourceUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-all border border-blue-100 dark:border-blue-800/50"
                                                >
                                                    <FaPlayCircle className="text-xs" />
                                                    <span className="hidden xs:inline">Open Video URL</span>
                                                    <span className="xs:hidden">URL</span>
                                                </a>
                                            )}
                                            {selectedLecture.dueDate && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                                                    <FaClock className="text-xs" />
                                                    Due {new Date(selectedLecture.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Status Selector and Navigation Buttons */}
                                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                                        {/* Status Selector */}
                                        <div className="flex-1 sm:flex-initial">
                                            <StatusSelector
                                                status={progressMap[selectedLecture._id]?.status || 'Not Started'}
                                                onChange={(newStatus) => handleUpdateProgress(newStatus)}
                                                disabled={false}
                                                customStatuses={course?.lectureStatuses}
                                            />
                                        </div>

                                        {/* Navigation Buttons */}
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

                            {/* Description and Comments */}
                            <div className="px-4 sm:px-6 lg:px-4 py-4 sm:py-6 pb-8">
                                {/* Description (if exists) */}
                                {selectedLecture.description && (
                                    <div className="mb-6 pb-5 border-b border-gray-100 dark:border-slate-800">
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Description</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedLecture.description}</p>
                                    </div>
                                )}

                                {/* Comments Section */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                        Discussion ({comments.length})
                                    </h3>

                                    {/* Comment Input */}
                                    <form onSubmit={handleAddComment} className="flex gap-3 items-start">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 uppercase shrink-0">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 flex gap-2 items-center bg-slate-50 dark:bg-slate-900 rounded-full px-4 py-2 border border-gray-200 dark:border-slate-700">
                                            <input
                                                type="text"
                                                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                                                placeholder="Add a comment..."
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
                                    <div className="space-y-4">
                                        {comments.length > 0 ? (
                                            <>
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

                                                {/* Pagination */}
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={Math.ceil(comments.length / itemsPerPage)}
                                                    totalItems={comments.length}
                                                    itemsPerPage={itemsPerPage}
                                                    onPageChange={(newPage) => setCurrentPage(newPage)}
                                                    onLimitChange={(newLimit) => {
                                                        setItemsPerPage(newLimit);
                                                        setCurrentPage(1);
                                                    }}
                                                    compact={true}
                                                />
                                            </>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet. Be the first to comment!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
