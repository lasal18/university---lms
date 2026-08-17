const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Record/Update attendance list
// @route   POST /api/attendance
// @access  Private (Lecturer/Admin only)
exports.recordAttendance = async (req, res) => {
  try {
    const { moduleId, date, records } = req.body; // records = [{ studentId, status: 'Present'/'Absent' }]

    if (!moduleId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Please provide module ID, date, and student records' });
    }

    const course = await Course.findById(moduleId);
    if (!course) {
      return res.status(404).json({ message: 'Module/Course not found' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // Normalize date to midnight

    const savedRecords = [];

    for (const record of records) {
      const { studentId, status } = record;
      
      // Update existing record for student + module + date, or create a new one
      let attendanceRecord = await Attendance.findOne({
        student: studentId,
        module: moduleId,
        date: attendanceDate
      });

      if (attendanceRecord) {
        attendanceRecord.status = status;
        await attendanceRecord.save();
      } else {
        attendanceRecord = await Attendance.create({
          student: studentId,
          module: moduleId,
          lecturer: req.user._id,
          date: attendanceDate,
          status: status
        });
      }
      savedRecords.push(attendanceRecord);
    }

    res.status(201).json({
      message: 'Attendance recorded successfully',
      count: savedRecords.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance records with filters
// @route   GET /api/attendance
// @access  Private (All roles, results filtered by permission)
exports.getAttendance = async (req, res) => {
  try {
    const { studentId, moduleId, date, status } = req.query;
    const query = {};

    // Filter by role permissions
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'lecturer' || req.user.role === 'instructor') {
      // Find lecturer's modules
      const myCourses = await Course.find({
        $or: [{ instructor: req.user._id }, { lecturerIds: req.user._id }]
      });
      const myCourseIds = myCourses.map(c => c._id);
      query.module = { $in: myCourseIds };
      if (moduleId) {
        query.module = moduleId;
      }
      if (studentId) {
        query.student = studentId;
      }
    } else if (req.user.role === 'admin') {
      if (studentId) query.student = studentId;
      if (moduleId) query.module = moduleId;
    }

    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      query.date = filterDate;
    }

    if (status) {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate('student', 'name email studentId')
      .populate('module', 'title moduleCode')
      .populate('lecturer', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance summary/statistics
// @route   GET /api/attendance/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email studentId');
    const courses = await Course.find().populate('instructor', 'name');

    const summary = [];

    for (const student of students) {
      const records = await Attendance.find({ student: student._id });
      const total = records.length;
      const present = records.filter(r => r.status === 'Present').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

      summary.push({
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId || 'N/A',
          email: student.email
        },
        totalClasses: total,
        presentClasses: present,
        percentage
      });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
