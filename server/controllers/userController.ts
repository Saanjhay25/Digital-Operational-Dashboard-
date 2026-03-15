import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    let { name, username, password, role, status } = req.body;

    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name || username,
            username,
            password: hashedPassword,
            role: role || 'operator',
            status: status || 'active',
            mustChangePassword: true
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            status: user.status
        });
    } catch (error: any) {
        console.error('Failed to create user:', error);
        res.status(500).json({
            message: 'Error creating user',
            error: error.message || 'Unknown database error'
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { username } = req.params;
    const updates = req.body;

    if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
    }

    try {
        const user = await User.findOneAndUpdate({ username }, updates, { new: true }).select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
        const user = await User.findOneAndDelete({ username });

        if (user) {
            res.json({ message: 'User deleted successfully' });
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
        const { name, username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name || username,
            password: hashedPassword,
            username: username
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'supersecretjwtkey12345',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration', error });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('[DEBUG] Login request body:', req.body);

        let { username, email, password } = req.body;

        // Support both username and email, trim whitespace
        const loginIdentifier = (username || email || '').toString().trim();
        const plainPassword = (password || '').toString().trim();

        console.log(`[DEBUG] Received identifier: "${loginIdentifier}"`);

        if (!loginIdentifier || !plainPassword) {
            return res.status(400).json({ message: 'Please provide identifier (username/email) and password' });
        }

        // Find user by username OR email (if email was added to schema, but currently the schema only has username)
        // Since the schema only has 'username', we search by username using the identifier
        const user = await User.findOne({ username: loginIdentifier });

        console.log('[DEBUG] User lookup result found:', !!user);

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
            process.env.JWT_SECRET || 'supersecretjwtkey12345',
            { expiresIn: '7d' }
        );

        console.log('[DEBUG] Login successful for user:', user.username);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            status: user.status,
            mustChangePassword: user.mustChangePassword,
            profileImage: user.profileImage,
            token
        });
    } catch (error) {
        console.error('[DEBUG] Server error during login:', error);
        res.status(500).json({ message: 'Server error during login', error });
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
    const { username } = req.params;
    const { newPassword } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { username },
            { password: hashedPassword, mustChangePassword: true },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: `Password for ${username} has been reset.` });
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
