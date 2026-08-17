const express = require('express');
const router = express.Router();
const { submitAssignment, getAssignmentSubmissions, gradeSubmission, getStudentSubmissions } = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Student submits an assignment (multipart file upload)
router.post('/', authorize('student'), upload.single('file'), submitAssignment);

// Get submissions for assignment (Lecturers & Admins only)
router.get('/assignment/:assignmentId', authorize('lecturer', 'admin'), getAssignmentSubmissions);

// Grade a student's submission (Lecturers & Admins only)
router.put('/:id/grade', authorize('lecturer', 'admin'), gradeSubmission);

// Get current student's submission list
router.get('/my-submissions', authorize('student'), getStudentSubmissions);

module.exports = router;
