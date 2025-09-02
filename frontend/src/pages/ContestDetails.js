import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contestService } from '../services';
import { toast } from 'react-toastify';
import moment from 'moment';
import { FiCalendar, FiClock, FiUsers, FiArrowRight, FiCode } from 'react-icons/fi';
import Navbar from '../components/Navbar';

const ContestDetails = () => {
    const { contestId } = useParams();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContest();
    }, [contestId]);

    const fetchContest = async () => {
        try {
            const data = await contestService.getContest(contestId);
            setContest(data.contest);
        } catch (error) {
            toast.error('Failed to fetch contest details');
            console.error('Error fetching contest:', error);
        } finally {
            setLoading(false);
        }
    };

    const getContestStatus = () => {
        if (!contest) return { status: 'unknown', color: 'gray', text: 'Unknown' };
        
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

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'green';
            case 'Medium': return 'yellow';
            case 'Hard': return 'red';
            default: return 'gray';
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

    if (!contest) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Contest not found</h2>
                        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                            Back to contests
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const status = getContestStatus();

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Contest Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{contest.name}</h1>
                            <p className="text-gray-600">{contest.description}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                            {status.text}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="flex items-center text-gray-600">
                            <FiCalendar className="mr-2" />
                            <div>
                                <div className="text-sm">Start Time</div>
                                <div className="font-medium">{moment(contest.startTime).format('MMM DD, YYYY HH:mm')}</div>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <FiClock className="mr-2" />
                            <div>
                                <div className="text-sm">Duration</div>
                                <div className="font-medium">{contest.duration} minutes</div>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <FiUsers className="mr-2" />
                            <div>
                                <div className="text-sm">Questions</div>
                                <div className="font-medium">{contest.questions?.length || 0}</div>
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <FiCode className="mr-2" />
                            <div>
                                <div className="text-sm">Languages</div>
                                <div className="font-medium">{contest.allowedLanguages?.join(', ')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions</h2>
                    
                    {contest.questions && contest.questions.length > 0 ? (
                        <div className="space-y-4">
                            {contest.questions.map((question, index) => {
                                const difficultyColor = getDifficultyColor(question.difficulty);
                                const userSubmission = question.userSubmission;
                                
                                return (
                                    <div key={question._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <span className="text-lg font-medium text-gray-600 mr-3">
                                                            Q{index + 1}.
                                                        </span>
                                                        <h3 className="text-xl font-semibold text-gray-900">
                                                            {question.title}
                                                        </h3>
                                                        {/* Show submission status and score */}
                                                        {userSubmission && (
                                                            <div className="flex items-center space-x-2 ml-4">
                                                                {userSubmission.status === 'completed' && userSubmission.marksAwarded > 0 ? (
                                                                    <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                        <span className="text-xs font-semibold text-green-800">
                                                                            {userSubmission.marksAwarded}/{userSubmission.maxMarks}
                                                                        </span>
                                                                    </div>
                                                                ) : userSubmission.status === 'error' ? (
                                                                    <div className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full">
                                                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                                        <span className="text-xs font-semibold text-red-800">
                                                                            0/{userSubmission.maxMarks}
                                                                        </span>
                                                                    </div>
                                                                ) : userSubmission.status === 'completed' ? (
                                                                    <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                                                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                                                        <span className="text-xs font-semibold text-yellow-800">
                                                                            {userSubmission.marksAwarded}/{userSubmission.maxMarks}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                        <span className="text-xs font-semibold text-blue-800">
                                                                            Attempted
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                                        {question.description}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${difficultyColor}-100 text-${difficultyColor}-800`}>
                                                        {question.difficulty}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {question.totalMarks} marks
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex space-x-4 text-sm text-gray-500">
                                                    <span>Time Limit: {question.timeLimit}ms</span>
                                                    <span>Memory: {question.memoryLimit}MB</span>
                                                </div>
                                                
                                                {status.status === 'active' ? (
                                                    <Link
                                                        to={`/contest/${contestId}/question/${question._id}`}
                                                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                            userSubmission && userSubmission.status === 'completed' && userSubmission.marksAwarded > 0
                                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                                : userSubmission
                                                                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {userSubmission && userSubmission.status === 'completed' && userSubmission.marksAwarded > 0 ? (
                                                            <>Solved</>
                                                        ) : userSubmission ? (
                                                            <>Try Again</>
                                                        ) : (
                                                            <>Solve</>
                                                        )}
                                                        <FiArrowRight className="ml-2" />
                                                    </Link>
                                                ) : status.status === 'upcoming' ? (
                                                    <button
                                                        disabled
                                                        className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-md cursor-not-allowed"
                                                    >
                                                        Not Available
                                                    </button>
                                                ) : (
                                                    <Link
                                                        to={`/contest/${contestId}/question/${question._id}`}
                                                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                                                    >
                                                        View Problem
                                                        <FiArrowRight className="ml-2" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <div className="text-gray-400 text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No questions available</h3>
                            <p className="text-gray-600">This contest doesn't have any questions yet.</p>
                        </div>
                    )}
                </div>

                {/* Contest Rules */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contest Rules</h3>
                    <ul className="space-y-2 text-gray-600">
                        <li>• You can submit up to {contest.maxAttempts} attempt(s) per question</li>
                        <li>• Allowed programming languages: {contest.allowedLanguages?.join(', ')}</li>
                        <li>• Each test case has individual marks that will be awarded upon passing</li>
                        <li>• Your final score is the sum of marks from all passed test cases</li>
                        <li>• Make sure to test your code thoroughly before submission</li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default ContestDetails;
