import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    severity: { type: String, required: true, enum: ['critical', 'high', 'medium', 'low'] },
    status: { type: String, default: 'active', enum: ['active', 'resolved', 'investigating', 'monitoring'] },
    timestamp: { type: Date, default: Date.now },
    affectedServices: [{ type: String }],
    rootCause: { type: String, default: '' },
    resolutionSteps: [{ type: String }]
}, { timestamps: true });

// Ensure virtuals are included in JSON
incidentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc: any, ret: any) { delete ret._id; }
});

const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
