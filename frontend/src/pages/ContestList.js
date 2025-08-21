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
    FiTarget
} from 'react-icons/fi';
import Navbar from '../components/Navbar';

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

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
                            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <FiArrowRight className="w-5 h-5 mr-2" />
                                Refresh Page
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {contests.map((contest) => {
                            const status = getContestStatus(contest);
                            return (
                                <div key={contest._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                                    {/* Contest Header */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-blue-100 rounded-lg p-2">
                                                    <FiCode className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {contest.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800 flex items-center space-x-1`}>
                                                {status.status === 'active' && <FiPlay className="w-4 h-4" />}
                                                {status.status === 'upcoming' && <FiClock className="w-4 h-4" />}
                                                {status.status === 'ended' && <FiEye className="w-4 h-4" />}
                                                <span>{status.text}</span>
                                            </span>
                                        </div>

                                        <p className="text-gray-700 line-clamp-2 leading-relaxed">
                                            {contest.description}
                                        </p>
                                    </div>

                                    {/* Contest Details */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex items-center text-gray-600">
                                                <div className="bg-orange-100 rounded-lg p-2 mr-3">
                                                    <FiCalendar className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Time</div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {moment(contest.startTime).format('MMM DD, HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center text-gray-600">
                                                <div className="bg-green-100 rounded-lg p-2 mr-3">
                                                    <FiClock className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</div>
                                                    <div className="text-sm font-semibold text-gray-900">{contest.duration} min</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center text-gray-600">
                                                <div className="bg-purple-100 rounded-lg p-2 mr-3">
                                                    <FiUsers className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questions</div>
                                                    <div className="text-sm font-semibold text-gray-900">{contest.questions?.length || 0}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center text-gray-600">
                                                <div className="bg-yellow-100 rounded-lg p-2 mr-3">
                                                    <FiAward className="w-5 h-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Languages</div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {contest.allowedLanguages?.length || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                            <div className="text-sm text-gray-500">
                                                Ends: {moment(contest.endTime).format('MMM DD, HH:mm')}
                                            </div>
                                            
                                            {status.status === 'active' ? (
                                                <Link
                                                    to={`/contest/${contest._id}`}
                                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                                >
                                                    <FiPlay className="w-5 h-5 mr-2" />
                                                    Enter Contest
                                                </Link>
                                            ) : status.status === 'upcoming' ? (
                                                <button
                                                    disabled
                                                    className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                                                >
                                                    <FiClock className="w-5 h-5 mr-2" />
                                                    Not Started
                                                </button>
                                            ) : (
                                                <Link
                                                    to={`/contest/${contest._id}`}
                                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                                >
                                                    <FiEye className="w-5 h-5 mr-2" />
                                                    View Results
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default ContestList;
