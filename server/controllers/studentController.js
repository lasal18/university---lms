const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get Student Dashboard data
// @route   GET /api/students/dashboard
// @access  Private (Student only)
exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Enrolled Modules
    const enrolledModules = await Course.find({
      studentsEnrolled: studentId
    }).populate('instructor', 'name email');

    const moduleIds = enrolledModules.map(m => m._id);

    // 2. Upcoming Assignments
    const now = new Date();
    const upcomingAssignments = await Assignment.find({
      module: { $in: moduleIds },
      deadline: { $gt: now }
    }).populate('module', 'title moduleCode');

    // Filter out assignments already submitted
    const submissions = await AssignmentSubmission.find({ student: studentId });
    const submittedAssignmentIds = submissions.map(s => s.assignment.toString());
    const pendingAssignments = upcomingAssignments.filter(
      a => !submittedAssignmentIds.includes(a._id.toString())
    );

    // 3. Attendance Percentage
    const attendanceRecords = await Attendance.find({
      student: studentId,
      module: { $in: moduleIds }
    });
    
    let attendancePercentage = 100;
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
      attendancePercentage = Math.round((presentCount / attendanceRecords.length) * 100);
    }

    // 4. Payments status
    const repeatPayments = await Payment.find({
      student: studentId,
      paymentType: 'Repeat Exam'
    }).populate('module', 'title moduleCode');

    // 5. Recent Notifications
    const notifications = await Notification.find({
      $or: [
        { recipient: studentId },
        { targetRole: 'student' },
        { targetRole: 'all' }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      enrolledModules: enrolledModules.map(m => ({
        _id: m._id,
        title: m.title,
        moduleCode: m.moduleCode || 'N/A',
        department: m.department,
        instructor: m.instructor ? m.instructor.name : 'Unknown'
      })),
      upcomingAssignments: pendingAssignments,
      attendancePercentage,
      attendanceCount: attendanceRecords.length,
      repeatPayments,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private (Student only)
exports.getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
