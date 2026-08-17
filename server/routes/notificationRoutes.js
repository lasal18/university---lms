const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Retrieve all user-relevant notifications
router.get('/', getNotifications);

// Mark a single notification as read
router.put('/:id/read', markAsRead);

module.exports = router;
