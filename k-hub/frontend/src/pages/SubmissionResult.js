import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submissionService } from '../services';
import { toast } from 'react-toastify';
import moment from 'moment';
import { FiArrowLeft, FiCheck, FiX, FiClock, FiAlertTriangle, FiCode, FiTrendingUp, FiActivity, FiZap, FiDatabase } from 'react-icons/fi';
import Navbar from '../components/Navbar';

const SubmissionResult = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmission();
        
        // Poll for updates if submission is still processing
        const interval = setInterval(() => {
            if (submission?.status === 'pending' || submission?.status === 'running') {
                fetchSubmission();
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [submissionId, submission?.status]);

    const fetchSubmission = async () => {
        try {
            const data = await submissionService.getSubmission(submissionId);
            setSubmission(data.submission);
        } catch (error) {
            toast.error('Failed to fetch submission details');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <FiCheck className="w-5 h-5 text-green-600" />;
            case 'failed':
                return <FiX className="w-5 h-5 text-red-600" />;
            case 'runtime_error':
                return <FiAlertTriangle className="w-5 h-5 text-orange-600" />;
            case 'time_limit_exceeded':
                return <FiClock className="w-5 h-5 text-yellow-600" />;
            default:
                return <FiX className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed': return 'green';
            case 'failed': return 'red';
            case 'runtime_error': return 'orange';
            case 'time_limit_exceeded': return 'yellow';
            case 'memory_limit_exceeded': return 'purple';
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

    if (!submission) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Submission not found</h2>
                        <button 
                            onClick={() => navigate('/')}
                            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
                        >
                            Back to contests
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const isProcessing = submission.status === 'pending' || submission.status === 'running';

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-600 hover:text-blue-700 mb-6 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200 group"
                >
                    <FiArrowLeft className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform duration-200" />
                    <span className="font-medium">Back</span>
                </button>

                {/* Submission Header */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start space-x-4">
                            <div className="bg-blue-100 rounded-lg p-3">
                                <FiCode className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Result</h1>
                                <p className="text-gray-600">Submitted on {moment(submission.submittedAt).format('MMM DD, YYYY HH:mm:ss')}</p>
                            </div>
                        </div>
                        
                        {isProcessing ? (
                            <div className="flex items-center space-x-3 bg-blue-50 px-4 py-3 rounded-lg">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-blue-600 font-medium">Processing...</span>
                            </div>
                        ) : (
                            <div className="text-right bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center space-x-2 mb-2">
                                    <FiTrendingUp className="w-6 h-6 text-green-600" />
                                    <div className="text-3xl font-bold text-gray-900">
                                        {submission.totalMarks}/{submission.maxMarks}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 font-medium">
                                    {submission.maxMarks > 0 
                                        ? Math.round((submission.totalMarks / submission.maxMarks) * 100) 
                                        : 0}% Score
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                            <FiCode className="w-6 h-6 text-blue-600" />
                            <div>
                                <div className="text-sm text-gray-600">Language</div>
                                <div className="font-semibold capitalize">{submission.language}</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                            <FiActivity className="w-6 h-6 text-green-600" />
                            <div>
                                <div className="text-sm text-gray-600">Test Cases</div>
                                <div className="font-semibold">
                                    {submission.passedTestCases}/{submission.totalTestCases} Passed
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                            <FiZap className="w-6 h-6 text-yellow-600" />
                            <div>
                                <div className="text-sm text-gray-600">Execution Time</div>
                                <div className="font-semibold">{submission.executionTime}ms</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                            <FiDatabase className="w-6 h-6 text-purple-600" />
                            <div>
                                <div className="text-sm text-gray-600">Memory Used</div>
                                <div className="font-semibold">{submission.memoryUsed}KB</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compilation Error */}
                {submission.compilationError && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 mb-8 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                            <FiAlertTriangle className="w-7 h-7 text-red-600" />
                            <h3 className="text-lg font-semibold text-red-900">Compilation Error</h3>
                        </div>
                        <pre className="text-sm text-red-800 bg-red-100 p-4 rounded-lg overflow-x-auto border border-red-200">
                            {submission.compilationError}
                        </pre>
                    </div>
                )}

                {/* Test Case Results */}
                {!isProcessing && submission.testCaseResults && submission.testCaseResults.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-blue-100 rounded-lg p-2">
                                <FiActivity className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Test Case Results</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {submission.testCaseResults.map((result, index) => {
                                const statusColor = getStatusColor(result.status);
                                return (
                                    <div key={index} className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-all duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-gray-100 rounded-lg p-2">
                                                    <FiCode className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <span className="font-semibold text-gray-900 text-lg">
                                                    Test Case {index + 1}
                                                </span>
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon(result.status)}
                                                    <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-800`}>
                                                        {result.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-6 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <FiTrendingUp className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-600">Marks: <span className="font-semibold text-gray-900">{result.marksAwarded}</span></span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FiZap className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-gray-600">Time: <span className="font-semibold text-gray-900">{result.executionTime}ms</span></span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FiDatabase className="w-4 h-4 text-purple-500" />
                                                    <span className="text-gray-600">Memory: <span className="font-semibold text-gray-900">{result.memoryUsed}KB</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        {result.output && (
                                            <div className="mt-4">
                                                <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                                                    <FiCheck className="w-4 h-4 text-green-600" />
                                                    <span>Output:</span>
                                                </div>
                                                <pre className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                                                    {result.output}
                                                </pre>
                                            </div>
                                        )}

                                        {result.error && (
                                            <div className="mt-4">
                                                <div className="text-sm font-semibold text-red-700 mb-2 flex items-center space-x-2">
                                                    <FiAlertTriangle className="w-4 h-4 text-red-600" />
                                                    <span>Error:</span>
                                                </div>
                                                <pre className="text-sm bg-red-50 p-4 rounded-lg border border-red-200 text-red-800 overflow-x-auto">
                                                    {result.error}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Code Display */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 mt-8 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gray-700 rounded-lg p-2">
                            <FiCode className="w-6 h-6 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Submitted Code</h3>
                    </div>
                    <pre className="text-sm bg-gray-800 text-gray-100 p-6 rounded-lg overflow-x-auto border border-gray-600">
                        <code>{submission.code}</code>
                    </pre>
                </div>

                {isProcessing && (
                    <div className="text-center mt-8">
                        <div className="inline-flex items-center space-x-2 text-blue-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span>Your submission is being evaluated. Results will appear here shortly...</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SubmissionResult;
