import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedOperators = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/opspulse');
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('operator@123', salt);

        const operators = [
            {
                email: 'op1@opspulse.com',
                name: 'Operator One',
                password: hashedPassword,
                role: 'operator',
                status: 'active'
            },
            {
                email: 'op2@opspulse.com',
                name: 'Operator Two',
                password: hashedPassword,
                role: 'operator',
                status: 'active'
            },
            {
                email: 'suspended_op@opspulse.com',
                name: 'Suspended Operator',
                password: hashedPassword,
                role: 'operator',
                status: 'suspended'
            }
        ];

        for (const op of operators) {
            const exists = await User.findOne({ email: op.email });
            if (!exists) {
                await User.create(op);
                console.log(`Created operator: ${op.email}`);
            } else {
                console.log(`Operator already exists: ${op.email}`);
            }
        }

        console.log('Operator seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding operators:', error);
        process.exit(1);
    }
};

seedOperators();
