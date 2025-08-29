import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCode, FiUsers, FiClipboard, FiAward, FiX, FiClock, FiCpu, FiCheck, FiAlertCircle, FiFileText, FiPlay } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const ContestManagement = () => {
    const { contestId } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content');
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        fetchContest();
    }, [contestId]);

    const fetchContest = async () => {
        try {
            // Use admin endpoint to get full contest data
            const response = await fetch(`/api/contests/admin/${contestId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setContest(data.contest);
        } catch (error) {
            console.error('Error fetching contest:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async () => {
        setLoadingData(true);
        try {
            // Use admin endpoint for participants
            const response = await fetch(`/api/contests/admin/${contestId}/participants`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setParticipants(data.participants || []);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setParticipants([]);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchSubmissions = async () => {
        setLoadingData(true);
        try {
            // Use admin endpoint for submissions
            const response = await fetch(`/api/contests/admin/${contestId}/submissions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setSubmissions(data.submissions || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setSubmissions([]);
        } finally {
            setLoadingData(false);
        }
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'passed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'runtime_error': 'bg-orange-100 text-orange-800',
            'time_limit_exceeded': 'bg-yellow-100 text-yellow-800',
            'memory_limit_exceeded': 'bg-purple-100 text-purple-800',
            'compilation_error': 'bg-gray-100 text-gray-800',
            'pending': 'bg-blue-100 text-blue-800',
            'running': 'bg-indigo-100 text-indigo-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            'passed': <FiCheck className="w-4 h-4" />,
            'failed': <FiX className="w-4 h-4" />,
            'runtime_error': <FiAlertCircle className="w-4 h-4" />,
            'time_limit_exceeded': <FiClock className="w-4 h-4" />,
            'memory_limit_exceeded': <FiCpu className="w-4 h-4" />,
            'compilation_error': <FiFileText className="w-4 h-4" />,
            'pending': <FiClock className="w-4 h-4" />,
            'running': <FiPlay className="w-4 h-4" />
        };
        return iconMap[status] || <FiFileText className="w-4 h-4" />;
    };

    const formatStatus = (status) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) return <div>Loading...</div>;
    if (!contest) return <div>Contest not found</div>;

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Contest Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{contest.name}</h1>
                    <p className="text-gray-600 mb-4">{contest.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Start Time:</span>
                            <div className="text-gray-600">{new Date(contest.startTime).toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">End Time:</span>
                            <div className="text-gray-600">{new Date(contest.endTime).toLocaleString()}</div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Duration:</span>
                            <div className="text-gray-600">{contest.duration} minutes</div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Questions:</span>
                            <div className="text-gray-600">{contest.questions?.length || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            activeTab === 'content' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <FiCode className="w-5 h-5" />
                        <span>Contest Content</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('participants');
                            if (participants.length === 0) fetchParticipants();
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            activeTab === 'participants' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <FiUsers className="w-5 h-5" />
                        <span>Participants</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('submissions');
                            if (submissions.length === 0) fetchSubmissions();
                        }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            activeTab === 'submissions' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <FiClipboard className="w-5 h-5" />
                        <span>Submissions</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                            activeTab === 'leaderboard' 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <FiAward className="w-5 h-5" />
                        <span>Leaderboard</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow">
                    {activeTab === 'content' && (
                        <ContestContentTab contest={contest} />
                    )}
                    
                    {activeTab === 'participants' && (
                        <ParticipantsTab 
                            participants={participants} 
                            loading={loadingData}
                            onRefresh={fetchParticipants}
                        />
                    )}
                    
                    {activeTab === 'submissions' && (
                        <SubmissionsTab 
                            submissions={submissions} 
                            contest={contest}
                            loading={loadingData}
                            onRefresh={fetchSubmissions}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatStatus={formatStatus}
                        />
                    )}
                    
                    {activeTab === 'leaderboard' && (
                        <LeaderboardTab 
                            contestId={contestId}
                            contest={contest}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

// Contest Content Tab Component
const ContestContentTab = ({ contest }) => {
    const getDifficultyColor = (difficulty) => {
        const colorMap = {
            'Easy': 'bg-green-100 text-green-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'Hard': 'bg-red-100 text-red-800'
        };
        return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contest Problems</h2>
            {contest.questions && contest.questions.length > 0 ? (
                <div className="space-y-6">
                    {contest.questions.map((question, index) => (
                        <div key={question._id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Problem {index + 1}: {question.title}
                                    </h3>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(question.difficulty)}`}>
                                            {question.difficulty}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Time Limit: {question.timeLimit}ms
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Memory Limit: {question.memoryLimit}MB
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Total Marks: {question.totalMarks}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                    <p className="text-gray-700 text-sm mb-4">{question.description}</p>
                                    
                                    <h4 className="font-medium text-gray-900 mb-2">Input Format</h4>
                                    <p className="text-gray-700 text-sm mb-4">{question.inputFormat}</p>
                                    
                                    <h4 className="font-medium text-gray-900 mb-2">Output Format</h4>
                                    <p className="text-gray-700 text-sm">{question.outputFormat}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Sample Input</h4>
                                    <pre className="bg-gray-100 p-3 rounded text-sm mb-4">{question.sampleInput}</pre>
                                    
                                    <h4 className="font-medium text-gray-900 mb-2">Sample Output</h4>
                                    <pre className="bg-gray-100 p-3 rounded text-sm mb-4">{question.sampleOutput}</pre>
                                    
                                    {question.constraints && (
                                        <>
                                            <h4 className="font-medium text-gray-900 mb-2">Constraints</h4>
                                            <p className="text-gray-700 text-sm">{question.constraints}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <h4 className="font-medium text-gray-900 mb-2">
                                    Test Cases ({question.testCases?.length || 0})
                                </h4>
                                <div className="text-sm text-gray-600">
                                    Hidden: {question.testCases?.filter(tc => tc.isHidden).length || 0} | 
                                    Visible: {question.testCases?.filter(tc => !tc.isHidden).length || 0}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    No problems added to this contest yet.
                </div>
            )}
        </div>
    );
};

// Participants Tab Component  
const ParticipantsTab = ({ participants, loading, onRefresh }) => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Contest Participants</h2>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>
            
            {participants.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Student Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Email</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Team Number</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Batch Year</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Registration Time</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {participants.map((participant) => (
                                <tr key={participant._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                        {participant.user?.fullName || participant.user?.username}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        {participant.user?.email}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        {participant.user?.teamNumber || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        {participant.user?.batchYear || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        {new Date(participant.registeredAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                            Registered
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {loading ? 'Loading participants...' : 'No participants registered yet.'}
                </div>
            )}
        </div>
    );
};

// Submissions Tab Component
const SubmissionsTab = ({ submissions, contest, loading, onRefresh, getStatusColor, getStatusIcon, formatStatus }) => {
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const getOverallStatus = (submission) => {
        if (submission.status === 'pending' || submission.status === 'running') {
            return submission.status;
        }
        
        if (submission.compilationError) {
            return 'compilation_error';
        }
        
        const totalTestCases = submission.testCaseResults?.length || 0;
        const passedTestCases = submission.testCaseResults?.filter(tc => tc.status === 'passed').length || 0;
        
        if (passedTestCases === totalTestCases && totalTestCases > 0) {
            return 'passed';
        } else if (passedTestCases === 0) {
            // Check for specific error types
            const errorTypes = submission.testCaseResults?.map(tc => tc.status) || [];
            if (errorTypes.includes('time_limit_exceeded')) return 'time_limit_exceeded';
            if (errorTypes.includes('memory_limit_exceeded')) return 'memory_limit_exceeded';
            if (errorTypes.includes('runtime_error')) return 'runtime_error';
            return 'failed';
        } else {
            return 'partial';
        }
    };

    const getQuestionTitle = (questionId) => {
        const question = contest.questions?.find(q => q._id === questionId);
        return question ? question.title : 'Unknown Problem';
    };

    const formatLanguage = (lang) => {
        const langMap = {
            'c': 'C',
            'cpp': 'C++',
            'java': 'Java',
            'python': 'Python',
            'javascript': 'JavaScript'
        };
        return langMap[lang] || lang.toUpperCase();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Contest Submissions</h2>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>
            
            {submissions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Student</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Problem</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Language</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Score</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Time</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Memory</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Submitted</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {submissions.map((submission) => {
                                const overallStatus = getOverallStatus(submission);
                                return (
                                    <tr key={submission._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {submission.userId?.fullName || submission.userId?.username || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {getQuestionTitle(submission.questionId)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {formatLanguage(submission.language)}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(overallStatus)}`}>
                                                    {getStatusIcon(overallStatus)}
                                                    <span>{formatStatus(overallStatus)}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {submission.marksAwarded || 0}/{submission.maxMarks || 0}
                                            {submission.scorePercentage !== undefined && (
                                                <div className="text-xs text-gray-500">
                                                    ({submission.scorePercentage.toFixed(1)}%)
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {submission.executionTime ? `${submission.executionTime}ms` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {submission.memoryUsed ? `${submission.memoryUsed}KB` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {new Date(submission.submittedAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <button
                                                onClick={() => setSelectedSubmission(submission)}
                                                className="text-blue-600 hover:text-blue-800 text-xs"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {loading ? 'Loading submissions...' : 'No submissions yet.'}
                </div>
            )}

            {/* Submission Details Modal */}
            {selectedSubmission && (
                <SubmissionDetailsModal 
                    submission={selectedSubmission}
                    contest={contest}
                    onClose={() => setSelectedSubmission(null)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    formatStatus={formatStatus}
                />
            )}
        </div>
    );
};

// Leaderboard Tab Component
const LeaderboardTab = ({ contestId, contest }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, [contestId]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/contests/admin/${contestId}/leaderboard`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLeaderboard([]);
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Contest Leaderboard</h2>
                <button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-300"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>
            
            {leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Rank</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Student</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Team</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Total Score</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Problems Solved</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Total Time</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Last Submission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {leaderboard.map((entry, index) => {
                                const rank = index + 1;
                                return (
                                    <tr key={entry.userId} className={`hover:bg-gray-50 ${
                                        rank <= 3 ? 'bg-yellow-50' : ''
                                    }`}>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                            <span className="text-lg">{getRankBadge(rank)}</span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {entry.user?.fullName || entry.user?.username || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {entry.user?.teamNumber || 'N/A'}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                            {entry.totalScore || 0}
                                            <div className="text-xs text-gray-500">
                                                ({((entry.totalScore || 0) / (entry.maxPossibleScore || 1) * 100).toFixed(1)}%)
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {entry.problemsSolved || 0}/{contest.questions?.length || 0}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {entry.totalTime ? `${entry.totalTime}ms` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {entry.lastSubmission ? new Date(entry.lastSubmission).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {loading ? 'Loading leaderboard...' : 'No submissions to rank yet.'}
                </div>
            )}
        </div>
    );
};

// Submission Details Modal Component
const SubmissionDetailsModal = ({ submission, contest, onClose, getStatusColor, getStatusIcon, formatStatus }) => {
    const getQuestionTitle = (questionId) => {
        const question = contest.questions?.find(q => q._id === questionId);
        return question ? question.title : 'Unknown Problem';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Submission Details - {getQuestionTitle(submission.questionId)}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Submission Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">Student Info</h3>
                            <p className="text-sm text-gray-600">
                                {submission.userId?.fullName || submission.userId?.username || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Team: {submission.userId?.teamNumber || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">Submission Info</h3>
                            <p className="text-sm text-gray-600">Language: {submission.language.toUpperCase()}</p>
                            <p className="text-sm text-gray-600">
                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">Results</h3>
                            <p className="text-sm text-gray-600">
                                Score: {submission.marksAwarded || 0}/{submission.maxMarks || 0}
                            </p>
                            <p className="text-sm text-gray-600">
                                Test Cases: {submission.passedTestCases || 0}/{submission.totalTestCases || 0}
                            </p>
                        </div>
                    </div>

                    {/* Code */}
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-2">Submitted Code</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{submission.code}</code>
                        </pre>
                    </div>

                    {/* Compilation Error */}
                    {submission.compilationError && (
                        <div className="mb-6">
                            <h3 className="font-medium text-red-900 mb-2">Compilation Error</h3>
                            <pre className="bg-red-50 text-red-800 p-4 rounded-lg overflow-x-auto text-sm border border-red-200">
                                {submission.compilationError}
                            </pre>
                        </div>
                    )}

                    {/* Test Case Results */}
                    {submission.testCaseResults && submission.testCaseResults.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-4">Test Case Results</h3>
                            <div className="space-y-3">
                                {submission.testCaseResults.map((result, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-gray-900">
                                                Test Case {index + 1} {result.isHidden && '(Hidden)'}
                                            </h4>
                                            <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(result.status)}`}>
                                                {getStatusIcon(result.status)}
                                                <span>{formatStatus(result.status)}</span>
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Score:</span>
                                                <span className="ml-2 text-gray-600">
                                                    {result.marksAwarded}/{result.maxMarks}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Execution Time:</span>
                                                <span className="ml-2 text-gray-600">{result.executionTime}ms</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Memory Used:</span>
                                                <span className="ml-2 text-gray-600">{result.memoryUsed}KB</span>
                                            </div>
                                        </div>

                                        {result.output && (
                                            <div className="mt-3">
                                                <h5 className="font-medium text-gray-700 mb-1">Output:</h5>
                                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                    {result.output}
                                                </pre>
                                            </div>
                                        )}

                                        {result.error && (
                                            <div className="mt-3">
                                                <h5 className="font-medium text-red-700 mb-1">Error:</h5>
                                                <pre className="bg-red-50 text-red-800 p-2 rounded text-xs overflow-x-auto border border-red-200">
                                                    {result.error}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContestManagement;