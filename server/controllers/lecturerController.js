const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Attendance = require('../models/Attendance');
const LectureMaterial = require('../models/LectureMaterial');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get Lecturer Dashboard data
// @route   GET /api/lecturers/dashboard
// @access  Private (Lecturer only)
exports.getDashboard = async (req, res) => {
  try {
    const lecturerId = req.user._id;

    // 1. Assigned Modules
    const assignedModules = await Course.find({
      $or: [
        { instructor: lecturerId },
        { lecturerIds: lecturerId }
      ]
    });

    const moduleIds = assignedModules.map(m => m._id);

    // 2. Count total unique students enrolled
    const studentIdsSet = new Set();
    assignedModules.forEach(course => {
      course.studentsEnrolled.forEach(studentId => {
        studentIdsSet.add(studentId.toString());
      });
    });
    const totalStudents = studentIdsSet.size;

    // 3. Pending assignment submissions (Pending status)
    const assignments = await Assignment.find({ module: { $in: moduleIds } });
    const assignmentIds = assignments.map(a => a._id);
    const pendingSubmissionsCount = await AssignmentSubmission.countDocuments({
      assignment: { $in: assignmentIds },
      status: 'Pending'
    });

    // 4. Recent material uploads
    const recentUploads = await LectureMaterial.find({
      module: { $in: moduleIds }
    }).sort({ createdAt: -1 }).limit(5);

    // 5. Recent assignment deadlines
    const upcomingDeadlines = await Assignment.find({
      module: { $in: moduleIds },
      deadline: { $gt: new Date() }
    }).populate('module', 'title moduleCode').sort({ deadline: 1 }).limit(5);

    // 6. Recent announcements posted by lecturer
    const announcements = await Notification.find({
      recipient: null,
      title: { $regex: 'announcement', $options: 'i' }
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      assignedModules: assignedModules.map(m => ({
        _id: m._id,
        title: m.title,
        moduleCode: m.moduleCode || 'N/A',
        department: m.department,
        studentsCount: m.studentsEnrolled.length
      })),
      totalStudents,
      pendingSubmissionsCount,
      recentUploads,
      upcomingDeadlines,
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students enrolled in lecturer's modules
// @route   GET /api/lecturers/students
// @access  Private (Lecturer only)
exports.getMyStudents = async (req, res) => {
  try {
    const lecturerId = req.user._id;
    const courses = await Course.find({
      $or: [
        { instructor: lecturerId },
        { lecturerIds: lecturerId }
      ]
    }).populate('studentsEnrolled', 'name email studentId status');

    const studentsMap = {};
    courses.forEach(course => {
      course.studentsEnrolled.forEach(student => {
        if (!studentsMap[student._id]) {
          studentsMap[student._id] = {
            _id: student._id,
            name: student.name,
            email: student.email,
            studentId: student.studentId || 'N/A',
            status: student.status || 'active',
            modules: []
          };
        }
        studentsMap[student._id].modules.push({
          _id: course._id,
          title: course.title,
          moduleCode: course.moduleCode || 'N/A'
        });
      });
    });

    res.json(Object.values(studentsMap));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
