import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    message: { 
        type: String, 
        required: true 
    },
    performedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    relatedUser: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    incidentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Incident' 
    }
}, {
    timestamps: true
});

// For better JSON representation
logSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc: any, ret: any) { delete ret._id; }
});

const Log = mongoose.model('Log', logSchema);
export default Log;
