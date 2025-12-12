import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';

const CourseNotifications = ({ courseId }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef(null);
    const mountedRef = useRef(true);

    // Use useCallback to prevent function recreation on every render
    const fetchNotifications = useCallback(async () => {
        if (!courseId || !mountedRef.current) return;
        
        try {
            setLoading(true);
            const { notifications } = await notificationService.getCourseNotifications(courseId);
            if (mountedRef.current) {
                setNotifications(notifications || []);
            }
        } catch (error) {
            console.error('Error fetching course notifications:', error);
            if (mountedRef.current) {
                setNotifications([]);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [courseId]);

    useEffect(() => {
        mountedRef.current = true;
        
        if (courseId) {
            // Initial fetch
            fetchNotifications();
            
            // Set up polling interval (every 2 minutes to reduce server load)
            intervalRef.current = setInterval(fetchNotifications, 120000);
        }

        // Cleanup function
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [courseId, fetchNotifications]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead([notificationId]);
            // Update local state instead of refetching all notifications
            setNotifications(prev => 
                prev.map(notification => 
                    notification._id === notificationId 
                        ? { ...notification, status: 'read' }
                        : notification
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications
            .filter(n => n.status === 'unread')
            .map(n => n._id);
        
        if (unreadIds.length === 0) return;

        try {
            await notificationService.markAsRead(unreadIds);
            setNotifications(prev => 
                prev.map(notification => ({ ...notification, status: 'read' }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.notification-dropdown')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return (
        <div className="relative inline-block notification-dropdown">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow transition-all duration-200 ${
                    unreadCount > 0 
                        ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' 
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
                aria-label={`Course notifications. ${unreadCount} unread.`}
            >
                <div className="relative">
                    <FiBell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
                <span className="text-sm font-medium text-gray-700">Course Updates</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Course Notifications</h3>
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
                                    onClick={handleClose}
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
                                                <div className="flex items-center space-x-2">
                                                    <h4 className={`font-medium text-gray-900 ${
                                                        notification.status === 'unread' ? 'font-semibold' : ''
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status === 'unread' && (
                                                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-gray-400">
                                                        {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                    {notification.priority && (
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
                                <p className="text-gray-500 font-medium">No course notifications</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    You'll see updates about this course here
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // You can add navigation to a full notifications page here
                                }}
                                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-1 rounded hover:bg-gray-100"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseNotifications;