import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { FiBell, FiX } from 'react-icons/fi';
import moment from 'moment';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getAllNotifications();
            setNotifications(response.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    const getUnreadCount = (notificationsList) => {
        return notificationsList.filter(notification => !notification.isRead).length;
    };

    const markNotificationsAsRead = async (notificationsList) => {
        const unreadNotificationIds = notificationsList
            .filter(notification => !notification.isRead)
            .map(notification => notification._id);

        if (unreadNotificationIds.length > 0) {
            try {
                await notificationService.markAsRead(unreadNotificationIds);
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification => ({
                        ...notification,
                        isRead: notification.isRead || unreadNotificationIds.includes(notification._id)
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
        if (newIsOpen) {
            markNotificationsAsRead(notifications);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggleDropdown}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <FiBell className="w-6 h-6" />
                {getUnreadCount(notifications) > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {getUnreadCount(notifications)}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                                        !notification.isRead
                                            ? 'bg-blue-50'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {moment(notification.createdAt).fromNow()}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-blue-600 hover:text-blue-700"
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
