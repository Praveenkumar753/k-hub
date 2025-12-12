import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiSettings, FiHome, FiUsers, FiBook } from 'react-icons/fi';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <Link to="/" className="text-xl font-bold flex items-center space-x-2">
                            <span>CodeTest Hub</span>
                        </Link>
                        
                        <div className="hidden md:flex space-x-4">
                            <Link 
                                to="/" 
                                className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <FiHome size={18} />
                                <span>Contests</span>
                            </Link>

                            <Link 
                                to="/courses" 
                                className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <FiBook size={18} />
                                <span>Courses</span>
                            </Link>
                            
                            {isAdmin() && (
                                <>
                                    <Link 
                                        to="/admin" 
                                        className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <FiSettings size={18} />
                                        <span>Admin Panel</span>
                                    </Link>
                                    <Link 
                                        to="/admin/user-management" 
                                        className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <FiUsers size={18} />
                                        <span>Users</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user && (
                            <NotificationPanel 
                                type="global" 
                                autoRefresh={true}
                                refreshInterval={180000} // 3 minutes
                                showSettings={true}
                                showRefresh={true}
                            />
                        )}
                        <Link 
                            to="/profile"
                            className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <FiUser size={18} />
                            <span className="hidden sm:inline">{user?.fullName || 'Profile'}</span>
                            <span className={`text-xs ${user?.role === 'admin' ? 'bg-red-500' : user?.role === 'khub' ? 'bg-green-600' : 'bg-blue-700'} px-2 py-1 rounded`}>
                                {user?.role}
                            </span>
                        </Link>
                        
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <FiLogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
