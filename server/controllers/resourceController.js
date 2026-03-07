const asyncHandler = require('express-async-handler');
const Resource = require('../models/Resource');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const CourseTeacher = require('../models/CourseTeacher');

// @desc    Upload a resource (teacher or student)
// @route   POST /api/resources/:courseId
const uploadResource = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, url } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    // Determine role
    const isOwner = course.user.toString() === req.user.id;
    const teacherRecord = await CourseTeacher.findOne({ course: courseId, teacher: req.user.id });
    const isTeacher = isOwner || (teacherRecord && (teacherRecord.permissions.manage_content || teacherRecord.permissions.full_access));

    if (!isTeacher) {
        // Check if student & allowed
        const enrolled = await Progress.findOne({ student: req.user.id, course: courseId });
        if (!enrolled) {
            res.status(403);
            throw new Error('Not enrolled in this course');
        }
        if (!course.allowStudentUploads) {
            res.status(403);
            throw new Error('Student uploads are not enabled for this course');
        }
    }

    const uploaderRole = isTeacher ? 'teacher' : 'student';

    // Handle link-type resource
    if (url) {
        const resource = await Resource.create({
            course: courseId,
            uploadedBy: req.user.id,
            title: title || 'Shared Link',
            description: description || '',
            fileType: 'link',
            url,
            uploaderRole
        });

        await resource.populate('uploadedBy', 'name email');
        return res.status(201).json(resource);
    }

    // Handle file upload
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file or provide a URL');
    }

    const file = req.file;
    let fileType = 'document';
    if (file.mimetype.startsWith('image/')) fileType = 'image';
    else if (file.mimetype === 'application/pdf') fileType = 'pdf';

    const resource = await Resource.create({
        course: courseId,
        uploadedBy: req.user.id,
        title: title || file.originalname,
        description: description || '',
        fileType,
        fileData: file.buffer.toString('base64'),
        mimeType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size,
        uploaderRole
    });

    // Don't send fileData back in creation response
    const response = resource.toObject();
    delete response.fileData;
    await Resource.populate(response, { path: 'uploadedBy', select: 'name email' });

    res.status(201).json(response);
});

// @desc    Get all resources for a course
// @route   GET /api/resources/:courseId
const getResources = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    // Verify access: teacher or enrolled student
    const isOwner = course.user.toString() === req.user.id;
    const teacherRecord = await CourseTeacher.findOne({ course: courseId, teacher: req.user.id });
    const isTeacher = isOwner || !!teacherRecord;

    if (!isTeacher) {
        const enrolled = await Progress.findOne({ student: req.user.id, course: courseId });
        if (!enrolled) {
            res.status(403);
            throw new Error('Not enrolled in this course');
        }
    }

    const resources = await Resource.find({ course: courseId })
        .select('-fileData')
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });

    res.json({
        resources,
        allowStudentUploads: course.allowStudentUploads,
        isTeacher
    });
});

// @desc    Download/get a resource file
// @route   GET /api/resources/:courseId/:resourceId/download
const downloadResource = asyncHandler(async (req, res) => {
    const { courseId, resourceId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    // Verify access
    const isOwner = course.user.toString() === req.user.id;
    const teacherRecord = await CourseTeacher.findOne({ course: courseId, teacher: req.user.id });
    const isTeacher = isOwner || !!teacherRecord;

    if (!isTeacher) {
        const enrolled = await Progress.findOne({ student: req.user.id, course: courseId });
        if (!enrolled) {
            res.status(403);
            throw new Error('Not enrolled in this course');
        }
    }

    const resource = await Resource.findById(resourceId);
    if (!resource || resource.course.toString() !== courseId) {
        res.status(404);
        throw new Error('Resource not found');
    }

    if (!resource.fileData) {
        res.status(400);
        throw new Error('No file data available');
    }

    const buffer = Buffer.from(resource.fileData, 'base64');
    res.set({
        'Content-Type': resource.mimeType,
        'Content-Disposition': `attachment; filename="${resource.fileName}"`,
        'Content-Length': buffer.length
    });
    res.send(buffer);
});

// @desc    Delete a resource
// @route   DELETE /api/resources/:courseId/:resourceId
const deleteResource = asyncHandler(async (req, res) => {
    const { courseId, resourceId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    const resource = await Resource.findById(resourceId);
    if (!resource || resource.course.toString() !== courseId) {
        res.status(404);
        throw new Error('Resource not found');
    }

    const isOwner = course.user.toString() === req.user.id;
    const teacherRecord = await CourseTeacher.findOne({ course: courseId, teacher: req.user.id });
    const isTeacher = isOwner || (teacherRecord && (teacherRecord.permissions.manage_content || teacherRecord.permissions.full_access));

    // Teachers can delete any resource, students can only delete their own
    if (!isTeacher && resource.uploadedBy.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this resource');
    }

    await resource.deleteOne();
    res.json({ message: 'Resource deleted' });
});

// @desc    Toggle allowStudentUploads for a course
// @route   PUT /api/resources/:courseId/toggle-student-uploads
const toggleStudentUploads = asyncHandler(async (req, res) => {
    // req.course is attached by verifyCourseContentPermission middleware
    const course = req.course || await Course.findById(req.params.courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    course.allowStudentUploads = !course.allowStudentUploads;
    await course.save();

    res.json({ allowStudentUploads: course.allowStudentUploads });
});

module.exports = {
    uploadResource,
    getResources,
    downloadResource,
    deleteResource,
    toggleStudentUploads
};
