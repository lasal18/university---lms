const express = require('express');
const router = express.Router();
const { uploadMaterial, getModuleMaterials, deleteMaterial } = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Upload lecture material (Lecturers & Admins only)
router.post('/', authorize('lecturer', 'admin'), upload.single('file'), uploadMaterial);

// Get materials for module (All logged in users)
router.get('/module/:moduleId', getModuleMaterials);

// Delete lecture material (Lecturers & Admins only)
router.delete('/:id', authorize('lecturer', 'admin'), deleteMaterial);

module.exports = router;
