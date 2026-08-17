const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// @desc    Initiate and process a repeat exam payment (simulated payment gateway)
// @route   POST /api/payments/repeat-exam
// @access  Private (Student only)
exports.initiateRepeatPayment = async (req, res) => {
  try {
    const { moduleId, amount, cardNumber, cardExpiry, cardCvc } = req.body;

    if (!moduleId || !amount) {
      return res.status(400).json({ message: 'Please provide module ID and payment amount' });
    }

    const course = await Course.findById(moduleId);
    if (!course) {
      return res.status(404).json({ message: 'Module/Course not found' });
    }

    // Generate unique transaction ID and Reference
    const transactionId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const paymentReference = 'REF-' + Date.now().toString().slice(-6);

    // Simulated check card inputs logic (Mock Payment Gateway Abstraction)
    let status = 'Success';
    let errorMessage = '';

    // If card number starts with '4' (Visa) or similar standard mockup
    if (cardNumber && cardNumber.replace(/\s+/g, '').length < 16) {
      status = 'Failed';
      errorMessage = 'Invalid card number length';
    }

    const payment = await Payment.create({
      student: req.user._id,
      paymentType: 'Repeat Exam',
      module: moduleId,
      amount,
      status,
      transactionId,
      paymentReference,
      paidAt: status === 'Success' ? new Date() : null
    });

    // Notify student
    await Notification.create({
      recipient: req.user._id,
      title: status === 'Success' ? 'Payment Successful' : 'Payment Failed',
      message: status === 'Success' 
        ? `Your payment of ${amount} LKR for repeat exam in "${course.title}" was successful. Trans ID: ${transactionId}.`
        : `Your payment of ${amount} LKR for repeat exam in "${course.title}" was declined. Reason: ${errorMessage || 'Gateway Error'}.`,
      type: 'payment'
    });

    if (status === 'Failed') {
      return res.status(402).json({
        message: 'Payment transaction failed. ' + errorMessage,
        payment
      });
    }

    res.status(201).json({
      message: 'Payment completed successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payments list
// @route   GET /api/payments
// @access  Private (Student & Admin)
exports.getPayments = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const payments = await Payment.find(query)
      .populate('student', 'name email studentId')
      .populate('module', 'title moduleCode')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
