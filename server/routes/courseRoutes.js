const express = require('express');
const router = express.Router();
const { getCourses, createCourse, enrollInCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All course routes require authentication
router.use(protect);

// Get all courses & Create a course (Admin & Lecturers only)
router.route('/')
  .get(getCourses)
  .post(authorize('admin', 'lecturer', 'instructor'), createCourse);

// Enroll in a course (Student only)
router.route('/:id/enroll')
  .post(authorize('student'), enrollInCourse);

module.exports = router;
