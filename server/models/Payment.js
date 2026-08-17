const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentType: {
    type: String,
    enum: ['Repeat Exam', 'Tuition', 'Other'],
    default: 'Repeat Exam'
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Success', 'Failed'],
    default: 'Pending'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentReference: {
    type: String
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
