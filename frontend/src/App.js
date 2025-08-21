import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ContestList from './pages/ContestList';
import ContestDetails from './pages/ContestDetails';
import QuestionSolver from './pages/QuestionSolver';
import SubmissionResult from './pages/SubmissionResult';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateContest from './pages/admin/CreateContest';
import EditContest from './pages/admin/EditContest';

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
      <Router>
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
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
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
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
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
    </AuthProvider>
  );
}

export default App;
