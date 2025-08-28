import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';

const CourseNotifications = ({ courseId }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { notifications } = await notificationService.getCourseNotifications(courseId);
            setNotifications(notifications);
        } catch (error) {
            console.error('Error fetching course notifications:', error);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
            return () => clearInterval(interval);
        }
    }, [courseId, fetchNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead([notificationId]);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
            >
                <FiBell className={unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'} />
                <span className="text-sm font-medium">Course Updates</span>
                {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[60vh] overflow-y-auto">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Course Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`p-4 ${notification.status === 'unread' ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                                        {notification.status === 'unread' && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification._id)}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                No course notifications
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseNotifications;