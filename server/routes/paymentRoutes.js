const express = require('express');
const router = express.Router();
const { initiateRepeatPayment, getPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Student initiates payment for repeat exam
router.post('/repeat-exam', authorize('student'), initiateRepeatPayment);

// View payment history (Students view their own; Admins view all)
router.get('/', authorize('student', 'admin'), getPayments);

module.exports = router;
