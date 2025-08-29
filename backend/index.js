const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const compilex = require('compilex');
const { initTempDirectory, getCompilerSettings } = require('./utils/compiler');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
    origin: '*',
    credentials: false,
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

// Initialize temp directory
initTempDirectory();

// Initialize CompileX with cross-platform settings
const compilerOptions = getCompilerSettings();
console.log('⚙️ Initializing CompileX with options:', JSON.stringify(compilerOptions, null, 2));
compilex.init(compilerOptions);

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

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
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const contestsRouter = require('./routes/contests');
const submissionsRouter = require('./routes/submissions');
const coursesRouter = require('./routes/courses');
const enrollmentsRouter = require('./routes/enrollments');
const notificationsRouter = require('./routes/notifications');
const quizzesRouter = require('./routes/quizzes');
const tasksRouter = require('./routes/tasks');

app.use('/api/auth', authRouter);
app.use('/api/contests', contestsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/tasks', tasksRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'Server is running',
        timestamp: new Date(),
        platform: process.platform,
        pythonPath: compilerOptions.compilers.python.path
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Cleanup temp directory on exit
process.on('exit', () => {
    console.log('\n🧹 Cleaning up temporary files...');
    try {
        compilex.flush();
    } catch (error) {
        console.error('Error cleaning up temp directory:', error);
    }
});

// Handle cleanup on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\n🧹 Cleaning up...');
    try {
        compilex.flush();
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
    process.exit(0);
});

module.exports = app;
