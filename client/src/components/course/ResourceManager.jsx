import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { FaUpload, FaTrash, FaDownload, FaFilePdf, FaImage, FaFileAlt, FaLink, FaToggleOn, FaToggleOff, FaTimes, FaCloudUploadAlt, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import toast from 'react-hot-toast';

const FILE_TYPE_ICONS = {
    pdf: FaFilePdf,
    image: FaImage,
    document: FaFileAlt,
    link: FaLink,
};

const FILE_TYPE_COLORS = {
    pdf: 'text-red-500',
    image: 'text-blue-500',
    document: 'text-amber-500',
    link: 'text-indigo-500',
};

const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ResourceManager = ({ courseId, isTeacher = false, userId = null }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [allowStudentUploads, setAllowStudentUploads] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [filter, setFilter] = useState('all'); // all, teacher, student
    const [isTeacherUser, setIsTeacherUser] = useState(false);
    const fileInputRef = useRef(null);

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDesc, setUploadDesc] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadUrl, setUploadUrl] = useState('');
    const [uploadMode, setUploadMode] = useState('file'); // file or link

    const fetchResources = async () => {
        try {
            const res = await api.get(`/resources/${courseId}`);
            setResources(res.data.resources);
            setAllowStudentUploads(res.data.allowStudentUploads);
            setIsTeacherUser(res.data.isTeacher);
        } catch (err) {
            toast.error('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [courseId]);

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            if (uploadMode === 'link') {
                if (!uploadUrl.trim()) {
                    toast.error('Please enter a URL');
                    setUploading(false);
                    return;
                }
                await api.post(`/resources/${courseId}`, {
                    title: uploadTitle || uploadUrl,
                    description: uploadDesc,
                    url: uploadUrl
                });
            } else {
                if (!uploadFile) {
                    toast.error('Please select a file');
                    setUploading(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', uploadFile);
                if (uploadTitle) formData.append('title', uploadTitle);
                if (uploadDesc) formData.append('description', uploadDesc);

                await api.post(`/resources/${courseId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            toast.success('Resource uploaded');
            resetForm();
            fetchResources();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (resourceId) => {
        if (!confirm('Delete this resource?')) return;
        try {
            await api.delete(`/resources/${courseId}/${resourceId}`);
            setResources(prev => prev.filter(r => r._id !== resourceId));
            toast.success('Resource deleted');
        } catch (err) {
            toast.error('Failed to delete resource');
        }
    };

    const handleToggleStudentUploads = async () => {
        try {
            const res = await api.put(`/resources/${courseId}/toggle-student-uploads`);
            setAllowStudentUploads(res.data.allowStudentUploads);
            toast.success(res.data.allowStudentUploads ? 'Student uploads enabled' : 'Student uploads disabled');
        } catch (err) {
            toast.error('Failed to toggle setting');
        }
    };

    const handleDownload = async (resource) => {
        if (resource.fileType === 'link') {
            window.open(resource.url, '_blank');
            return;
        }
        try {
            const res = await api.get(`/resources/${courseId}/${resource._id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', resource.fileName || 'download');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error('Download failed');
        }
    };

    const resetForm = () => {
        setShowUploadForm(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadFile(null);
        setUploadUrl('');
        setUploadMode('file');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const canUpload = isTeacherUser || allowStudentUploads;

    const filteredResources = resources.filter(r => {
        if (filter === 'teacher') return r.uploaderRole === 'teacher';
        if (filter === 'student') return r.uploaderRole === 'student';
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Resources</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {resources.length} resource{resources.length !== 1 ? 's' : ''} shared
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Teacher: toggle student uploads */}
                    {isTeacherUser && (
                        <button
                            onClick={handleToggleStudentUploads}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${allowStudentUploads
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                            title={allowStudentUploads ? 'Student uploads enabled' : 'Student uploads disabled'}
                        >
                            {allowStudentUploads ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                            Student Uploads
                        </button>
                    )}

                    {canUpload && (
                        <button
                            onClick={() => setShowUploadForm(!showUploadForm)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 transition-colors"
                        >
                            <FaUpload size={11} /> Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Upload Form */}
            {showUploadForm && canUpload && (
                <form onSubmit={handleUpload} className="border border-gray-200 dark:border-slate-700/80 rounded-xl overflow-hidden">
                    {/* Compact header with mode toggle */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700/80">
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-700/50 rounded-md p-0.5">
                            <button
                                type="button"
                                onClick={() => setUploadMode('file')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${uploadMode === 'file'
                                    ? 'bg-slate-900 dark:bg-slate-500 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <FaCloudUploadAlt size={11} /> File
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMode('link')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${uploadMode === 'link'
                                    ? 'bg-slate-900 dark:bg-slate-500 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <FaLink size={9} /> Link
                            </button>
                        </div>
                        <button type="button" onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors">
                            <FaTimes size={11} />
                        </button>
                    </div>

                    {/* Form body */}
                    <div className="px-4 py-3 space-y-2.5 bg-white dark:bg-slate-900/50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Title (optional)"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                            />
                            <input
                                type="text"
                                placeholder="Description (optional)"
                                value={uploadDesc}
                                onChange={(e) => setUploadDesc(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {uploadMode === 'file' ? (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={(e) => setUploadFile(e.target.files[0])}
                                        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.txt"
                                        className="flex-1 text-xs text-slate-600 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-600 file:cursor-pointer cursor-pointer file:transition-colors"
                                    />
                                </div>
                            ) : (
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={uploadUrl}
                                    onChange={(e) => setUploadUrl(e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                />
                            )}
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 shrink-0"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                        {uploadMode === 'file' && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Max 10MB — PDF, images, docs, presentations, text</p>
                        )}
                    </div>
                </form>
            )}

            {/* Filter Tabs */}
            {resources.some(r => r.uploaderRole === 'student') && (
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'teacher', label: 'Teacher', icon: FaChalkboardTeacher },
                        { id: 'student', label: 'Student', icon: FaUserGraduate },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f.id
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {f.icon && <f.icon size={10} />}
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Resource List */}
            {filteredResources.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaFileAlt className="text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">No Resources Yet</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {canUpload ? 'Upload notes, images, or share links for the class.' : 'Resources will appear here when shared by the teacher.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredResources.map((resource) => {
                        const Icon = FILE_TYPE_ICONS[resource.fileType] || FaFileAlt;
                        const iconColor = FILE_TYPE_COLORS[resource.fileType] || 'text-slate-500';

                        return (
                            <div
                                key={resource._id}
                                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 group hover:shadow-sm transition-all"
                            >
                                {/* File Icon */}
                                <div className={`w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 ${iconColor}`}>
                                    <Icon size={18} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">{resource.title}</h4>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${resource.uploaderRole === 'teacher'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                            }`}>
                                            {resource.uploaderRole}
                                        </span>
                                    </div>
                                    {resource.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{resource.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                                        <span>{resource.uploadedBy?.name || 'Unknown'}</span>
                                        <span>{new Date(resource.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDownload(resource)}
                                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title={resource.fileType === 'link' ? 'Open Link' : 'Download'}
                                    >
                                        {resource.fileType === 'link' ? <FaLink size={12} /> : <FaDownload size={12} />}
                                    </button>
                                    {(isTeacherUser || (userId && resource.uploadedBy?._id === userId)) && (
                                        <button
                                            onClick={() => handleDelete(resource._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResourceManager;
