const express = require('express');
const router = express.Router();
const { 
  getDashboard, 
  getStudents, 
  toggleUserStatus, 
  getLecturers, 
  createLecturer, 
  assignLecturerToModule 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route guard: only administrators can access these routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/students', getStudents);
router.put('/users/:id/status', toggleUserStatus);
router.get('/lecturers', getLecturers);
router.post('/lecturers', createLecturer);
router.put('/modules/:id/assign', assignLecturerToModule);

module.exports = router;
