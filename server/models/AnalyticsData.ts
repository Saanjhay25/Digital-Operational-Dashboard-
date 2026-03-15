import mongoose from 'mongoose';

const analyticsDataSchema = new mongoose.Schema({
    dateRange: { type: String, required: true, enum: ['7d', '14d', '30d', 'custom'] },
    performanceData: [{
        day: { type: String, required: true },
        uptime: { type: Number, required: true },
        latency: { type: Number, required: true },
        errors: { type: Number, required: true },
        timestamp: { type: Number, required: true }
    }],
    regionalData: [{
        name: { type: String, required: true },
        used: { type: Number, required: true },
        wasted: { type: Number, required: true }
    }],
    errorData: [{
        name: { type: String, required: true },
        value: { type: Number, required: true },
        color: { type: String, required: true }
    }]
}, {
    timestamps: true
});

const AnalyticsData = mongoose.model('AnalyticsData', analyticsDataSchema);

export default AnalyticsData;
