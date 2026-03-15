import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    notificationId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: String, required: true },
    severity: { type: String, required: true, enum: ['info', 'warning', 'error', 'success'] },
    isRead: { type: Boolean, default: false },
    category: { type: String, required: true }
}, {
    timestamps: true
});

const NotificationModel = mongoose.model('Notification', notificationSchema);

export default NotificationModel;
