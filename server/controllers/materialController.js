const LectureMaterial = require('../models/LectureMaterial');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// @desc    Upload lecture material
// @route   POST /api/materials
// @access  Private (Lecturer/Admin only)
exports.uploadMaterial = async (req, res) => {
  try {
    const { moduleId, title, description, type, resourceUrl } = req.body;

    if (!moduleId || !title) {
      return res.status(400).json({ message: 'Please provide module ID and title' });
    }

    const course = await Course.findById(moduleId);
    if (!course) {
      return res.status(404).json({ message: 'Course/Module not found' });
    }

    let fileUrl = '';
    if (req.file) {
      // Save relative path for frontend access
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const material = await LectureMaterial.create({
      module: moduleId,
      lecturer: req.user._id,
      title,
      description,
      type: type || 'pdf',
      fileUrl,
      resourceUrl: resourceUrl || ''
    });

    // Create notifications for enrolled students
    if (course.studentsEnrolled && course.studentsEnrolled.length > 0) {
      const notifications = course.studentsEnrolled.map(studentId => ({
        recipient: studentId,
        title: 'New Study Material Available',
        message: `New lecture material "${title}" has been uploaded for course ${course.title}.`,
        type: 'material'
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get materials for a course/module
// @route   GET /api/materials/module/:moduleId
// @access  Private (All roles)
exports.getModuleMaterials = async (req, res) => {
  try {
    const materials = await LectureMaterial.find({ module: req.params.moduleId })
      .populate('lecturer', 'name')
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete lecture material
// @route   DELETE /api/materials/:id
// @access  Private (Lecturer/Admin only)
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await LectureMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Delete file from filesystem if exists
    if (material.fileUrl) {
      const filePath = path.join(__dirname, '../', material.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await LectureMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
