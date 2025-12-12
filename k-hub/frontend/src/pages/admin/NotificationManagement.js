import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { courseService } from '../../services/courseService';
import { FiTrash2 } from 'react-icons/fi';

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState([]);
    const [courses, setCourses] = useState([]);
    const [newNotification, setNewNotification] = useState({
        title: '',
        message: '',
        type: 'general',
        courseId: '',
        priority: 'low'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotifications();
        fetchCourses();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationService.getAllNotifications();
            setNotifications(response.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await courseService.getAllCourses();
            setCourses(response.courses);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewNotification(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate required fields
        if (!newNotification.title.trim() || !newNotification.message.trim()) {
            setError('Title and message are required');
            setLoading(false);
            return;
        }

        // Validate course selection for course-specific notifications
        if (newNotification.type === 'course' && !newNotification.courseId) {
            setError('Please select a course');
            setLoading(false);
            return;
        }

        try {
            await notificationService.createNotification(newNotification);
            setNewNotification({
                title: '',
                message: '',
                type: 'general',
                courseId: '',
                priority: 'low'
            });
            fetchNotifications();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create notification');
            console.error('Error creating notification:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-6">Notification Management</h1>
                
                {/* Create Notification Form */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Create New Notification</h2>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={newNotification.title}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message
                            </label>
                            <textarea
                                name="message"
                                value={newNotification.message}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                rows="3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={newNotification.type}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="general">General</option>
                                    <option value="course">Course Specific</option>
                                    <option value="announcement">Announcement</option>
                                </select>
                            </div>

                            {newNotification.type === 'course' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Course
                                    </label>
                                    <select
                                        name="courseId"
                                        value={newNotification.courseId}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                        required={newNotification.type === 'course'}
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map(course => (
                                            <option key={course._id} value={course._id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={newNotification.priority}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Creating...' : 'Create Notification'}
                        </button>
                    </form>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold p-6 border-b">Recent Notifications</h2>
                    <div className="divide-y">
                        {notifications.map(notification => (
                            <div key={notification._id} className="p-6 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-lg">{notification.title}</h3>
                                        <p className="text-gray-600 mt-1">{notification.message}</p>
                                        <div className="flex items-center space-x-4 mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                notification.priority === 'high' 
                                                    ? 'bg-red-100 text-red-800'
                                                    : notification.priority === 'medium'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {notification.priority}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                            {notification.type === 'course' && (
                                                <span className="text-sm text-blue-600">
                                                    {courses.find(c => c._id === notification.courseId)?.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notification._id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FiTrash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationManagement;