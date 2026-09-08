// frontend/src/pages/student/StudentDashboard.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetClassesQuery, useJoinClassMutation } from '../../api/apiSlice';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const { data: classes = [], isLoading, refetch } = useGetClassesQuery();
  const [joinClass] = useJoinClassMutation();

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode || joinCode.length !== 6) {
      toast.error('Please enter a valid 6-character join code');
      return;
    }

    setIsJoining(true);
    try {
      await joinClass(joinCode.toUpperCase()).unwrap();
      toast.success('Successfully joined the class!');
      setJoinCode('');
      setShowJoinModal(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to join class. Invalid code?');
    } finally {
      setIsJoining(false);
    }
  };

  const uniqueSubjects = new Set(classes.map((c) => c.subject)).size;
  const totalStudents = classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.first_name || user?.username}! 🎓
            </h1>
            <p className="text-secondary-100 mt-1">
              Continue your learning journey. Join classes and track your progress.
            </p>
          </div>
          <Button
            variant="primary"
            className="bg-white text-secondary-700 hover:bg-gray-100"
            onClick={() => setShowJoinModal(true)}
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Join Class
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <div className="p-3 bg-secondary-50 rounded-full">
              <BookOpenIcon className="h-6 w-6 text-secondary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueSubjects}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Classmates</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Exams Taken</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-full">
              <ClipboardDocumentListIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover className="cursor-pointer" onClick={() => setShowJoinModal(true)}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-secondary-100 rounded-full">
              <AcademicCapIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Join New Class</h4>
              <p className="text-sm text-gray-500">Use a join code</p>
            </div>
          </div>
        </Card>
        <Link to="/student/materials">
          <Card hover className="cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <BookOpenIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Study Materials</h4>
                <p className="text-sm text-gray-500">Access learning resources</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/student/performance">
          <Card hover className="cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-warning-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">My Performance</h4>
                <p className="text-sm text-gray-500">Track your progress</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* My Classes */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Classes</h2>
        {classes.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-gray-600">You haven't joined any classes yet</p>
            <Button variant="primary" className="mt-4" onClick={() => setShowJoinModal(true)}>
              Join Your First Class
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Link to={`/student/classes/${cls.id}`} key={cls.id}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-500">{cls.subject}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                      Active
                    </span>
                  </div>
                  {cls.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{cls.description}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">
                          Teacher: <span className="text-gray-600">{cls.teacher?.email || 'N/A'}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {cls.student_count || 0} students enrolled
                        </p>
                      </div>
                      <ArrowTrendingUpIcon className="h-5 w-5 text-secondary-500" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join a Class">
        <form onSubmit={handleJoinClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Join Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-field text-center text-2xl font-bold tracking-widest uppercase"
              placeholder="ABC123"
              maxLength={6}
              autoFocus
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter the 6-character code provided by your teacher
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isJoining}>
              Join Class
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDashboard;