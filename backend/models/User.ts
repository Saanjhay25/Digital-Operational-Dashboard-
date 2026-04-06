import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    password: { type: String, required: false },
    provider: { type: String, default: 'local', enum: ['local', 'google'] },
    googleId: { type: String, required: false },
    role: { type: String, default: 'operator', enum: ['admin', 'operator'] },
    status: { type: String, default: 'active', enum: ['active', 'suspended'] },
    profileImage: { type: String, default: null },
    mustChangePassword: { type: Boolean, default: false },
    availability: { type: String, enum: ['available', 'busy'], default: 'available' }
}, { timestamps: true });

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model('User', userSchema);
export default User;
