const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

// @desc    Get Admin Dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboard = async (req, res) => {
  try {
    // Aggregated stats
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalLecturers = await User.countDocuments({ role: { $in: ['lecturer', 'instructor'] } });
    const totalModules = await Course.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const pendingSubmissions = await AssignmentSubmission.countDocuments({ status: 'Pending' });

    // Payment stats
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'Pending' });
    const successfulPayments = await Payment.countDocuments({ status: 'Success' });
    
    const successfulPaymentsList = await Payment.find({ status: 'Success' });
    const totalRevenue = successfulPaymentsList.reduce((acc, curr) => acc + curr.amount, 0);

    // Attendance stats
    const totalAttendanceRecords = await Attendance.countDocuments();
    let overallAttendancePercent = 100;
    if (totalAttendanceRecords > 0) {
      const presentCount = await Attendance.countDocuments({ status: 'Present' });
      overallAttendancePercent = Math.round((presentCount / totalAttendanceRecords) * 100);
    }

    // Recent activity list (just simple recent submissions and payments)
    const recentSubmissions = await AssignmentSubmission.find()
      .populate('student', 'name')
      .populate({ path: 'assignment', populate: { path: 'module', select: 'title' } })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find()
      .populate('student', 'name')
      .populate('module', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalStudents,
      totalLecturers,
      totalModules,
      totalAssignments,
      pendingSubmissions,
      totalPayments,
      pendingPayments,
      successfulPayments,
      totalRevenue,
      overallAttendancePercent,
      recentActivity: {
        submissions: recentSubmissions,
        payments: recentPayments
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all students with search & filter
// @route   GET /api/admin/students
// @access  Private (Admin only)
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active/deactivated status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = user.status === 'active' ? 'deactivated' : 'active';
    await user.save();

    res.json({
      message: `User account has been ${user.status}`,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all lecturers
// @route   GET /api/admin/lecturers
// @access  Private (Admin only)
exports.getLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({ role: { $in: ['lecturer', 'instructor'] } }).select('-password');
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create lecturer account
// @route   POST /api/admin/lecturers
// @access  Private (Admin only)
exports.createLecturer = async (req, res) => {
  try {
    const { name, email, password, lecturerId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Lecturer email already exists' });
    }

    const lecturer = await User.create({
      name,
      email,
      password, // Password encryption is handled by User.js pre-save hook
      role: 'lecturer',
      lecturerId: lecturerId || `LEC-${Date.now().toString().slice(-4)}`,
      status: 'active'
    });

    res.status(201).json({
      _id: lecturer._id,
      name: lecturer.name,
      email: lecturer.email,
      role: lecturer.role,
      lecturerId: lecturer.lecturerId,
      status: lecturer.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit module assignment
// @route   PUT /api/admin/modules/:id/assign
// @access  Private (Admin only)
exports.assignLecturerToModule = async (req, res) => {
  try {
    const { lecturerIds } = req.body; // Array of user IDs
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Module/Course not found' });
    }

    course.lecturerIds = lecturerIds;
    if (lecturerIds.length > 0) {
      course.instructor = lecturerIds[0];
    }
    await course.save();

    res.json({
      message: 'Lecturers successfully assigned to module',
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
