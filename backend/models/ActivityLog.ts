import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    description: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
