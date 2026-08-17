const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private (All roles)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find notifications that match either:
    // 1. Specifically sent to this user (recipient == userId)
    // 2. Sent role-wide (targetRole == student/lecturer/admin)
    // 3. Sent to all (targetRole == all)
    // AND the user hasn't read it yet (if role-wide, userId not in readBy; if personal, readStatus is false)
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { targetRole: userRole },
        { targetRole: 'all' }
      ]
    }).sort({ createdAt: -1 });

    // Format to indicate read state per user
    const formattedNotifications = notifications.map(notif => {
      let isRead = false;
      if (notif.recipient) {
        isRead = notif.readStatus;
      } else {
        isRead = notif.readBy.includes(userId);
      }
      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        createdAt: notif.createdAt,
        isRead
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (All roles)
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notif = await Notification.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notif.recipient) {
      if (notif.recipient.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to read this notification' });
      }
      notif.readStatus = true;
    } else {
      if (!notif.readBy.includes(userId)) {
        notif.readBy.push(userId);
      }
    }

    await notif.save();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
