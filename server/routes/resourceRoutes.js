const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { verifyCourseContentPermission } = require('../middleware/ownershipMiddleware');
const {
    uploadResource,
    getResources,
    downloadResource,
    deleteResource,
    toggleStudentUploads
} = require('../controllers/resourceController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'image/png', 'image/jpeg', 'image/gif', 'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ];
        cb(null, allowed.includes(file.mimetype));
    }
});

// Teacher toggle for student uploads (before :resourceId routes)
router.put('/:courseId/toggle-student-uploads', protect, verifyCourseContentPermission, toggleStudentUploads);

// Resource routes
router.get('/:courseId', protect, getResources);
router.post('/:courseId', protect, upload.single('file'), uploadResource);
router.get('/:courseId/:resourceId/download', protect, downloadResource);
router.delete('/:courseId/:resourceId', protect, deleteResource);

module.exports = router;
