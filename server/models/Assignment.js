const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add an assignment title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add an assignment description']
  },
  deadline: {
    type: Date,
    required: [true, 'Please set a submission deadline']
  },
  maximumMarks: {
    type: Number,
    default: 100
  },
  allowedFileTypes: [{
    type: String,
    default: 'pdf'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
