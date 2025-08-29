import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { FiBell, FiX } from 'react-icons/fi';
import { format } from 'date-fns';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
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
            const response = await notificationService.getAllNotifications();
            if (mountedRef.current) {
                setNotifications(response.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (mountedRef.current) {
                setNotifications([]);
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
        
        // Set up polling interval (every 5 minutes for dropdown notifications)
        intervalRef.current = setInterval(fetchNotifications, 300000);

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [fetchNotifications]);

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
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const getUnreadCount = (notificationsList) => {
        return notificationsList.filter(notification => notification.status === 'unread').length;
    };

    const markNotificationsAsRead = async (notificationsList) => {
        const unreadNotificationIds = notificationsList
            .filter(notification => notification.status === 'unread')
            .map(notification => notification._id);

        if (unreadNotificationIds.length > 0) {
            try {
                await notificationService.markAsRead(unreadNotificationIds);
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification => ({
                        ...notification,
                        status: unreadNotificationIds.includes(notification._id) ? 'read' : notification.status
                    }))
                );
            } catch (error) {
                console.error('Error marking notifications as read:', error);
            }
        }
    };

    const handleToggleDropdown = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (newIsOpen && notifications.length > 0) {
            // Mark as read when opening dropdown
            markNotificationsAsRead(notifications);
        }
    };

    const unreadCount = getUnreadCount(notifications);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggleDropdown}
                className={`relative p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    unreadCount > 0 
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                        : 'text-gray-600 hover:bg-gray-100'
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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-100 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                aria-label="Close notifications"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
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
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No notifications</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    You're all caught up!
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 transition-colors duration-200 ${
                                            notification.status === 'unread'
                                                ? 'bg-blue-50 hover:bg-blue-100'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className={`font-medium text-gray-900 ${
                                                        notification.status === 'unread' ? 'font-semibold' : ''
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status === 'unread' && (
                                                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                {notification.courseId && (
                                                    <p className="text-xs text-blue-600 mb-1 font-medium">
                                                        📚 Course: {notification.courseId.title || 'Course'}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            </div>
                                            {notification.priority && notification.priority !== 'low' && (
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${
                                                    notification.priority === 'high' 
                                                        ? 'bg-red-100 text-red-800'
                                                        : notification.priority === 'medium'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {notification.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 rounded-b-xl text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium py-1 px-2 rounded hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
