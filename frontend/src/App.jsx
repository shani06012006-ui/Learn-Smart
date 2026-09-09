// frontend/src/App.jsx

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Teacher Pages
import ClassManagement from './pages/teacher/ClassManagement';
import ClassDetail from './pages/teacher/ClassDetail';
import ExamManagement from './pages/teacher/ExamManagement';
import ExamDetail from './pages/teacher/ExamDetail';
import MaterialManagement from './pages/teacher/MaterialManagement';
import TeacherAnalytics from './pages/teacher/Analytics';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentClasses from './pages/student/StudentClasses';
import StudentExam from './pages/student/StudentExam';
import StudentMaterials from './pages/student/StudentMaterials';
import StudentPerformance from './pages/student/StudentPerformance';

// Components
import PrivateRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';
import ExamResults from './pages/student/ExamResults';
import Chat from './components/Chat/Chat';

// Authentication
import { getProfile, clearCredentials } from './store/slices/authSlice';

// WebSocket
import { wsService } from './api/websocket';

function App() {
  const dispatch = useDispatch();
  const { user, token, isLoading, isAuthenticated } = useSelector((state) => state.auth);

  // Load user profile if token exists but user doesn't
  useEffect(() => {
    if (token && !user && isAuthenticated) {
      dispatch(getProfile()).unwrap().catch(() => {
        dispatch(clearCredentials());
      });
    }
  }, [token, user, isAuthenticated, dispatch]);

  // WebSocket connection
  useEffect(() => {
    if (user && token && isAuthenticated) {
      try {
        wsService.connect(user.id);
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
      }
      
      return () => {
        try {
          wsService.disconnect();
        } catch (error) {
          console.warn('WebSocket disconnect failed:', error);
        }
      };
    }
  }, [user, token, isAuthenticated]);

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <HelmetProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Teacher Routes */}
          <Route path="/teacher/classes" element={<ClassManagement />} />
          <Route path="/teacher/classes/:id" element={<ClassDetail />} />
          <Route path="/teacher/classes/:id/materials" element={<MaterialManagement />} />
          <Route path="/teacher/exams" element={<ExamManagement />} />
          <Route path="/teacher/exams/:id" element={<ExamDetail />} />
          <Route path="/teacher/materials" element={<MaterialManagement />} />
          <Route path="/teacher/analytics" element={<TeacherAnalytics />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/classes" element={<StudentClasses />} />
          <Route path="/student/exam/:id" element={<StudentExam />} />
          <Route path="/student/materials" element={<StudentMaterials />} />
          <Route path="/student/classes/:id/materials" element={<StudentMaterials />} />
          <Route path="/student/performance" element={<StudentPerformance />} />
          <Route path="/student/exam/results/:attemptId" element={<ExamResults />}/>
          <Route path="/chat/:roomId" element={<Chat />} />

        </Route>
      </Routes>
    </HelmetProvider>
  );
}

export default App;