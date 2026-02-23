import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaChevronDown, FaBook, FaCog, FaUsers, FaBullhorn, FaUserTie, FaTimes, FaSignOutAlt, FaChartBar, FaClipboardList, FaSearch, FaUserPlus, FaHistory } from 'react-icons/fa';
import Modal from '../components/Modal';
import BroadcastList from '../components/BroadcastList';
import TeacherManagement from '../components/TeacherManagement';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';

const CourseManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useContext(AuthContext);

    // Active tab from URL or default to 'curriculum'
    const activeTab = searchParams.get('tab') || 'curriculum';

    const [course, setCourse] = useState(null);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionIsPublic, setNewSectionIsPublic] = useState(true);
    const [newSectionIsPreview, setNewSectionIsPreview] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});

    // Section State
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState(null);

    // Lecture State
    const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [editingLectureId, setEditingLectureId] = useState(null);
    const [newLecture, setNewLecture] = useState({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending', isPublic: true, isPreview: false });

    // Students State
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [studentPage, setStudentPage] = useState(1);
    const [studentTotalPages, setStudentTotalPages] = useState(1);
    const [studentKeyword, setStudentKeyword] = useState('');
    const [debouncedStudentKeyword, setDebouncedStudentKeyword] = useState('');
    const [enrollEmail, setEnrollEmail] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [studentLimit, setStudentLimit] = useState(15);
    const [studentTotal, setStudentTotal] = useState(0);

    // Broadcast State
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastsLoaded, setBroadcastsLoaded] = useState(false);
    const [allowStudentBroadcasts, setAllowStudentBroadcasts] = useState(false);
    const [broadcastPage, setBroadcastPage] = useState(1);
    const [broadcastPagination, setBroadcastPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [unreadBroadcastCount, setUnreadBroadcastCount] = useState(0);

    // User permissions state
    const [userPermissions, setUserPermissions] = useState({
        isAdmin: false,
        isCreator: false,
        isTeacher: false,
        permissions: {
            manage_content: false,
            manage_students: false,
            full_access: false,
            manage_teachers: false
        }
    });

    // Check if user can manage teachers
    const canManageTeachers = userPermissions.isAdmin || userPermissions.isCreator ||
        userPermissions.permissions.manage_teachers || userPermissions.permissions.full_access;

    // Check if user is owner (admin or creator)
    const isOwner = userPermissions.isAdmin || userPermissions.isCreator;

    // State for dismissing teacher permissions banner
    const [showPermissionsBanner, setShowPermissionsBanner] = useState(true);

    // Tab configuration - Curriculum, Broadcasts, Students, Teachers
    const tabs = [
        { id: 'curriculum', label: 'Curriculum', icon: FaBook },
        { id: 'broadcasts', label: 'Broadcasts', icon: FaBullhorn },
        { id: 'students', label: 'Students', icon: FaUsers },
        { id: 'teachers', label: 'Teachers', icon: FaUserTie },
    ];

    const setActiveTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    // Fetch course data (always needed for header)
    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
            // Initialize expanded sections - only first section expanded by default
            if (res.data.sections && res.data.sections.length > 0) {
                const initialExpanded = {};
                res.data.sections.forEach((section, index) => {
                    initialExpanded[section._id] = index === 0; // Only first section expanded
                });
                setExpandedSections(initialExpanded);
            }
        } catch (err) {
            console.error("Failed to fetch course", err);
        }
    };

    // Fetch students with pagination
    const fetchStudents = async (page = 1, keyword = '') => {
        try {
            const res = await api.get(`/courses/${id}/progresses?page=${page}&limit=${studentLimit}&keyword=${keyword}`);
            setEnrolledStudents(res.data.progresses || res.data);
            setStudentTotalPages(res.data.pages || 1);
            setStudentTotal(res.data.total || 0);
            setStudentsLoaded(true);
        } catch (err) {
            console.error("Failed to fetch students", err);
        }
    };

    // Debounce student search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedStudentKeyword(studentKeyword);
            setStudentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [studentKeyword]);

    // Fetch students when page, limit or search changes
    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents(studentPage, debouncedStudentKeyword);
        }
    }, [studentPage, studentLimit, debouncedStudentKeyword, activeTab]);

    // Fetch broadcasts (lazy load)
    const fetchBroadcasts = async (page = 1) => {
        try {
            const res = await api.get(`/broadcasts/course/${id}?page=${page}&limit=5`);
            setBroadcasts(res.data.broadcasts);
            setBroadcastPagination(res.data.pagination);
            setBroadcastPage(page);
            setBroadcastsLoaded(true);
        } catch (err) {
            console.error("Failed to fetch broadcasts", err);
        }
    };

    const fetchBroadcastSettings = async () => {
        try {
            const res = await api.get(`/broadcasts/course/${id}/can-broadcast`);
            setAllowStudentBroadcasts(res.data.allowStudentBroadcasts || false);
        } catch (err) {
            console.error("Failed to fetch broadcast settings", err);
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

    // Fetch user permissions for this course
    const fetchUserPermissions = async () => {
        try {
            const res = await api.get(`/courses/${id}/my-permissions`);
            setUserPermissions(res.data);
        } catch (err) {
            console.error("Failed to fetch user permissions", err);
        }
    };

    // Initial load - fetch course, unread count, and permissions
    useEffect(() => {
        fetchCourse();
        fetchUnreadCount();
        fetchUserPermissions();
    }, [id]);

    // Lazy load data based on active tab
    useEffect(() => {
        if (activeTab === 'broadcasts') {
            if (!broadcastsLoaded) {
                fetchBroadcasts();
                fetchBroadcastSettings();
            }
            // Mark broadcasts as read when viewing the tab
            if (unreadBroadcastCount > 0) {
                markBroadcastsAsRead();
            }
        }
    }, [activeTab, broadcastsLoaded, unreadBroadcastCount]);

    const handleSaveSection = async (e) => {
        e.preventDefault();
        try {
            if (editingSectionId) {
                await api.put(`/courses/${id}/sections/${editingSectionId}`, { title: newSectionTitle, isPublic: newSectionIsPublic, isPreview: newSectionIsPreview });
            } else {
                await api.post(`/courses/${id}/sections`, { title: newSectionTitle, isPublic: newSectionIsPublic, isPreview: newSectionIsPreview });
            }
            setNewSectionTitle('');
            setNewSectionIsPublic(true);
            setNewSectionIsPreview(false);
            setEditingSectionId(null);
            fetchCourse();
            toast.success(editingSectionId ? 'Section updated!' : 'Section added!');
        } catch (error) {
            toast.error('Error saving section');
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Are you sure? This will delete the section and ALL its lectures.')) return;
        try {
            await api.delete(`/courses/${id}/sections/${sectionId}`);
            fetchCourse();
            toast.success('Section deleted');
        } catch (error) {
            toast.error('Error deleting section');
        }
    };

    const handleSaveLecture = async (e) => {
        e.preventDefault();
        try {
            if (editingLectureId) {
                await api.put(`/courses/lectures/${editingLectureId}`, newLecture);
            } else {
                if (!activeSectionId) return alert('Select a section first');
                await api.post(`/courses/${id}/sections/${activeSectionId}/lectures`, newLecture);
            }

            setNewLecture({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending', isPublic: true });
            setActiveSectionId(null);
            setEditingLectureId(null);
            fetchCourse();
            toast.success(editingLectureId ? 'Lecture updated!' : 'Lecture added!');
        } catch (error) {
            if (!error.handled) {
                toast.error(error.response?.data?.message || 'Error saving lecture');
            }
        }
    };

    const handleEditClick = (lec, sectionId) => {
        setNewLecture({
            title: lec.title,
            number: lec.number,
            resourceUrl: lec.resourceUrl,
            description: lec.description,
            dueDate: lec.dueDate ? lec.dueDate.split('T')[0] : '',
            status: lec.status || 'Pending',
            isPublic: lec.isPublic,
            isPreview: lec.isPreview
        });
        setEditingLectureId(lec._id);
        setActiveSectionId(sectionId);
    };

    const handleDeleteLecture = async (lectureId) => {
        if (!window.confirm('Are you sure you want to delete this lecture?')) return;
        try {
            await api.delete(`/courses/lectures/${lectureId}`);
            fetchCourse();
            toast.success('Lecture deleted');
        } catch (error) {
            toast.error('Error deleting lecture');
        }
    };

    const handleToggleSectionVisibility = async (sectionId, currentStatus) => {
        try {
            await api.put(`/courses/${id}/sections/${sectionId}`, { isPublic: !currentStatus });
            fetchCourse();
            toast.success(currentStatus ? 'Section hidden' : 'Section is now Public');
        } catch (error) {
            toast.error('Error updating visibility');
        }
    };

    const handleToggleLectureVisibility = async (lectureId, currentStatus) => {
        try {
            await api.put(`/courses/lectures/${lectureId}`, { isPublic: !currentStatus });
            fetchCourse();
            toast.success(currentStatus ? 'Lecture hidden' : 'Lecture is now Public');
        } catch (error) {
            toast.error('Error updating visibility');
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Toggle student broadcasts
    const handleToggleStudentBroadcasts = async () => {
        try {
            const res = await api.put(`/broadcasts/course/${id}/settings`);
            setAllowStudentBroadcasts(res.data.allowStudentBroadcasts);
            toast.success(res.data.allowStudentBroadcasts ? 'Students can now broadcast' : 'Student broadcasts disabled');
        } catch (error) {
            toast.error('Error updating broadcast settings');
        }
    };

    // Leave course (for teachers)
    const handleLeaveCourse = async () => {
        if (!window.confirm('Are you sure you want to leave this course? You will lose access to manage this course.')) return;
        try {
            await api.delete(`/courses/${id}/teachers/leave`);
            toast.success('You have left the course');
            navigate('/dashboard');
        } catch (error) {
            if (!error.handled) {
                toast.error(error.response?.data?.message || 'Error leaving course');
            }
        }
    };

    // Enroll student by email
    const handleEnrollStudent = async (e) => {
        e.preventDefault();
        setIsEnrolling(true);
        try {
            await api.post(`/courses/${id}/enroll`, { email: enrollEmail });
            setEnrollEmail('');
            toast.success('Student enrolled successfully');
            fetchStudents(studentPage, debouncedStudentKeyword);
        } catch (error) {
            if (!error.handled) {
                toast.error(error.response?.data?.message || 'Error enrolling student');
            }
        } finally {
            setIsEnrolling(false);
        }
    };

    // Remove student from course
    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to remove ${studentName} from this course? Progress will be lost.`)) return;
        try {
            await api.delete(`/courses/${id}/enroll/${studentId}`);
            toast.success('Student removed from course');
            fetchStudents(studentPage, debouncedStudentKeyword);
        } catch (error) {
            if (!error.handled) {
                toast.error('Failed to remove student');
            }
        }
    };

    if (!course) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading Course...</div>;

    // Render Curriculum Tab Content
    const renderCurriculumTab = () => (
        <div className="space-y-4 sm:space-y-6">
            {/* Sections Header & Add Form */}
            <div className="flex items-start sm:items-end justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Course Curriculum</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Organize your course content into sections and lectures</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/admin/course/${id}/quizzes`)}
                        className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors h-8 sm:h-9"
                    >
                        <FaClipboardList className="text-slate-400" size={10} /> <span className="hidden xs:inline">Quizzes</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingSectionId(null);
                            setNewSectionTitle('');
                            setNewSectionIsPublic(true);
                            setNewSectionIsPreview(false);
                            setIsSectionModalOpen(true);
                        }}
                        className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors h-8 sm:h-9"
                    >
                        + Add Section
                    </button>
                </div>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
                {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section) => (
                        <div key={section._id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-colors duration-300">
                            <div
                                className="bg-gray-50/50 dark:bg-slate-950/50 px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center gap-2 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/50"
                                onClick={() => toggleSection(section._id)}
                            >
                                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center gap-1.5 sm:gap-2 select-none min-w-0">
                                    <div className={`transition-transform duration-200 shrink-0 ${expandedSections[section._id] ? 'rotate-180' : ''}`}>
                                        <FaChevronDown className="text-slate-400 text-xs" />
                                    </div>
                                    <FaBook className="text-slate-300 dark:text-slate-600 text-xs shrink-0 hidden sm:block" />
                                    <span className="truncate">{section.title}</span>
                                    {section.isPreview && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wide shrink-0">
                                            Preview
                                        </span>
                                    )}
                                    <span className="text-[10px] sm:text-xs text-slate-400 font-normal shrink-0">({section.lectures?.length || 0})</span>
                                </h3>
                                <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleToggleSectionVisibility(section._id, section.isPublic)}
                                        className="p-1 sm:p-1.5 transition-colors"
                                        title={section.isPublic ? "Public (Click to Hide)" : "Hidden (Click to Make Public)"}
                                    >
                                        {section.isPublic ? <FaEye className="text-green-500" size={12} /> : <FaEyeSlash className="text-slate-400" size={12} />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingSectionId(section._id);
                                            setNewSectionTitle(section.title);
                                            setNewSectionIsPublic(section.isPublic);
                                            setNewSectionIsPreview(section.isPreview || false);
                                            setIsSectionModalOpen(true);
                                        }}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        title="Edit Section"
                                    >
                                        <FaEdit size={11} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSection(section._id)}
                                        className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Section"
                                    >
                                        <FaTrash size={11} />
                                    </button>
                                    <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 mx-0.5 sm:mx-1 hidden xs:block"></div>
                                    <button
                                        onClick={() => {
                                            setActiveSectionId(section._id);
                                            setEditingLectureId(null);
                                            setNewLecture({ title: '', number: '', resourceUrl: '', description: '', dueDate: '', status: 'Pending', isPublic: true });
                                            setIsLectureModalOpen(true);
                                        }}
                                        className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium transition-colors bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm whitespace-nowrap"
                                    >
                                        + <span className="hidden xs:inline">Add </span>Lecture
                                    </button>
                                </div>
                            </div>

                            {/* Lectures List */}
                            {expandedSections[section._id] && (
                                <div className="divide-y divide-gray-100 dark:divide-slate-800 animate-in slide-in-from-top-2 duration-200">
                                    {section.lectures && section.lectures.length > 0 ? (
                                        section.lectures.map((lec) => (
                                            <div key={lec._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm shrink-0">
                                                        {lec.number}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <a
                                                            href={`/course/${id}/lecture/${lec._id}`}
                                                            className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white hover:underline decoration-slate-400 transition-all cursor-pointer line-clamp-1"
                                                        >
                                                            {lec.title}
                                                        </a>
                                                        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                                                            {lec.dueDate && (
                                                                <span className="text-[9px] sm:text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1 sm:px-1.5 py-0.5 rounded font-medium">
                                                                    Due {new Date(lec.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            {lec.resourceUrl && (
                                                                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 hidden xs:inline">Resource Attached</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() => handleToggleLectureVisibility(lec._id, lec.isPublic)}
                                                        className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                        title={lec.isPublic ? "Public (Click to Hide)" : "Hidden (Click to Make Public)"}
                                                    >
                                                        {lec.isPublic ? <FaEye className="text-green-500" size={11} /> : <FaEyeSlash className="text-slate-400" size={11} />}
                                                    </button>
                                                    <div className="flex items-center gap-2">
                                                        {lec.isPreview && (
                                                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                                Preview
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                handleEditClick(lec, section._id);
                                                                setIsLectureModalOpen(true);
                                                            }}
                                                            className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FaEdit size={11} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLecture(lec._id)}
                                                            className="p-1.5 sm:p-2 text-red-300 dark:text-red-900/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FaTrash size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center">
                                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No lectures yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 border-dashed transition-colors">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaBook className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Start your curriculum</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add a section to organize your lectures.</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Render Students Tab Content
    const renderStudentsTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Student List */}
            <div className="lg:col-span-2 space-y-4">
                {/* Header */}
                <div className="flex items-start sm:items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Manage Students</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">View and manage enrolled students</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors"
                            value={studentKeyword}
                            onChange={(e) => setStudentKeyword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="px-4 sm:px-6 py-4">Student</th>
                                    <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Enrolled Date</th>
                                    <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {!studentsLoaded ? (
                                    <tr><td colSpan="3" className="px-6 py-8 text-center text-xs text-slate-400">Loading...</td></tr>
                                ) : enrolledStudents.length > 0 ? (
                                    enrolledStudents.map((prog) => (
                                        <tr key={prog._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 uppercase">
                                                        {prog.student?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{prog.student?.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{prog.student?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-xs text-slate-500 hidden sm:table-cell">
                                                {new Date(prog.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => navigate(`/admin/course/${id}/student/${prog.student?._id}/progress`)}
                                                        className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                                        title="View Progress"
                                                    >
                                                        <FaChartBar size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/course/${id}/student/${prog.student?._id}`)}
                                                        className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                                        title="View Activity Log"
                                                    >
                                                        <FaHistory size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveStudent(prog.student?._id, prog.student?.name)}
                                                        className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                                        title="Remove Student"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="px-6 py-8 text-center text-xs text-slate-400">No students found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={studentPage}
                        totalPages={studentTotalPages}
                        totalItems={studentTotal}
                        itemsPerPage={studentLimit}
                        onPageChange={(newPage) => setStudentPage(newPage)}
                        onLimitChange={(newLimit) => {
                            setStudentLimit(newLimit);
                            setStudentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Right: Enroll Form */}
            <div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 sticky top-40 transition-colors">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FaUserPlus className="text-slate-400 dark:text-slate-500" /> Enroll New Student
                    </h2>
                    <form onSubmit={handleEnrollStudent} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Student Email</label>
                            <input
                                type="email"
                                className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
                                value={enrollEmail}
                                onChange={(e) => setEnrollEmail(e.target.value)}
                                placeholder="student@example.com"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isEnrolling}
                            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isEnrolling ? 'Enrolling...' : 'Invite User'}
                        </button>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                            The user will be immediately enrolled in this course. They must already have an account on the platform.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );

    // Render Broadcasts Tab Content (using shared component)
    const renderBroadcastsTab = () => {
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
                canBroadcast={true}
                isOwner={isOwner}
                allowStudentBroadcasts={allowStudentBroadcasts}
                onToggleStudentBroadcasts={handleToggleStudentBroadcasts}
                currentUserId={user?._id}
            />
        );
    };

    // Render Teachers Tab Content
    const renderTeachersTab = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Course Teachers</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage teachers and their permissions for this course</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <TeacherManagement
                    courseId={id}
                    canManageTeachers={canManageTeachers}
                    isOwner={isOwner}
                />
            </div>
        </div>
    );



    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 pb-12 transition-colors duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-16 z-10 transition-colors duration-300">
                <div className="container mx-auto px-3 sm:px-4">
                    <div className="h-12 sm:h-16 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">{course.title}</h1>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 shrink-0">
                            <button
                                onClick={() => navigate(`/course/${id}`)}
                                className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors"
                            >
                                <FaEye className="text-slate-400" size={10} /> <span className="hidden xs:inline">Preview</span><span className="xs:hidden">View</span>
                            </button>
                            <button
                                onClick={() => navigate(`/admin/course/${id}/analytics`)}
                                className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors"
                            >
                                <FaChartBar className="text-slate-400" size={10} /> <span className="hidden xs:inline">Analytics</span>
                            </button>
                            <button
                                onClick={() => navigate(`/admin/course/${id}/settings`)}
                                className="flex items-center gap-1 sm:gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium hover:opacity-90 transition-colors"
                            >
                                <FaCog size={10} /> <span className="hidden xs:inline">Settings</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs - Mobile Friendly */}
                    <div className="flex -mb-px overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const showBadge = tab.id === 'broadcasts' && unreadBroadcastCount > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <Icon className="shrink-0 text-[12px] sm:text-sm" />
                                    {tab.label}
                                    {showBadge && (
                                        <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full min-w-[16px] sm:min-w-[18px] text-center">
                                            {unreadBroadcastCount > 99 ? '99+' : unreadBroadcastCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Teacher Permissions Banner - Compact & Mobile Friendly */}
            {userPermissions.isTeacher && !isOwner && showPermissionsBanner && (
                <div className="container mx-auto px-4 pt-3">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5">
                        <div className="flex items-center justify-between gap-2">
                            {/* Left: Icon + Text */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                    <FaUserTie className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white whitespace-nowrap">You're a Teacher</span>
                                        <span className="hidden sm:inline text-slate-400 dark:text-slate-500">|</span>
                                        <div className="flex flex-wrap gap-1">
                                            {userPermissions.permissions.full_access ? (
                                                <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium">
                                                    Full Access
                                                </span>
                                            ) : (
                                                <>
                                                    {userPermissions.permissions.manage_content && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                                                            Content
                                                        </span>
                                                    )}
                                                    {userPermissions.permissions.manage_students && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-medium">
                                                            Students
                                                        </span>
                                                    )}
                                                    {userPermissions.permissions.manage_teachers && (
                                                        <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-medium">
                                                            Teachers
                                                        </span>
                                                    )}
                                                    {!userPermissions.permissions.manage_content &&
                                                        !userPermissions.permissions.manage_students &&
                                                        !userPermissions.permissions.manage_teachers && (
                                                            <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-medium">
                                                                View Only
                                                            </span>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Right: Actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                    onClick={handleLeaveCourse}
                                    className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Leave this course"
                                >
                                    <FaSignOutAlt size={10} />
                                    <span className="hidden xs:inline">Leave</span>
                                </button>
                                <button
                                    onClick={() => setShowPermissionsBanner(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                                    title="Dismiss"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="container mx-auto px-4 py-6">
                {activeTab === 'curriculum' && renderCurriculumTab()}
                {activeTab === 'broadcasts' && renderBroadcastsTab()}
                {activeTab === 'students' && renderStudentsTab()}
                {activeTab === 'teachers' && renderTeachersTab()}
            </div>

            {/* Section Modal */}
            <Modal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                title={editingSectionId ? "Edit Section" : "Add New Section"}
            >
                <form onSubmit={(e) => {
                    handleSaveSection(e);
                    setIsSectionModalOpen(false);
                }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Visible to Students</label>
                        <button
                            type="button"
                            onClick={() => setNewSectionIsPublic(!newSectionIsPublic)}
                            className={`w-9 h-5 rounded-full flex items-center transition-colors px-1 ${newSectionIsPublic ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${newSectionIsPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Section Title</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            placeholder="e.g. Introduction to React"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2 px-1 mb-2">
                        <input
                            type="checkbox"
                            id="isSectionPreview"
                            checked={newSectionIsPreview}
                            onChange={(e) => setNewSectionIsPreview(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="isSectionPreview" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer">
                            Free Preview Section
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-0.5">
                            {editingSectionId ? "Update Section" : "Add Section"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Lecture Modal */}
            <Modal
                isOpen={isLectureModalOpen}
                onClose={() => setIsLectureModalOpen(false)}
                title={editingLectureId ? 'Edit Lecture' : 'New Lecture'}
            >
                <form onSubmit={(e) => {
                    handleSaveLecture(e);
                    setIsLectureModalOpen(false);
                }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Visible to Students</label>
                        <button
                            type="button"
                            onClick={() => setNewLecture({ ...newLecture, isPublic: !newLecture.isPublic })}
                            className={`w-9 h-5 rounded-full flex items-center transition-colors px-1 ${newLecture.isPublic ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${newLecture.isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Number</label>
                            <input
                                type="number"
                                className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                                value={newLecture.number}
                                onChange={(e) => setNewLecture({ ...newLecture, number: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-span-9">
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                                value={newLecture.title}
                                onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Resource URL</label>
                        <input
                            type="url"
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newLecture.resourceUrl}
                            onChange={(e) => setNewLecture({ ...newLecture, resourceUrl: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Due Date</label>
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white"
                            value={newLecture.dueDate}
                            onChange={(e) => setNewLecture({ ...newLecture, dueDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Description</label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-white min-h-[100px]"
                            value={newLecture.description}
                            onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="isPreview"
                            checked={newLecture.isPreview || false}
                            onChange={(e) => setNewLecture({ ...newLecture, isPreview: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="isPreview" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Free Preview (Demo for non-enrolled users)
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-0.5">
                            {editingLectureId ? 'Update Lecture' : 'Save Lecture'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CourseManage;
