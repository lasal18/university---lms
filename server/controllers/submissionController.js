const AssignmentSubmission = require('../models/AssignmentSubmission');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// @desc    Submit an assignment
// @route   POST /api/submissions
// @access  Private (Student only)
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ message: 'Assignment ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an assignment document file' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student already submitted (we can allow re-submissions by replacing the file, or returning an error).
    // Let's support replacing the file (update existing or delete old and create new)
    let submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    const fileUrl = `/uploads/${req.file.filename}`;

    if (submission) {
      // Delete old file
      const oldFilePath = path.join(__dirname, '../', submission.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      submission.fileUrl = fileUrl;
      submission.submittedAt = Date.now();
      submission.status = 'Pending'; // Reset to pending if graded and re-submitted
      await submission.save();
    } else {
      submission = await AssignmentSubmission.create({
        assignment: assignmentId,
        student: req.user._id,
        fileUrl,
        status: 'Pending'
      });
    }

    // Notify lecturer
    await Notification.create({
      recipient: assignment.lecturer,
      title: 'New Assignment Submission',
      message: `Student "${req.user.name}" submitted an assignment for "${assignment.title}".`,
      type: 'assignment'
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private (Lecturer/Admin only)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email studentId')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Lecturer/Admin only)
exports.gradeSubmission = async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    
    if (marks === undefined) {
      return res.status(400).json({ message: 'Marks are required' });
    }

    const submission = await AssignmentSubmission.findById(req.params.id)
      .populate({ path: 'assignment', populate: { path: 'module', select: 'title' } });
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.marks = marks;
    submission.feedback = feedback || '';
    submission.status = 'Graded';
    await submission.save();

    // Notify student of grading
    await Notification.create({
      recipient: submission.student,
      title: 'Assignment Graded',
      message: `Your submission for "${submission.assignment.title}" has been graded. Marks: ${marks}/${submission.assignment.maximumMarks}.`,
      type: 'assignment'
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current student's submissions
// @route   GET /api/submissions/my-submissions
// @access  Private (Student only)
exports.getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ student: req.user._id })
      .populate('assignment', 'title maximumMarks deadline');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
