import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiBell, FiX, FiSettings } from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const intervalRef = useRef(null);
    const mountedRef = useRef(true);

    // Use useCallback to prevent function recreation on every render
    const fetchNotifications = useCallback(async () => {
        if (!mountedRef.current) return;
        
        try {
            setLoading(true);
            const { notifications } = await notificationService.getAllNotifications();
            if (mountedRef.current) {
                setNotifications(notifications || []);
                setUnreadCount((notifications || []).filter(n => n.status === 'unread').length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (mountedRef.current) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        
        // Initial fetch
        fetchNotifications();
        
        // Set up polling interval (every 3 minutes for global notifications)
        intervalRef.current = setInterval(fetchNotifications, 180000);

        // Cleanup function
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchNotifications]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAsRead = async (notificationIds) => {
        const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
        
        try {
            await notificationService.markAsRead(ids);
            // Update local state instead of refetching
            setNotifications(prev => 
                prev.map(notification => 
                    ids.includes(notification._id) 
                        ? { ...notification, status: 'read' }
                        : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - ids.length));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications
            .filter(n => n.status === 'unread')
            .map(n => n._id);
        
        if (unreadIds.length === 0) return;
        
        await handleMarkAsRead(unreadIds);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-600';
            case 'medium':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-gray-100 text-gray-800'
        };
        
        return colors[priority] || colors.low;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                    unreadCount > 0 
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
                aria-label={`Notifications. ${unreadCount} unread.`}
            >
                <FiBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                    aria-label="Close notifications"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 transition-colors duration-200 ${
                                            notification.status === 'unread' 
                                                ? 'bg-blue-50 hover:bg-blue-100' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className={`font-medium ${getPriorityColor(notification.priority)} ${
                                                        notification.status === 'unread' ? 'font-semibold' : ''
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status === 'unread' && (
                                                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                    )}
                                                    {notification.priority && notification.priority !== 'low' && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(notification.priority)}`}>
                                                            {notification.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                {notification.courseId && (
                                                    <p className="text-xs text-blue-600 mb-1 font-medium">
                                                        📚 Course: {notification.courseId.title}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            </div>
                                            {notification.status === 'unread' && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    className="ml-3 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100 flex-shrink-0"
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No notifications</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    You're all caught up!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Navigate to full notifications page
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-800 font-medium py-1 rounded hover:bg-gray-100 px-2"
                                >
                                    View all notifications
                                </button>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Navigate to notification settings
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                    aria-label="Notification settings"
                                >
                                    <FiSettings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;