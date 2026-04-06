import mongoose from 'mongoose';

export interface IAppLog {
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
    timestamp: Date;
}

const appLogSchema = new mongoose.Schema<IAppLog>({
    level: {
        type: String,
        enum: ['info', 'warning', 'error'],
        required: true,
        default: 'info'
    },
    message: {
        type: String,
        required: true
    },
    source: {
        type: String,
        default: 'System'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// TTL index: auto-delete logs older than 30 days
appLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
// Text index for search
appLogSchema.index({ message: 'text', source: 'text' });

const AppLog = mongoose.model<IAppLog>('AppLog', appLogSchema);
export default AppLog;
