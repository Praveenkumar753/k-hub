import React, { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { notifications } = await notificationService.getAllNotifications();
            setNotifications(notifications);
            setUnreadCount(notifications.filter(n => n.status === 'unread').length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAsRead = async (notificationIds) => {
        try {
            await notificationService.markAsRead(Array.isArray(notificationIds) ? notificationIds : [notificationIds]);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
            >
                <FiBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-[80vh] overflow-y-auto">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => handleMarkAsRead(notifications.map(n => n._id))}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`p-4 hover:bg-gray-50 ${
                                        notification.status === 'unread' ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-medium ${getPriorityColor(notification.priority)}`}>
                                            {notification.title}
                                        </h4>
                                        <button
                                            onClick={() => handleMarkAsRead(notification._id)}
                                            className="text-xs text-gray-500 hover:text-blue-600"
                                        >
                                            {notification.status === 'unread' ? 'Mark as read' : 'Read'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                    {notification.courseId && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Course: {notification.courseId.title}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                No notifications
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;