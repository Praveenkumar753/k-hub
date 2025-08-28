import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestService } from '../../services';
import { toast } from 'react-toastify';
import moment from 'moment';
import { 
    FiPlus, 
    FiEdit, 
    FiTrash2, 
    FiEye, 
    FiBarChart2, 
    FiUsers, 
    FiClock, 
    FiCode,
    FiTrendingUp,
    FiActivity,
    FiCalendar,
    FiSettings,
    FiUserPlus,
    FiBell
} from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const AdminDashboard = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        try {
            const data = await contestService.getAdminContests();
            setContests(data.contests);
        } catch (error) {
            toast.error('Failed to fetch contests');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteContest = async (contestId) => {
        if (!window.confirm('Are you sure you want to delete this contest? This action cannot be undone.')) {
            return;
        }

        try {
            await contestService.deleteContest(contestId);
            toast.success('Contest deleted successfully');
            fetchContests();
        } catch (error) {
            toast.error('Failed to delete contest');
            console.error('Error:', error);
        }
    };

    const getContestStatus = (contest) => {
        const now = moment();
        const startTime = moment(contest.startTime);
        const endTime = moment(contest.endTime);

        if (now.isBefore(startTime)) {
            return { status: 'upcoming', color: 'blue', text: 'Upcoming' };
        } else if (now.isBetween(startTime, endTime)) {
            return { status: 'active', color: 'green', text: 'Active' };
        } else {
            return { status: 'ended', color: 'gray', text: 'Ended' };
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

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-blue-100 rounded-lg p-3">
                                    <FiSettings className="w-8 h-8 text-blue-600" />
                                </div>
                                <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                            </div>
                            <p className="text-lg text-gray-600">Manage contests, users, and monitor performance</p>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                to="/admin/user-management"
                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <FiUserPlus className="w-5 h-5 mr-2" />
                                Manage Users
                            </Link>
                            <Link
                                to="/admin/contests/new"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <FiPlus className="w-5 h-5 mr-2" />
                                Create Contest
                            </Link>
                        </div>
                    </div>

                    {/* Admin Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiCode className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{contests.length}</div>
                                    <div className="text-blue-100">Total Contests</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiActivity className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {contests.filter(contest => {
                                            const now = moment();
                                            const startTime = moment(contest.startTime);
                                            const endTime = moment(contest.endTime);
                                            return now.isBetween(startTime, endTime);
                                        }).length}
                                    </div>
                                    <div className="text-green-100">Active Now</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiUsers className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {contests.reduce((total, contest) => total + (contest.questions?.length || 0), 0)}
                                    </div>
                                    <div className="text-purple-100">Total Questions</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiTrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {contests.filter(contest => {
                                            const now = moment();
                                            const startTime = moment(contest.startTime);
                                            return now.isBefore(startTime);
                                        }).length}
                                    </div>
                                    <div className="text-orange-100">Upcoming</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contests Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 rounded-lg p-2">
                                <FiCode className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Contest Management</h2>
                        </div>
                    </div>

                    {contests.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                                <FiCode className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No contests yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Create your first contest to start managing coding challenges and track participant performance.
                            </p>
                            <Link
                                to="/admin/contests/new"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <FiPlus className="w-5 h-5 mr-2" />
                                Create Your First Contest
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Contest Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Schedule
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contests.map((contest) => {
                                        const status = getContestStatus(contest);
                                        return (
                                            <tr key={contest._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`bg-${status.color}-100 rounded-lg p-2`}>
                                                            <FiCode className={`w-5 h-5 text-${status.color}-600`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {contest.name}
                                                            </div>
                                                            <div className="text-sm text-gray-600 max-w-xs truncate">
                                                                {contest.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                                                        <div className={`w-2 h-2 bg-${status.color}-600 rounded-full mr-2`}></div>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                        <FiCalendar className="w-4 h-4" />
                                                        <span>{moment(contest.startTime).format('MMM DD, HH:mm')}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                                        <FiClock className="w-4 h-4" />
                                                        <span>{contest.duration} min</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <div className="flex items-center space-x-1">
                                                            <FiUsers className="w-4 h-4" />
                                                            <span>{contest.questions?.length || 0} questions</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            to={`/admin/contests/${contest._id}`}
                                                            className="inline-flex items-center p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            to={`/admin/contests/${contest._id}/edit`}
                                                            className="inline-flex items-center p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                            title="Edit Contest"
                                                        >
                                                            <FiEdit className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            to={`/admin/contests/${contest._id}/stats`}
                                                            className="inline-flex items-center p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                                            title="View Statistics"
                                                        >
                                                            <FiBarChart2 className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteContest(contest._id)}
                                                            className="inline-flex items-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                            title="Delete Contest"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Notification Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <Link 
                        to="/admin/notifications" 
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FiBell className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Notifications</h2>
                                <p className="text-gray-600">Manage system notifications</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
