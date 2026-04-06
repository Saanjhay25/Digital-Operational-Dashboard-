import mongoose from 'mongoose';

const metricsSchema = new mongoose.Schema({
    errorRate: {
        type: Number,
        required: true,
        default: 0
    },
    systemDowntime: {
        type: Number,
        required: true,
        default: 0
    },
    cpuUsage: {
        type: Number,
        required: true,
        default: 0
    },
    requests: {
        type: Number,
        required: true,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Metrics = mongoose.model('Metrics', metricsSchema);

export default Metrics;
