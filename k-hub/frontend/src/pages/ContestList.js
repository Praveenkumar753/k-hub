import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestService } from '../services';
import { toast } from 'react-toastify';
import moment from 'moment';
import { 
    FiCalendar, 
    FiClock, 
    FiUsers, 
    FiArrowRight, 
    FiCode, 
    FiAward, 
    FiPlay, 
    FiEye,
    FiTrendingUp,
    FiBookOpen,
    FiTarget,
    FiGrid,
    FiList,
    FiActivity,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';
import Navbar from '../components/Navbar';

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // New tab state
    const [viewMode, setViewMode] = useState('list'); // list or cards view - changed default to list
    const [currentPage, setCurrentPage] = useState(1);
    const [contestsPerPage] = useState(6); // Limit contests per page

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        try {
            const data = await contestService.getContests();
            setContests(data.contests);
        } catch (error) {
            toast.error('Failed to fetch contests');
            console.error('Error fetching contests:', error);
        } finally {
            setLoading(false);
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

    // Filter contests by status
    const getFilteredContests = (status) => {
        const now = moment();
        return contests.filter(contest => {
            const startTime = moment(contest.startTime);
            const endTime = moment(contest.endTime);

            switch (status) {
                case 'active':
                    return now.isBetween(startTime, endTime);
                case 'upcoming':
                    return now.isBefore(startTime);
                case 'completed':
                    return now.isAfter(endTime);
                default:
                    return true;
            }
        });
    };

    // Get tab counts
    const getTabCounts = () => {
        const now = moment();
        const active = contests.filter(contest => {
            const startTime = moment(contest.startTime);
            const endTime = moment(contest.endTime);
            return now.isBetween(startTime, endTime);
        }).length;
        
        const upcoming = contests.filter(contest => {
            const startTime = moment(contest.startTime);
            return now.isBefore(startTime);
        }).length;
        
        const completed = contests.filter(contest => {
            const endTime = moment(contest.endTime);
            return now.isAfter(endTime);
        }).length;

        return { active, upcoming, completed };
    };

    // Pagination logic
    const filteredContests = getFilteredContests(activeTab);
    const indexOfLastContest = currentPage * contestsPerPage;
    const indexOfFirstContest = indexOfLastContest - contestsPerPage;
    const currentContests = filteredContests.slice(indexOfFirstContest, indexOfLastContest);
    const totalPages = Math.ceil(filteredContests.length / contestsPerPage);

    // Reset to first page when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
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
                <div className="mb-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <FiCode className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Coding Contests</h1>
                        <p className="text-lg text-gray-600">Test your programming skills and compete with others!</p>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiTrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{contests.length}</div>
                                    <div className="text-blue-100">Active Contests</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiBookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {contests.reduce((total, contest) => total + (contest.questions?.length || 0), 0)}
                                    </div>
                                    <div className="text-green-100">Total Questions</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                                    <FiTarget className="w-6 h-6" />
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
                                    <div className="text-purple-100">Live Now</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {contests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                            <FiCode className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-medium text-gray-900 mb-3">No contests available</h3>
                        <p className="text-gray-600 mb-6">Check back later for new coding challenges!</p>
                        <div className="flex justify-center space-x-4">
                            <button 
                                onClick={fetchContests}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FiArrowRight className="w-5 h-5 mr-2" />
                                Refresh Page
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Contest Filters and Controls */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                    {/* Contest Status Tabs */}
                                    <div className="flex space-x-1">
                                        {(() => {
                                            const counts = getTabCounts();
                                            return (
                                                <>
                                                    <button
                                                        onClick={() => handleTabChange('active')}
                                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                                            activeTab === 'active' 
                                                                ? 'bg-green-600 text-white' 
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <FiActivity className="w-4 h-4" />
                                                        <span>Live</span>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            activeTab === 'active' 
                                                                ? 'bg-green-700 text-green-100' 
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {counts.active}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleTabChange('upcoming')}
                                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                                            activeTab === 'upcoming' 
                                                                ? 'bg-blue-600 text-white' 
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <FiClock className="w-4 h-4" />
                                                        <span>Upcoming</span>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            activeTab === 'upcoming' 
                                                                ? 'bg-blue-700 text-blue-100' 
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {counts.upcoming}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleTabChange('completed')}
                                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                                            activeTab === 'completed' 
                                                                ? 'bg-gray-600 text-white' 
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <FiTrendingUp className="w-4 h-4" />
                                                        <span>Completed</span>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            activeTab === 'completed' 
                                                                ? 'bg-gray-700 text-gray-100' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {counts.completed}
                                                        </span>
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-600">View:</span>
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setViewMode('cards')}
                                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                                    viewMode === 'cards' 
                                                        ? 'bg-white text-blue-600 shadow-sm' 
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <FiGrid className="w-4 h-4" />
                                                <span>Cards</span>
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                                    viewMode === 'list' 
                                                        ? 'bg-white text-blue-600 shadow-sm' 
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <FiList className="w-4 h-4" />
                                                <span>List</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contest Display */}
                        {filteredContests.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                                    <FiCode className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-medium text-gray-900 mb-3">
                                    {activeTab === 'active' && 'No active contests'}
                                    {activeTab === 'upcoming' && 'No upcoming contests'}
                                    {activeTab === 'completed' && 'No completed contests'}
                                </h3>
                                <p className="text-gray-600">
                                    {activeTab === 'active' && 'All contests have ended or are yet to start.'}
                                    {activeTab === 'upcoming' && 'No contests are scheduled for the future.'}
                                    {activeTab === 'completed' && 'No contests have finished yet.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Cards View */}
                                {viewMode === 'cards' && (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {currentContests.map((contest) => {
                                            const status = getContestStatus(contest);
                                            return (
                                                <div key={contest._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
                                                    {/* Contest Header */}
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="bg-blue-100 rounded-lg p-2">
                                                                    <FiCode className="w-5 h-5 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                                        {contest.name}
                                                                    </h3>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800 flex items-center space-x-1`}>
                                                                {status.status === 'active' && <FiPlay className="w-3 h-3" />}
                                                                {status.status === 'upcoming' && <FiClock className="w-3 h-3" />}
                                                                {status.status === 'ended' && <FiEye className="w-3 h-3" />}
                                                                <span>{status.text}</span>
                                                            </span>
                                                        </div>

                                                        <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed">
                                                            {contest.description}
                                                        </p>
                                                    </div>

                                                    {/* Contest Details */}
                                                    <div className="p-4">
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="flex items-center text-gray-600">
                                                                <FiCalendar className="w-4 h-4 text-orange-600 mr-2" />
                                                                <div>
                                                                    <div className="text-xs text-gray-500">Start</div>
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {moment(contest.startTime).format('MMM DD, HH:mm')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center text-gray-600">
                                                                <FiClock className="w-4 h-4 text-green-600 mr-2" />
                                                                <div>
                                                                    <div className="text-xs text-gray-500">Duration</div>
                                                                    <div className="text-sm font-semibold text-gray-900">{contest.duration} min</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center text-gray-600">
                                                                <FiUsers className="w-4 h-4 text-purple-600 mr-2" />
                                                                <div>
                                                                    <div className="text-xs text-gray-500">Questions</div>
                                                                    <div className="text-sm font-semibold text-gray-900">{contest.questions?.length || 0}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center text-gray-600">
                                                                <FiAward className="w-4 h-4 text-yellow-600 mr-2" />
                                                                <div>
                                                                    <div className="text-xs text-gray-500">Languages</div>
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {contest.allowedLanguages?.length || 0}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Button */}
                                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                            <div className="text-xs text-gray-500">
                                                                Ends: {moment(contest.endTime).format('MMM DD, HH:mm')}
                                                            </div>
                                                            
                                                            {status.status === 'active' ? (
                                                                <Link
                                                                    to={`/contest/${contest._id}`}
                                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm"
                                                                >
                                                                    <FiPlay className="w-4 h-4 mr-1" />
                                                                    Enter
                                                                </Link>
                                                            ) : status.status === 'upcoming' ? (
                                                                <button
                                                                    disabled
                                                                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed text-sm"
                                                                >
                                                                    <FiClock className="w-4 h-4 mr-2" />
                                                                    Soon
                                                                </button>
                                                            ) : (
                                                                <Link
                                                                    to={`/contest/${contest._id}`}
                                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-sm"
                                                                >
                                                                    <FiEye className="w-4 h-4 mr-1" />
                                                                    View
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* List View */}
                                {viewMode === 'list' && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contest Details</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Schedule</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Questions</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Languages</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Duration</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentContests.map((contest) => {
                                                        const status = getContestStatus(contest);
                                                        return (
                                                            <tr key={contest._id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className={`bg-${status.color}-100 rounded-lg p-2`}>
                                                                            <FiCode className={`w-5 h-5 text-${status.color}-600`} />
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-gray-900 max-w-xs">{contest.name}</div>
                                                                            <div className="text-sm text-gray-600 max-w-xs line-clamp-1">{contest.description}</div>
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
                                                                        <span>Ends: {moment(contest.endTime).format('MMM DD, HH:mm')}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <FiUsers className="w-4 h-4 text-purple-600" />
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {contest.questions?.length || 0} Problems
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Max Attempts: {contest.maxAttempts || 1}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {contest.allowedLanguages?.map((lang) => (
                                                                            <span key={lang} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                {lang.toUpperCase()}
                                                                            </span>
                                                                        )) || (
                                                                            <span className="text-sm text-gray-500">No languages specified</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <FiClock className="w-4 h-4 text-green-600" />
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {contest.duration} min
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {Math.floor(contest.duration / 60)}h {contest.duration % 60}m
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {status.status === 'active' ? (
                                                                        <Link
                                                                            to={`/contest/${contest._id}`}
                                                                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm"
                                                                        >
                                                                            <FiPlay className="w-4 h-4 mr-2" />
                                                                            Enter
                                                                        </Link>
                                                                    ) : status.status === 'upcoming' ? (
                                                                        <button
                                                                            disabled
                                                                            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed text-sm"
                                                                        >
                                                                            <FiClock className="w-4 h-4 mr-2" />
                                                                            Soon
                                                                        </button>
                                                                    ) : (
                                                                        <Link
                                                                            to={`/contest/${contest._id}`}
                                                                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 text-sm"
                                                                        >
                                                                            <FiEye className="w-4 h-4 mr-1" />
                                                                            View
                                                                        </Link>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 mt-8">
                                        <div className="text-sm text-gray-600">
                                            Showing {indexOfFirstContest + 1} to {Math.min(indexOfLastContest, filteredContests.length)} of {filteredContests.length} contests
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FiChevronLeft className="w-4 h-4 mr-1" />
                                                Previous
                                            </button>
                                            
                                            <div className="flex space-x-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                                <FiChevronRight className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default ContestList;
