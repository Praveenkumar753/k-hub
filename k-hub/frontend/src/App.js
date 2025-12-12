import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
// import LoadBalancerDashboard from './components/LoadBalancerDashboard';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ContestList from './pages/ContestList';
import ContestDetails from './pages/ContestDetails';
import QuestionSolver from './pages/QuestionSolver';
import SubmissionResult from './pages/SubmissionResult';
import UserProfile from './pages/UserProfile';
import UserCourses from './pages/UserCourses';
import CourseDetails from './pages/CourseDetails';
import CourseContent from './pages/CourseContent';
import Quizzes from './pages/Quizzes';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateContest from './pages/admin/CreateContest';
import EditContest from './pages/admin/EditContest';
import ContestManagement from './pages/admin/ContestManagement';
import UserManagement from './pages/admin/UserManagement';
import CreateCourse from './pages/admin/CreateCourse';
import Courses from './pages/admin/Courses';
import ModuleList from './pages/admin/ModuleList';
import NotificationManagement from './pages/admin/NotificationManagement';
import AddQuiz from './pages/admin/AddQuiz';
import EditQuiz from './pages/admin/EditQuiz';
import AddTask from './pages/admin/AddTask';
import EditTask from './pages/admin/EditTask';

// Styles
import './App.css';

// Suppress ResizeObserver errors globally
const originalError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
        return;
    }
    originalError.call(console, ...args);
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router future={{ v7_relativeSplatPath: true }}>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ContestList />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              
              <Route path="/contest/:contestId" element={
                <ProtectedRoute>
                  <ContestDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/contest/:contestId/question/:questionId" element={
                <ProtectedRoute>
                  <QuestionSolver />
                </ProtectedRoute>
              } />
              
              <Route path="/submission/:submissionId" element={
                <ProtectedRoute>
                  <SubmissionResult />
                </ProtectedRoute>
              } />
              
              {/* Course Routes */}
              <Route path="/courses" element={
                <ProtectedRoute>
                  <UserCourses />
                </ProtectedRoute>
              } />
              
              <Route path="/courses/:courseId" element={
                <ProtectedRoute>
                  <CourseDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/courses/:courseId/learn" element={
                <ProtectedRoute>
                  <CourseContent />
                </ProtectedRoute>
              } />
              
              {/* Quiz Routes */}
              <Route path="/quiz/:quizId" element={
                <ProtectedRoute>
                  <Quizzes />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/user-management" element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/contests/new" element={
                <ProtectedRoute adminOnly={true}>
                  <CreateContest />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/contests/:contestId/edit" element={
                <ProtectedRoute adminOnly={true}>
                  <EditContest />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/contests/:contestId" element={
                <ProtectedRoute adminOnly={true}>
                  <ContestManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/courses/new" element={
                <ProtectedRoute adminOnly={true}>
                  <CreateCourse />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/courses" element={
                <ProtectedRoute adminOnly={true}>
                  <Courses />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/courses/:courseId/modules" element={
                <ProtectedRoute adminOnly={true}>
                  <ModuleList />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/notifications" element={
                <ProtectedRoute adminOnly={true}>
                  <NotificationManagement />
                </ProtectedRoute>
              } />
              
              {/* Admin Quiz Routes */}
              <Route path="/admin/quizzes/new/:courseId/:moduleId" element={
                <ProtectedRoute adminOnly={true}>
                  <AddQuiz />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/quizzes/edit/:quizId" element={
                <ProtectedRoute adminOnly={true}>
                  <EditQuiz />
                </ProtectedRoute>
              } />
              
              {/* Admin Task Routes */}
              <Route path="/admin/tasks/new/:courseId/:moduleId" element={
                <ProtectedRoute adminOnly={true}>
                  <AddTask />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/tasks/edit/:taskId" element={
                <ProtectedRoute adminOnly={true}>
                  <EditTask />
                </ProtectedRoute>
              } />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Load Balancer Dashboard - Only show when authenticated */}
            {/* <LoadBalancerDashboard /> */}
            
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
