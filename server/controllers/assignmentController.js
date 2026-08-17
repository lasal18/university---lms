const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Lecturer/Admin only)
exports.createAssignment = async (req, res) => {
  try {
    const { moduleId, title, description, deadline, maximumMarks, allowedFileTypes } = req.body;

    if (!moduleId || !title || !description || !deadline) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const course = await Course.findById(moduleId);
    if (!course) {
      return res.status(404).json({ message: 'Module/Course not found' });
    }

    const assignment = await Assignment.create({
      module: moduleId,
      lecturer: req.user._id,
      title,
      description,
      deadline: new Date(deadline),
      maximumMarks: maximumMarks || 100,
      allowedFileTypes: allowedFileTypes || ['pdf', 'docx', 'zip']
    });

    // Notify students
    if (course.studentsEnrolled && course.studentsEnrolled.length > 0) {
      const notifications = course.studentsEnrolled.map(studentId => ({
        recipient: studentId,
        title: 'New Assignment Released',
        message: `A new assignment "${title}" has been posted for course ${course.title}. Deadline is ${new Date(deadline).toLocaleDateString()}.`,
        type: 'assignment'
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assignments for a course/module
// @route   GET /api/assignments/module/:moduleId
// @access  Private (All roles)
exports.getModuleAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ module: req.params.moduleId }).sort({ deadline: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific assignment details
// @route   GET /api/assignments/:id
// @access  Private (All roles)
exports.getAssignmentDetails = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('module', 'title moduleCode');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Lecturer/Admin only)
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
