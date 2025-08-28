const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for notifications
const createNotificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply authentication middleware
router.use(authenticateToken);

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance

        const processedNotifications = notifications.map(notification => {
            const hasRead = notification.recipients?.some(
                r => r.user?.toString() === req.user._id.toString()
            );
            return {
                ...notification,
                isRead: hasRead,
                readAt: hasRead ? notification.recipients.find(
                    r => r.user?.toString() === req.user._id.toString()
                )?.readAt : null
            };
        });

        res.json({ notifications: processedNotifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get course-specific notifications
router.get('/course/:courseId', async (req, res) => {
    try {
        const notifications = await Notification.find({
            courseId: req.params.courseId,
            type: 'course'
        }).sort({ createdAt: -1 });

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching course notifications:', error);
        res.status(500).json({ error: 'Failed to fetch course notifications' });
    }
});

// Create new notification
router.post('/', createNotificationLimiter, async (req, res) => {
    try {
        const { title, message, type, courseId, priority } = req.body;

        const notification = new Notification({
            title,
            message,
            type,
            courseId: type === 'course' ? courseId : undefined,
            priority,
            createdBy: req.user._id
        });

        await notification.save();
        res.status(201).json({ 
            message: 'Notification created successfully',
            notification 
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Mark notifications as read
router.put('/read', authenticateToken, async (req, res) => {
    try {
        const { notificationIds } = req.body;
        
        if (!Array.isArray(notificationIds)) {
            return res.status(400).json({ error: 'notificationIds must be an array' });
        }

        const updatePromises = notificationIds.map(async (notificationId) => {
            const notification = await Notification.findById(notificationId);
            if (!notification) return;

            const alreadyRead = notification.recipients.some(
                r => r.user.toString() === req.user._id.toString()
            );

            if (!alreadyRead) {
                await Notification.findByIdAndUpdate(notificationId, {
                    $addToSet: {
                        recipients: {
                            user: req.user._id,
                            readAt: new Date()
                        }
                    }
                });
            }
        });

        await Promise.all(updatePromises);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Delete notification (admin only)
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Only allow admins or the creator to delete
        if (req.user.role !== 'admin' && notification.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this notification' });
        }

        await notification.remove();
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;