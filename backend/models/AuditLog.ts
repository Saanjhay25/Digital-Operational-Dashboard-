import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    previousOperatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    newOperatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, enum: ['assigned', 'reassigned', 'unassigned'] },
    details: { type: String }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
