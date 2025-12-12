import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiSettings, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';
import notificationService from '../services/notificationService';

const NotificationPanel = ({ 
    type = 'global', // 'global' or 'course'
    courseId = null,
    className = '',
    showSettings = true,
    showRefresh = true,
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    maxHeight = '400px'
}) => {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        getCourseNotifications,
        getCourseUnreadCount,
        loadNotifications,
        loadCourseNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearError,
        refresh
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const dropdownRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    // Get the appropriate notifications and unread count
    const currentNotifications = type === 'course' 
        ? getCourseNotifications(courseId) 
        : notifications;
    
    const currentUnreadCount = type === 'course' 
        ? getCourseUnreadCount(courseId) 
        : unreadCount;

    // Load notifications on mount
    useEffect(() => {
        const loadData = async () => {
            setLocalLoading(true);
            try {
                if (type === 'course' && courseId) {
                    await loadCourseNotifications(courseId);
                } else {
                    await loadNotifications();
                }
            } finally {
                setLocalLoading(false);
            }
        };

        loadData();
    }, [type, courseId, loadNotifications, loadCourseNotifications]);

    // Auto-refresh setup
    useEffect(() => {
        if (autoRefresh && refreshInterval > 0) {
            refreshIntervalRef.current = setInterval(async () => {
                if (type === 'course' && courseId) {
                    await loadCourseNotifications(courseId, { forceRefresh: false });
                } else {
                    await loadNotifications({ forceRefresh: false });
                }
            }, refreshInterval);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            };
        }
    }, [autoRefresh, refreshInterval, type, courseId, loadNotifications, loadCourseNotifications]);

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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (error) {
            clearError();
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const courseIdParam = type === 'course' ? courseId : null;
            await markAllAsRead(courseIdParam);
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const handleRefresh = async () => {
        setLocalLoading(true);
        try {
            const courseIdParam = type === 'course' ? courseId : null;
            await refresh(courseIdParam);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleDelete = async (notificationId) => {
        if (window.confirm('Are you sure you want to delete this notification?')) {
            try {
                await deleteNotification(notificationId);
            } catch (err) {
                console.error('Failed to delete notification:', err);
            }
        }
    };

    const renderNotificationItem = (notification) => (
        <div
            key={notification._id}
            className={`p-4 transition-all duration-200 group hover:bg-gray-50 ${
                notification.status === 'unread' 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'border-l-4 border-l-transparent'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">
                            {notificationService.getNotificationIcon(notification.type)}
                        </span>
                        <h4 className={`font-medium text-gray-900 truncate ${
                            notification.status === 'unread' ? 'font-semibold' : ''
                        }`}>
                            {notification.title}
                        </h4>
                        {notification.status === 'unread' && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                        {notification.priority && notification.priority !== 'low' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                notificationService.getPriorityBadge(notification.priority)
                            }`}>
                                {notification.priority}
                            </span>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-2">
                        {notification.message}
                    </p>
                    
                    {notification.courseId && type !== 'course' && (
                        <p className="text-xs text-blue-600 mb-1 font-medium truncate">
                            📚 Course: {notification.courseId.title || 'Course'}
                        </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            {notificationService.formatRelativeTime(notification.createdAt)}
                        </p>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notification.status === 'unread' && (
                                <button
                                    onClick={() => handleMarkAsRead(notification._id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100"
                                    title="Mark as read"
                                >
                                    Mark read
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(notification._id)}
                                className="text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Delete notification"
                            >
                                <FiTrash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const displayLoading = loading || localLoading;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Notification Button */}
            <button
                onClick={handleToggle}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    currentUnreadCount > 0 
                        ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
                }`}
                aria-label={`${type === 'course' ? 'Course ' : ''}Notifications. ${currentUnreadCount} unread.`}
            >
                <div className="relative">
                    <FiBell className="w-5 h-5" />
                    {currentUnreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
                            {currentUnreadCount > 99 ? '99+' : currentUnreadCount}
                        </span>
                    )}
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                    {type === 'course' ? 'Course Updates' : 'Notifications'}
                </span>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {type === 'course' ? 'Course Notifications' : 'Notifications'}
                            </h3>
                            <div className="flex items-center space-x-2">
                                {showRefresh && (
                                    <button
                                        onClick={handleRefresh}
                                        disabled={displayLoading}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                                        title="Refresh notifications"
                                    >
                                        <FiRefreshCw className={`w-4 h-4 ${displayLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                )}
                                {currentUnreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {showSettings && (
                                    <button
                                        onClick={() => {/* Handle settings */}}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                        title="Notification settings"
                                    >
                                        <FiSettings className="w-4 h-4" />
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
                        {currentUnreadCount > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                                {currentUnreadCount} unread notification{currentUnreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                        {error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto" style={{ maxHeight }}>
                        {displayLoading ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                            </div>
                        ) : currentNotifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {currentNotifications.map(renderNotificationItem)}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No notifications</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {type === 'course' 
                                        ? "You'll see course updates here" 
                                        : "You're all caught up!"
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {currentNotifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Navigate to full notifications page
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-800 font-medium py-1 px-2 rounded hover:bg-gray-100"
                                >
                                    View all notifications
                                </button>
                                <span className="text-xs text-gray-400">
                                    {currentNotifications.length} total
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;