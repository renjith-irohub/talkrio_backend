const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['Post', 'Comment'],
        required: true,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'type',
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    actionTakenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Moderator/admin who reviewed the report
        default: null,
    },
    actionTakenAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;
