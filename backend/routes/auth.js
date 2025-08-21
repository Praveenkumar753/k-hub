const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName, role } = req.body;

        // Debug logging
        console.log('📝 Registration attempt:', { username, email, fullName, role, passwordLength: password?.length });

        // Validate required fields
        if (!username || !email || !password || !fullName) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                error: 'All fields (username, email, password, fullName) are required'
            });
        }

        // Check database connection and existing users
        console.log('🔍 Checking database for existing users...');
        console.log('🔗 MongoDB connection state:', require('mongoose').connection.readyState);
        console.log('📊 Database name:', require('mongoose').connection.name);
        
        // Count total users in database
        const totalUsers = await User.countDocuments();
        console.log('👥 Total users in database:', totalUsers);
        
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            console.log('❌ User already exists:', existingUser.email === email ? 'email' : 'username');
            console.log('📋 Existing user details:', {
                id: existingUser._id,
                email: existingUser.email,
                username: existingUser.username,
                createdAt: existingUser.createdAt
            });
            return res.status(400).json({
                error: 'User with this email or username already exists'
            });
        }
        
        console.log('✅ No existing user found, proceeding with registration...');

        // Create new user
        const user = new User({
            username,
            email,
            password,
            fullName,
            role: role || 'user'
        });

        await user.save();

        console.log('✅ User created successfully:', user.email);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            console.log('❌ Validation errors:', messages);
            return res.status(400).json({
                error: `Validation failed: ${messages.join(', ')}`
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            console.log('❌ Duplicate key error:', field);
            return res.status(400).json({
                error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
