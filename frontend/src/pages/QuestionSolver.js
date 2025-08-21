import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contestService, submissionService } from '../services';
import { toast } from 'react-toastify';
import Editor from '@monaco-editor/react';
import Navbar from '../components/Navbar';
import { 
    FiPlay, 
    FiArrowLeft, 
    FiClock, 
    FiDatabase, 
    FiAward, 
    FiCode, 
    FiSend,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiSettings,
    FiTerminal
} from 'react-icons/fi';

const QuestionSolver = () => {
    const { contestId, questionId } = useParams();
    const navigate = useNavigate();
    
    const [question, setQuestion] = useState(null);
    const [contest, setContest] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('cpp');
    const [submitting, setSubmitting] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Run functionality states
    const [running, setRunning] = useState(false);
    const [testInput, setTestInput] = useState('');
    const [runResult, setRunResult] = useState(null);
    const [showRunPanel, setShowRunPanel] = useState(false);

    // Language templates
    const languageTemplates = {
        c: `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
        java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Your code here
        sc.close();
    }
}`,
        python: `# Your code here
`,
        javascript: `// Your code here
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    // Process input
    console.log(input);
    rl.close();
});`
    };

    useEffect(() => {
        fetchData();
    }, [contestId, questionId]);

    useEffect(() => {
        if (question) {
            setCode(languageTemplates[language]);
        }
    }, [language, question]);

    const fetchData = async () => {
        try {
            const [contestData, questionData, submissionsData] = await Promise.all([
                contestService.getContest(contestId),
                contestService.getQuestion(contestId, questionId),
                submissionService.getQuestionSubmissions(contestId, questionId)
            ]);

            setContest(contestData.contest);
            setQuestion(questionData.question);
            setSubmissions(submissionsData.submissions);
            setCode(languageTemplates[language]);
        } catch (error) {
            toast.error('Failed to fetch question details');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            toast.error('Please write some code before submitting');
            return;
        }

        setSubmitting(true);
        try {
            const submissionData = {
                contestId,
                questionId,
                code,
                language
            };

            const response = await submissionService.submitCode(submissionData);
            
            // Show success message with score if available
            if (response.submission && response.submission.scorePercentage !== undefined) {
                toast.success(`Code submitted successfully! Score: ${response.submission.scorePercentage}% (${response.submission.marks}/${response.submission.totalMarks})`);
            } else {
                toast.success('Code submitted successfully! Your submission is being evaluated...');
            }
            
            // Refresh submissions
            const submissionsData = await submissionService.getQuestionSubmissions(contestId, questionId);
            setSubmissions(submissionsData.submissions);

            // Set submission results for display (if available immediately)
            if (response.submission && response.submission.testResults) {
                setRunResult({
                    status: 'submission_results',
                    scorePercentage: response.submission.scorePercentage,
                    marks: response.submission.marks,
                    totalMarks: response.submission.totalMarks,
                    testResults: response.submission.testResults,
                    executionTime: response.submission.testResults.reduce((sum, r) => sum + r.executionTime, 0)
                });
                setShowRunPanel(true);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit code');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRun = async () => {
        if (!code.trim()) {
            toast.error('Please write some code before running');
            return;
        }

        setRunning(true);
        setRunResult(null);
        
        try {
            const runData = {
                contestId,
                questionId,
                code,
                language,
                input: testInput
            };

            const response = await submissionService.runCode(runData);
            
            // Handle both sample test case results and custom input results
            if (response.testResults) {
                // Sample test cases were run
                setRunResult({
                    status: 'test_results',
                    testResults: response.testResults,
                    totalVisible: response.totalVisible,
                    passedVisible: response.passedVisible,
                    executionTime: response.testResults.reduce((sum, r) => sum + r.executionTime, 0)
                });
                
                const passedCount = response.passedVisible;
                const totalCount = response.totalVisible;
                
                if (passedCount === totalCount) {
                    toast.success(`All ${totalCount} sample test cases passed!`);
                } else {
                    toast.warning(`${passedCount}/${totalCount} sample test cases passed`);
                }
            } else {
                // Custom input was run
                setRunResult(response.result);
                
                if (response.result.status === 'success') {
                    toast.success('Code executed successfully!');
                } else {
                    toast.error('Code execution failed');
                }
            }
            
            setShowRunPanel(true);
        } catch (error) {
            toast.error('Failed to run code');
            setRunResult({
                status: 'error',
                error: error.response?.data?.error || 'Failed to run code',
                output: '',
                executionTime: 0
            });
            setShowRunPanel(true);
        } finally {
            setRunning(false);
        }
    };

    const getSubmissionStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'green';
            case 'pending': case 'running': return 'yellow';
            case 'error': return 'red';
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

    if (!question || !contest) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Question not found</h2>
                        <button 
                            onClick={() => navigate(`/contest/${contestId}`)}
                            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
                        >
                            Back to contest
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flex h-screen bg-gray-100">
                {/* Problem Description Panel */}
                <div className="w-1/2 bg-white border-r border-gray-300 overflow-y-auto">
                    <div className="p-6">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate(`/contest/${contestId}`)}
                            className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mb-6"
                        >
                            <FiArrowLeft className="w-5 h-5 mr-2" />
                            <span className="font-medium">Back to Contest</span>
                        </button>

                        {/* Problem Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 rounded-lg p-3">
                                        <FiCode className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                    question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {question.difficulty}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <div className="bg-orange-100 rounded-lg p-2">
                                        <FiAward className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Total Marks</div>
                                        <div className="font-semibold">{question.totalMarks}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <div className="bg-green-100 rounded-lg p-2">
                                        <FiClock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Time Limit</div>
                                        <div className="font-semibold">{question.timeLimit}ms</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <div className="bg-purple-100 rounded-lg p-2">
                                        <FiDatabase className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Memory Limit</div>
                                        <div className="font-semibold">{question.memoryLimit}MB</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Problem Description */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Problem Description</h3>
                                <div className="prose max-w-none text-gray-700">
                                    {question.description.split('\n').map((line, index) => (
                                        <p key={index} className="mb-2">{line}</p>
                                    ))}
                                </div>
                            </div>

                            {question.constraints && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Constraints</h3>
                                    <div className="prose max-w-none text-gray-700">
                                        {question.constraints.split('\n').map((line, index) => (
                                            <p key={index} className="mb-2">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Input Format</h3>
                                <div className="prose max-w-none text-gray-700">
                                    {question.inputFormat.split('\n').map((line, index) => (
                                        <p key={index} className="mb-2">{line}</p>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Output Format</h3>
                                <div className="prose max-w-none text-gray-700">
                                    {question.outputFormat.split('\n').map((line, index) => (
                                        <p key={index} className="mb-2">{line}</p>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Input</h3>
                                    <pre className="bg-gray-50 p-4 rounded-md border text-sm font-mono overflow-x-auto">
                                        {question.sampleInput}
                                    </pre>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Output</h3>
                                    <pre className="bg-gray-50 p-4 rounded-md border text-sm font-mono overflow-x-auto">
                                        {question.sampleOutput}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Previous Submissions */}
                        {submissions.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <div className="bg-purple-100 rounded-lg p-2 mr-3">
                                        <FiRefreshCw className="w-5 h-5 text-purple-600" />
                                    </div>
                                    Your Recent Submissions
                                </h3>
                                <div className="space-y-3">
                                    {submissions.slice(0, 5).map((submission) => (
                                        <div key={submission._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    {submission.status === 'completed' ? (
                                                        <FiCheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : submission.status === 'error' ? (
                                                        <FiXCircle className="w-5 h-5 text-red-600" />
                                                    ) : (
                                                        <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                                                    )}
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                                        submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        submission.status === 'error' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {submission.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                                        {submission.language}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {submission.totalMarks}/{submission.maxMarks} marks
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/submission/${submission._id}`)}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Code Editor Panel */}
                <div className="w-1/2 flex flex-col">
                    {/* Editor Header */}
                    <div className="bg-white border-b border-gray-300 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-gray-100 rounded-lg p-2">
                                        <FiSettings className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Programming Language</label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="ml-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            {contest.allowedLanguages?.map((lang) => (
                                                <option key={lang} value={lang}>
                                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowRunPanel(!showRunPanel)}
                                    className={`flex items-center space-x-2 px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
                                        showRunPanel 
                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <FiTerminal className="w-4 h-4" />
                                    <span>{showRunPanel ? 'Hide' : 'Show'} Console</span>
                                </button>
                                
                                <button
                                    onClick={handleRun}
                                    disabled={running}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                                >
                                    {running ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Running...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiPlay className="w-4 h-4" />
                                            <span>Run</span>
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="w-5 h-5" />
                                            <span>Submit Solution</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className={`${showRunPanel ? 'h-3/5' : 'flex-1'} transition-all duration-300`}>
                        <Editor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
                            value={code}
                            onChange={(value) => setCode(value)}
                            theme="vs-dark"
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                scrollbar: {
                                    verticalScrollbarSize: 10,
                                    horizontalScrollbarSize: 10
                                }
                            }}
                        />
                    </div>

                    {/* Test Input/Output Panel */}
                    {showRunPanel && (
                        <div className="h-2/5 border-t border-gray-300 bg-white">
                            <div className="flex h-full">
                                {/* Input Panel */}
                                <div className="w-1/2 border-r border-gray-300">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <FiTerminal className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm font-semibold text-gray-700">Custom Input</span>
                                        </div>
                                        <button
                                            onClick={() => setShowRunPanel(false)}
                                            className="text-gray-500 hover:text-gray-700 p-1"
                                        >
                                            <FiXCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-4 h-full">
                                        <textarea
                                            value={testInput}
                                            onChange={(e) => setTestInput(e.target.value)}
                                            placeholder="Enter your test input here..."
                                            className="w-full h-3/4 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        />
                                        <div className="mt-2">
                                            <button
                                                onClick={handleRun}
                                                disabled={running}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                                            >
                                                {running ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        <span>Running...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiPlay className="w-3 h-3" />
                                                        <span>Run Code</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Output Panel */}
                                <div className="w-1/2">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                        <div className="flex items-center space-x-2">
                                            {runResult && (
                                                <>
                                                    {runResult.status === 'success' || runResult.status === 'test_results' ? (
                                                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <FiXCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                </>
                                            )}
                                            <span className="text-sm font-semibold text-gray-700">
                                                {runResult?.status === 'test_results' ? 'Sample Test Results' : 
                                                 runResult?.status === 'submission_results' ? 'Final Submission Results' : 'Output'}
                                            </span>
                                            {runResult && runResult.executionTime && (
                                                <span className="text-xs text-gray-500">
                                                    ({runResult.executionTime}ms)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 h-full overflow-y-auto">
                                        {runResult ? (
                                            <div className="space-y-3">
                                                {/* Final Submission Results */}
                                                {runResult.status === 'submission_results' && (
                                                    <div className="space-y-4">
                                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                                                            <div className="text-center">
                                                                <div className="text-2xl font-bold text-blue-800 mb-2">
                                                                    Final Score: {runResult.scorePercentage}%
                                                                </div>
                                                                <div className="text-sm text-blue-700">
                                                                    Marks: {runResult.marks}/{runResult.totalMarks}
                                                                </div>
                                                                <div className="text-xs text-blue-600 mt-1">
                                                                    Total Execution Time: {runResult.executionTime}ms
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-semibold text-gray-700 mb-2">
                                                                Test Case Results:
                                                            </div>
                                                            {runResult.testResults?.map((testResult, index) => (
                                                                <div key={index} className="border rounded-lg p-3 bg-white">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            {testResult.isHidden ? `Hidden Test Case ${index + 1}` : `Test Case ${index + 1}`}
                                                                        </span>
                                                                        <div className="flex items-center space-x-2">
                                                                            {testResult.isCorrect ? (
                                                                                <span className="flex items-center text-green-600 text-sm">
                                                                                    <FiCheckCircle className="w-4 h-4 mr-1" />
                                                                                    Passed ({testResult.marks}/{testResult.maxMarks})
                                                                                </span>
                                                                            ) : (
                                                                                <span className="flex items-center text-red-600 text-sm">
                                                                                    <FiXCircle className="w-4 h-4 mr-1" />
                                                                                    Failed (0/{testResult.maxMarks})
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs text-gray-500">
                                                                                {testResult.executionTime}ms
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {!testResult.isHidden && (
                                                                        <div className="space-y-2 text-xs">
                                                                            <div>
                                                                                <span className="font-medium text-gray-600">Input:</span>
                                                                                <pre className="bg-gray-50 p-2 rounded mt-1 font-mono">
                                                                                    {testResult.input || 'No input'}
                                                                                </pre>
                                                                            </div>
                                                                            
                                                                            <div>
                                                                                <span className="font-medium text-gray-600">Expected:</span>
                                                                                <pre className="bg-gray-50 p-2 rounded mt-1 font-mono">
                                                                                    {testResult.expectedOutput}
                                                                                </pre>
                                                                            </div>
                                                                            
                                                                            <div>
                                                                                <span className="font-medium text-gray-600">Your Output:</span>
                                                                                <pre className={`p-2 rounded mt-1 font-mono ${
                                                                                    testResult.isCorrect ? 'bg-green-50' : 'bg-red-50'
                                                                                }`}>
                                                                                    {testResult.actualOutput || 'No output'}
                                                                                </pre>
                                                                            </div>
                                                                            
                                                                            {testResult.error && (
                                                                                <div>
                                                                                    <span className="font-medium text-red-600">Error:</span>
                                                                                    <pre className="bg-red-50 p-2 rounded mt-1 font-mono text-red-800">
                                                                                        {testResult.error}
                                                                                    </pre>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {testResult.isHidden && (
                                                                        <div className="text-xs text-gray-500 italic">
                                                                            Hidden test case - details not shown
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Sample Test Case Results */}
                                                {runResult.status === 'test_results' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                                                            <div className="text-sm">
                                                                <span className="font-semibold text-blue-800">Sample Test Cases:</span>
                                                                <span className="ml-2 text-blue-700">
                                                                    {runResult.passedVisible}/{runResult.totalVisible} passed
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-blue-600">
                                                                Total: {runResult.executionTime}ms
                                                            </div>
                                                        </div>
                                                        
                                                        {runResult.testResults?.map((testResult, index) => (
                                                            <div key={index} className="border rounded-lg p-3 bg-white">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        Test Case {index + 1}
                                                                    </span>
                                                                    <div className="flex items-center space-x-2">
                                                                        {testResult.isCorrect ? (
                                                                            <span className="flex items-center text-green-600 text-sm">
                                                                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                                                                Passed
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center text-red-600 text-sm">
                                                                                <FiXCircle className="w-4 h-4 mr-1" />
                                                                                Failed
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs text-gray-500">
                                                                            {testResult.executionTime}ms
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="space-y-2 text-xs">
                                                                    <div>
                                                                        <span className="font-medium text-gray-600">Input:</span>
                                                                        <pre className="bg-gray-50 p-2 rounded mt-1 font-mono">
                                                                            {testResult.input || 'No input'}
                                                                        </pre>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <span className="font-medium text-gray-600">Expected:</span>
                                                                        <pre className="bg-gray-50 p-2 rounded mt-1 font-mono">
                                                                            {testResult.expectedOutput}
                                                                        </pre>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <span className="font-medium text-gray-600">Your Output:</span>
                                                                        <pre className={`p-2 rounded mt-1 font-mono ${
                                                                            testResult.isCorrect ? 'bg-green-50' : 'bg-red-50'
                                                                        }`}>
                                                                            {testResult.actualOutput || 'No output'}
                                                                        </pre>
                                                                    </div>
                                                                    
                                                                    {testResult.error && (
                                                                        <div>
                                                                            <span className="font-medium text-red-600">Error:</span>
                                                                            <pre className="bg-red-50 p-2 rounded mt-1 font-mono text-red-800">
                                                                                {testResult.error}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Custom Input Results */}
                                                {runResult.status === 'success' && runResult.output && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                                                        <pre className="bg-gray-100 p-3 rounded border text-sm font-mono whitespace-pre-wrap">
                                                            {runResult.output}
                                                        </pre>
                                                    </div>
                                                )}
                                                
                                                {runResult.error && runResult.status !== 'test_results' && (
                                                    <div>
                                                        <div className="text-sm font-medium text-red-700 mb-1">Error:</div>
                                                        <pre className="bg-red-50 p-3 rounded border border-red-200 text-sm font-mono text-red-800 whitespace-pre-wrap">
                                                            {runResult.error}
                                                        </pre>
                                                    </div>
                                                )}
                                                
                                                {runResult.status === 'success' && !runResult.output && !runResult.error && (
                                                    <div className="text-gray-500 text-sm italic">
                                                        Code executed successfully with no output.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm italic">
                                                Run your code to see the output here.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default QuestionSolver;
