const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true
  },
  moduleCode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a course description']
  },
  department: {
    type: String,
    required: [true, 'Please add a department name'],
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lecturerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  enrolledStudentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Pre-save hook to sync legacy fields (instructor, studentsEnrolled) with new fields (lecturerIds, enrolledStudentIds)
CourseSchema.pre('save', function (next) {
  if (this.instructor && !this.lecturerIds.includes(this.instructor)) {
    this.lecturerIds.push(this.instructor);
  }
  if (this.lecturerIds && this.lecturerIds.length > 0 && !this.instructor) {
    this.instructor = this.lecturerIds[0];
  }
  
  // Sync students arrays
  if (this.studentsEnrolled) {
    this.studentsEnrolled.forEach(studentId => {
      if (!this.enrolledStudentIds.includes(studentId)) {
        this.enrolledStudentIds.push(studentId);
      }
    });
  }
  if (this.enrolledStudentIds) {
    this.enrolledStudentIds.forEach(studentId => {
      if (!this.studentsEnrolled.includes(studentId)) {
        this.studentsEnrolled.push(studentId);
      }
    });
  }
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
