import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: false },
    password: { type: String, required: true },
    role: { type: String, default: 'operator', enum: ['admin', 'operator'] },
    status: { type: String, default: 'active', enum: ['active', 'suspended'] },
    profileImage: { type: String, default: null },
    mustChangePassword: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
