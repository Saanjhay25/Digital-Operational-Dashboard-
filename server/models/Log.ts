import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    time: { type: String, required: true },
    level: { type: String, required: true },
    msg: { type: String, required: true },
    svc: { type: String },
    ip: { type: String },
    location: { type: String },
    status: { type: String },
    type: { type: String, required: true, enum: ['system', 'access'] }
}, {
    timestamps: true
});

const Log = mongoose.model('Log', logSchema);

export default Log;
