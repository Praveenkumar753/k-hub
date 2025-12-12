import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        teamNumber: '',
        batchYear: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getAllUsers();
            setUsers(response.users);
            setError('');
        } catch (err) {
            setError('Failed to fetch users');
            toast.error('Failed to fetch users');
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

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            await userService.addUser(formData);
            toast.success('User added successfully');
            setFormData({
                name: '',
                username: '',
                email: '',
                teamNumber: '',
                batchYear: ''
            });
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to add user';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            toast.error('Please select a file');
            return;
        }

        try {
            await userService.bulkUploadUsers(file);
            toast.success('Users uploaded successfully');
            setFile(null);
            // Reset file input
            e.target.reset();
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to upload users';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">User Management</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Manual User Addition Form */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Add User Manually</h2>
                    <form onSubmit={handleManualSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Team Number</label>
                            <input
                                type="text"
                                name="teamNumber"
                                value={formData.teamNumber}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Batch Year</label>
                            <input
                                type="text"
                                name="batchYear"
                                value={formData.batchYear}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Add User
                        </button>
                    </form>
                </div>

                {/* Excel Upload Form */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Bulk Upload Users</h2>
                    <form onSubmit={handleFileUpload}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Excel File</label>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Excel file should contain columns: name, username, email, teamNumber, batchYear
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Upload Users
                        </button>
                    </form>
                </div>
            </div>

            {/* User List */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">User List</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">Username</th>
                                <th className="px-6 py-3 text-left">Email</th>
                                <th className="px-6 py-3 text-left">Role</th>
                                <th className="px-6 py-3 text-left">Team Number</th>
                                <th className="px-6 py-3 text-left">Batch Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className="border-b">
                                    <td className="px-6 py-4">{user.fullName}</td>
                                    <td className="px-6 py-4">{user.username}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{user.role}</td>
                                    <td className="px-6 py-4">{user.teamNumber || '-'}</td>
                                    <td className="px-6 py-4">{user.batchYear || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;