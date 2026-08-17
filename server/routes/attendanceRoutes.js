const express = require('express');
const router = express.Router();
const { recordAttendance, getAttendance, getStats } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Record/update attendance list (Lecturers & Admins only)
router.post('/', authorize('lecturer', 'admin'), recordAttendance);

// View attendance records (All roles with contextual filters)
router.get('/', getAttendance);

// View attendance statistics summaries (Admins only)
router.get('/stats', authorize('admin'), getStats);

module.exports = router;
