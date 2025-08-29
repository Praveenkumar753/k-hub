import api from './api';

class NotificationService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache
        this.subscribers = new Set();
    }

    // Subscribe to notification updates
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers
    notifySubscribers(data) {
        this.subscribers.forEach(callback => callback(data));
    }

    // Cache management
    getCacheKey(type, id = 'all') {
        return `${type}_${id}`;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // API Methods
    async getAllNotifications(options = {}) {
        const { forceRefresh = false, limit = 50, offset = 0 } = options;
        const cacheKey = this.getCacheKey('all', `${limit}_${offset}`);
        
        if (!forceRefresh) {
            const cached = this.getCache(cacheKey);
            if (cached) return cached;
        }

        try {
            const response = await api.get('/notifications', {
                params: { limit, offset }
            });
            
            const data = {
                notifications: response.data.notifications || [],
                total: response.data.total || 0,
                unreadCount: response.data.unreadCount || 0
            };
            
            this.setCache(cacheKey, data);
            this.notifySubscribers({ type: 'ALL_NOTIFICATIONS', data });
            
            return data;
        } catch (error) {
            console.error('Error fetching all notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }

    async getCourseNotifications(courseId, options = {}) {
        const { forceRefresh = false } = options;
        const cacheKey = this.getCacheKey('course', courseId);
        
        if (!forceRefresh) {
            const cached = this.getCache(cacheKey);
            if (cached) return cached;
        }

        try {
            const response = await api.get(`/notifications/course/${courseId}`);
            
            const data = {
                notifications: response.data.notifications || [],
                unreadCount: (response.data.notifications || []).filter(n => n.status === 'unread').length
            };
            
            this.setCache(cacheKey, data);
            this.notifySubscribers({ type: 'COURSE_NOTIFICATIONS', courseId, data });
            
            return data;
        } catch (error) {
            console.error('Error fetching course notifications:', error);
            throw new Error('Failed to fetch course notifications');
        }
    }

    async markAsRead(notificationIds, options = {}) {
        const { optimistic = true } = options;
        
        if (!Array.isArray(notificationIds)) {
            notificationIds = [notificationIds];
        }

        // Optimistic update
        if (optimistic) {
            this.notifySubscribers({
                type: 'MARK_AS_READ',
                notificationIds,
                optimistic: true
            });
        }

        try {
            const response = await api.put('/notifications/read', { notificationIds });
            
            // Clear related cache
            this.clearCache();
            
            this.notifySubscribers({
                type: 'MARK_AS_READ',
                notificationIds,
                success: true
            });
            
            return response.data;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            
            // Revert optimistic update
            this.notifySubscribers({
                type: 'MARK_AS_READ',
                notificationIds,
                error: true
            });
            
            throw new Error('Failed to mark notifications as read');
        }
    }

    async markAllAsRead(courseId = null) {
        try {
            const endpoint = courseId 
                ? `/notifications/course/${courseId}/read-all`
                : '/notifications/read-all';
                
            const response = await api.put(endpoint);
            
            // Clear cache
            this.clearCache();
            
            this.notifySubscribers({
                type: 'MARK_ALL_AS_READ',
                courseId,
                success: true
            });
            
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw new Error('Failed to mark all notifications as read');
        }
    }

    async createNotification(notificationData) {
        try {
            const response = await api.post('/notifications', notificationData);
            
            // Clear cache to force refresh
            this.clearCache();
            
            this.notifySubscribers({
                type: 'NEW_NOTIFICATION',
                notification: response.data.notification
            });
            
            return response.data;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }

    async deleteNotification(notificationId) {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            
            this.clearCache();
            
            this.notifySubscribers({
                type: 'DELETE_NOTIFICATION',
                notificationId
            });
            
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw new Error('Failed to delete notification');
        }
    }

    // Get unread count efficiently
    async getUnreadCount(courseId = null) {
        const cacheKey = this.getCacheKey('unread', courseId || 'all');
        const cached = this.getCache(cacheKey);
        
        if (cached) return cached;

        try {
            const endpoint = courseId 
                ? `/notifications/course/${courseId}/unread-count`
                : '/notifications/unread-count';
                
            const response = await api.get(endpoint);
            const count = response.data.count || 0;
            
            this.setCache(cacheKey, count);
            return count;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }

    // Utility methods
    getNotificationIcon(type) {
        const icons = {
            'course': '📚',
            'assignment': '📝',
            'quiz': '❓',
            'announcement': '📢',
            'system': '⚙️',
            'reminder': '⏰',
            'achievement': '🏆'
        };
        return icons[type] || '📬';
    }

    getPriorityColor(priority) {
        const colors = {
            'high': 'text-red-600',
            'medium': 'text-yellow-600',
            'low': 'text-gray-600'
        };
        return colors[priority] || 'text-gray-600';
    }

    getPriorityBadge(priority) {
        const badges = {
            'high': 'bg-red-100 text-red-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-gray-100 text-gray-800'
        };
        return badges[priority] || 'bg-gray-100 text-gray-800';
    }

    formatRelativeTime(date) {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffMs = now - notificationDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return notificationDate.toLocaleDateString();
    }
}

// Create singleton instance
const notificationService = new NotificationService();

export { notificationService };
export default notificationService;