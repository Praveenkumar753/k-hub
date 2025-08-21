const express = require('express');
const Contest = require('../models/Contest');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Get all active contests for users
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const contests = await Contest.find({
            isActive: true,
            endTime: { $gte: now }
        })
        .select('name description startTime endTime duration createdAt')
        .sort({ startTime: 1 });

        res.json({ contests });
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// Get contest details for participants
router.get('/:id', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Check if contest is accessible
        const now = new Date();
        if (!contest.isActive || contest.endTime < now) {
            return res.status(403).json({ error: 'Contest is not accessible' });
        }

        // Don't send test cases to participants (only sample input/output)
        const contestData = {
            _id: contest._id,
            name: contest.name,
            description: contest.description,
            startTime: contest.startTime,
            endTime: contest.endTime,
            duration: contest.duration,
            allowedLanguages: contest.allowedLanguages,
            maxAttempts: contest.maxAttempts,
            questions: contest.questions.map(question => ({
                _id: question._id,
                title: question.title,
                description: question.description,
                difficulty: question.difficulty,
                constraints: question.constraints,
                inputFormat: question.inputFormat,
                outputFormat: question.outputFormat,
                sampleInput: question.sampleInput,
                sampleOutput: question.sampleOutput,
                timeLimit: question.timeLimit,
                memoryLimit: question.memoryLimit,
                totalMarks: question.totalMarks
            }))
        };

        res.json({ contest: contestData });
    } catch (error) {
        console.error('Error fetching contest:', error);
        res.status(500).json({ error: 'Failed to fetch contest' });
    }
});

// Get specific question details
router.get('/:contestId/questions/:questionId', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.contestId);

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        const question = contest.questions.id(req.params.questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Check if contest is accessible
        const now = new Date();
        if (!contest.isActive || contest.endTime < now) {
            return res.status(403).json({ error: 'Contest is not accessible' });
        }

        // Don't send test cases to participants
        const questionData = {
            _id: question._id,
            title: question.title,
            description: question.description,
            difficulty: question.difficulty,
            constraints: question.constraints,
            inputFormat: question.inputFormat,
            outputFormat: question.outputFormat,
            sampleInput: question.sampleInput,
            sampleOutput: question.sampleOutput,
            timeLimit: question.timeLimit,
            memoryLimit: question.memoryLimit,
            totalMarks: question.totalMarks
        };

        res.json({ question: questionData });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

module.exports = router;
