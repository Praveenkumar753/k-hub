import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiEdit2, FiSave, FiX, FiUserCheck, FiCalendar, FiUsers, FiLock } from 'react-icons/fi';
import api from '../services/api';
import Navbar from '../components/Navbar';

const UserProfile = () => {
    const { setUser } = useAuth();
    const [user, setLocalUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: ''
    });
    // Change password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    // Handle password input change
    const handlePasswordInputChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    // Handle password change submit
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setPasswordLoading(true);
        try {
            await api.post('auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully');
            setShowPasswordModal(false);  
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            const userData = response.data.user;
            setLocalUser(userData);
            setFormData({
                fullName: userData.fullName || '',
                email: userData.email || '',
                username: userData.username || ''
            });
        } catch (error) {
            toast.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/auth/profile', formData);
            const updatedUser = response.data.user;
            setLocalUser(updatedUser);
            setUser(updatedUser); // Update auth context
            setEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
                        <p className="text-gray-500">There was an error loading your profile.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-100 rounded-full p-4">
                                    <FiUser className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                                    <p className="text-gray-600">Manage your account information</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {!editing && (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ml-2"
                                >
                                    <FiLock className="w-4 h-4" />
                                    <span>Change Password</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        {editing ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* ...existing code... */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiUser className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiMail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiUserCheck className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({
                                                fullName: user.fullName || '',
                                                email: user.email || '',
                                                username: user.username || ''
                                            });
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <FiX className="w-4 h-4" />
                                        <span>Cancel</span>
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FiSave className="w-4 h-4" />
                                        <span>Save Changes</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500">Full Name</div>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <FiUser className="w-5 h-5 text-gray-400" />
                                                <span className="text-lg text-gray-900">{user.fullName || 'Not set'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-sm font-medium text-gray-500">Email</div>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <FiMail className="w-5 h-5 text-gray-400" />
                                                <span className="text-lg text-gray-900">{user.email || 'Not set'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-sm font-medium text-gray-500">Username</div>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <FiUserCheck className="w-5 h-5 text-gray-400" />
                                                <span className="text-lg text-gray-900">{user.username || 'Not set'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-500">Role</div>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <FiUsers className="w-5 h-5 text-gray-400" />
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                    user.role === 'khub' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {(user.role || 'other').charAt(0).toUpperCase() + (user.role || 'other').slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        {user.role === 'khub' && (
                                            <>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-500">Team Number</div>
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        <FiUsers className="w-5 h-5 text-gray-400" />
                                                        <span className="text-lg text-gray-900">{user.teamNumber || 'Not assigned'}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium text-gray-500">Batch Year</div>
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        <FiCalendar className="w-5 h-5 text-gray-400" />
                                                        <span className="text-lg text-gray-900">{user.batchYear || 'Not assigned'}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPasswordModal(false)}
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                            <FiLock className="w-5 h-5 text-blue-600" />
                            <span>Change Password</span>
                        </h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? (
                                        <span>Saving...</span>
                                    ) : (
                                        <>
                                            <FiSave className="w-4 h-4" />
                                            <span>Change Password</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserProfile;