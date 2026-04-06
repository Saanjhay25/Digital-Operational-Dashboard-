import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger.js';
import { reassignUserIncidents } from '../utils/incidentReassigner.js';
import { logActivity } from '../utils/activityLogger.js';

const client = new OAuth2Client("177884062561-f5ffurl9n6c5ci07cqh72jqc1m9afffm.apps.googleusercontent.com");

export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find({}).select('-password').skip(skip).limit(limit);
        const total = await User.countDocuments({});

        res.json({
            users,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    let { name, email, password, role, status } = req.body;

    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name || email,
            email,
            password: hashedPassword,
            role: role || 'operator',
            status: status || 'active',
            mustChangePassword: true
        });

        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            status: user.status
        });

        logger.info(`New user created by admin: ${user.email}`);
    } catch (error: any) {
        console.error('Failed to create user:', error);
        res.status(500).json({
            message: 'Error creating user',
            error: error.message || 'Unknown database error'
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { email } = req.params;
    const updates = req.body;

    if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
    }

    try {
        const user = await User.findOneAndUpdate({ email }, updates, { new: true }).select('-password');

        if (user) {
            res.json(user);
            logger.info(`User profile updated: ${user.email}`);

            // If user is suspended, reassign their active incidents
            if (updates.status === 'suspended') {
                const adminId = (req.user as any)?._id || 'SYSTEM';
                const adminName = (req.user as any)?.name || 'Admin';
                
                // Activity Log
                const logMessage = `Admin ${adminName} suspended operator ${user.name}`;
                await logActivity(logMessage, adminId.toString(), user._id.toString());

                await reassignUserIncidents(user._id.toString(), adminId.toString());
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email });

        if (user) {
            const adminId = (req.user as any)?._id || 'SYSTEM';
            const adminName = (req.user as any)?.name || 'Admin';
            
            // Activity Log
            const logMessage = `Admin ${adminName} deleted operator ${user.name}`;
            await logActivity(logMessage, adminId.toString(), user._id.toString());

            // Reassign active incidents before deletion
            await reassignUserIncidents(user._id.toString(), adminId.toString());
            
            await User.findByIdAndDelete(user._id);
            
            res.json({ message: 'User deleted successfully' });
            logger.info(`User deleted: ${email}`);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

export const registerUser = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('Registration request received:', req.body);
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name || email,
            password: hashedPassword,
            email: email,
            status: 'active'
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });

        logger.info(`New user registered: ${user.email}`);
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration', error });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('[DEBUG] Login request body:', req.body);

        let { email, password } = req.body;

        // Trim whitespace
        const emailIdentifier = (email || '').toString().trim();
        const plainPassword = (password || '').toString().trim();

        console.log(`[DEBUG] Received identifier: "${emailIdentifier}"`);

        if (!emailIdentifier || !plainPassword) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email: emailIdentifier });

        if (!user) {
            console.log('[DEBUG] Login failed: User not found');
            return res.status(401).json({ message: 'Invalid Username Or Password' });
        }

        const isMatch = await bcrypt.compare(plainPassword, user.password);
        console.log(`[DEBUG] Bcrypt comparison match: ${isMatch}`);

        if (!isMatch) {
            console.log('[DEBUG] Login failed: Password mismatch');
            return res.status(401).json({ message: 'Invalid Username Or Password' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Account Suspended' });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        console.log('[DEBUG] Login successful for user:', user.email);

        logger.info(`User login successful: ${user.email}`);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            mustChangePassword: user.mustChangePassword,
            profileImage: user.profileImage,
            token
        });
    } catch (error: any) {
        console.error('[DEBUG] Server error during login:', error);
        res.status(500).json({ 
            message: 'Server error during login', 
            error: error.message,
            stack: error.stack
        });
    }
};

export const changeSelfPassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.mustChangePassword = false;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error });
    }
};

export const resetUserPassword = async (req: Request, res: Response) => {
    const { email } = req.params;
    const { newPassword } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword, mustChangePassword: true },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: `Password for ${email} has been reset.` });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    const { name, profileImage } = req.body;
    try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

export const getCurrentProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'No credential provided' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: "177884062561-f5ffurl9n6c5ci07cqh72jqc1m9afffm.apps.googleusercontent.com",
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ message: 'Invalid token payload' });
        }

        const { email, name, picture, sub } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // Create user if they don't exist
            user = await User.create({
                email,
                name,
                profileImage: picture,
                provider: 'google',
                googleId: sub,
                role: 'operator',
                status: 'active',
                mustChangePassword: false
            });

            logger.info(`New Google user registered: ${user.email}`);
        } else if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Account Suspended' });
        } else if (!user.googleId) {
            // If user exists but was local, link their Google ID and update provider
            user.googleId = sub;
            user.provider = 'google';
            if (!user.profileImage) user.profileImage = picture;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        logger.info(`Google login successful: ${user.email}`);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            mustChangePassword: user.mustChangePassword,
            profileImage: user.profileImage,
            token
        });
    } catch (error: any) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ 
            message: 'Google authentication failed', 
            error: error.message,
            stack: error.stack
        });
    }
};

export const getOperators = async (req: Request, res: Response) => {
    try {
        // Return ALL operators regardless of status so On-Call Team shows everyone
        const operators = await User.find({ role: 'operator' }).select('name email _id availability status');
        res.json(operators);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching operators', error: error.message });
    }
};

export const updateAvailability = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { availability } = req.body;
    try {
        const user = await User.findByIdAndUpdate(id, { availability }, { new: true }).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating availability', error });
    }
};
