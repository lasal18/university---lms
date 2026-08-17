const express = require('express');
const router = express.Router();
const { getDashboard, getMyStudents } = require('../controllers/lecturerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route guard: only lecturers/instructors can access these routes
router.use(protect);
router.use(authorize('lecturer'));

router.get('/dashboard', getDashboard);
router.get('/students', getMyStudents);

module.exports = router;
