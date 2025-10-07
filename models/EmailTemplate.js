const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        default: 'admin'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
