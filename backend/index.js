const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const compilex = require('compilex');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration - Allow all origins
app.use(cors({
    origin: '*', // Allow all origins
    credentials: false, // Set to false when using '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`);
    next();
});

// Initialize CompileX
const options = {
    stats: true,
    timeout: 10000
};
compilex.init(options);

// MongoDB connection
const mongoURI = process.env.MONGODB_URI ;
console.log('🔗 Connecting to MongoDB:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/submissions', require('./routes/submissions'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
