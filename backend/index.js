const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const compilex = require('compilex');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'https://k-hub-praveenkumar753s-projects.vercel.app', // Your actual Vercel backend
        'https://your-frontend-domain.com', // Replace with your actual frontend domain
        'https://k-hub-frontend.vercel.app', // Example if using Vercel
        'https://k-hub-frontend.netlify.app', // Example if using Netlify
        /^https:\/\/.*\.vercel\.app$/, // Allow any Vercel subdomain
        /^https:\/\/.*\.netlify\.app$/, // Allow any Netlify subdomain
        /^https:\/\/.*\.render\.com$/ // Allow any Render subdomain
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));
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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coding-test-app' || 'mongodb+srv://praveen:12345@cluster0.i4zpcov.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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


