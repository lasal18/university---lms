const mongoose = require('mongoose');

const LectureMaterialSchema = new mongoose.Schema({
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
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['pdf', 'ppt', 'docx', 'video', 'link', 'other'],
    default: 'pdf'
  },
  fileUrl: {
    type: String
  },
  resourceUrl: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LectureMaterial', LectureMaterialSchema);
