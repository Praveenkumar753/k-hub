import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiSettings, FiHome } from 'react-icons/fi';

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
                            
                            {isAdmin() && (
                                <Link 
                                    to="/admin" 
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <FiSettings size={18} />
                                    <span>Admin Panel</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <FiUser size={18} />
                            <span className="hidden sm:inline">{user?.fullName}</span>
                            <span className="text-xs bg-blue-700 px-2 py-1 rounded">
                                {user?.role}
                            </span>
                        </div>
                        
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
