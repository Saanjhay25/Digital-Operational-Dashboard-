import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, required: true, enum: ['info', 'warning', 'critical'] },
    isRead: { type: Boolean, default: false },
    category: { type: String, required: true }
}, {
    timestamps: true
});

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;
