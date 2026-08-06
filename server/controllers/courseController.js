const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    // Populate instructor's name and email
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    // Format output to include computed fields like enrollment count
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      department: course.department,
      instructor: course.instructor ? course.instructor.name : 'Unknown Instructor',
      instructorId: course.instructor ? course.instructor._id : null,
      studentsEnrolledCount: course.studentsEnrolled.length,
      isEnrolled: course.studentsEnrolled.includes(req.user.id),
      studentsEnrolled: course.studentsEnrolled
    }));

    res.json(formattedCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, department } = req.body;

    if (!title || !description || !department) {
      return res.status(400).json({ message: 'Please provide title, description, and department' });
    }

    const course = await Course.create({
      title,
      description,
      department,
      instructor: req.user.id,
      studentsEnrolled: []
    });

    // Populate instructor info to return back to frontend
    const populatedCourse = await Course.findById(course._id).populate('instructor', 'name');

    res.status(201).json({
      _id: populatedCourse._id,
      title: populatedCourse.title,
      description: populatedCourse.description,
      department: populatedCourse.department,
      instructor: populatedCourse.instructor ? populatedCourse.instructor.name : 'Unknown Instructor',
      studentsEnrolledCount: 0,
      isEnrolled: false,
      studentsEnrolled: []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student only)
exports.enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student is already enrolled
    if (course.studentsEnrolled.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    // Add student ID to course enrolled students array
    course.studentsEnrolled.push(req.user.id);
    await course.save();

    res.json({
      message: 'Successfully enrolled in course',
      studentsEnrolledCount: course.studentsEnrolled.length,
      isEnrolled: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
