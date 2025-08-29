import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHelpCircle, FiPlay, FiClock, FiAward, FiUsers } from 'react-icons/fi';
import { quizService } from '../services/quizService';

const ModuleQuizzes = ({ courseId, moduleId, moduleName }) => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuizzes = useCallback(async () => {
        if (!courseId || !moduleId) return;
        
        try {
            setLoading(true);
            const response = await quizService.getModuleQuizzes(courseId, moduleId);
            setQuizzes(response.quizzes || []);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    }, [courseId, moduleId]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    if (loading) {
        return (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-purple-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-purple-100 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (quizzes.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <FiHelpCircle className="w-5 h-5 mr-2" />
                Module Quizzes ({quizzes.length})
            </h4>
            <div className="space-y-3">
                {quizzes.map((quiz) => (
                    <div key={quiz._id} className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-2">{quiz.title}</h5>
                                {quiz.description && (
                                    <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="flex items-center">
                                        <FiUsers className="w-3 h-3 mr-1" />
                                        {quiz.questions?.length || 0} Questions
                                    </span>
                                    <span className="flex items-center">
                                        <FiAward className="w-3 h-3 mr-1" />
                                        {quiz.totalPoints} Points
                                    </span>
                                    {quiz.settings.timeLimit > 0 && (
                                        <span className="flex items-center">
                                            <FiClock className="w-3 h-3 mr-1" />
                                            {quiz.settings.timeLimit} min
                                        </span>
                                    )}
                                    <span className="text-purple-600">
                                        Pass: {quiz.settings.passingScore}%
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/quiz/${quiz._id}`)}
                                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                                <FiPlay className="w-4 h-4" />
                                <span>Take Quiz</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModuleQuizzes;