const express = require('express');
const router = express.Router();
const { createAssignment, getModuleAssignments, getAssignmentDetails, deleteAssignment } = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Create Assignment (Lecturers & Admins only)
router.post('/', authorize('lecturer', 'admin'), createAssignment);

// Get assignments for module (All authenticated users)
router.get('/module/:moduleId', getModuleAssignments);

// Get specific assignment details (All authenticated users)
router.get('/:id', getAssignmentDetails);

// Delete assignment (Lecturers & Admins only)
router.delete('/:id', authorize('lecturer', 'admin'), deleteAssignment);

module.exports = router;
