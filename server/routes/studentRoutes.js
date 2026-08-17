const express = require('express');
const router = express.Router();
const { getDashboard, getProfile } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route guard: only students can access these routes
router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);

module.exports = router;
