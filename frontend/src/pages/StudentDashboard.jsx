// frontend/src/pages/StudentDashboard.jsx

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetClassesQuery, useJoinClassMutation } from '../api/apiSlice';
import toast from 'react-hot-toast';
import { HiX, HiAcademicCap, HiBookOpen, HiUserGroup, HiClipboard } from 'react-icons/hi';

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
  
  const uniqueSubjects = new Set(classes.map(c => c.subject)).size;
  const uniqueTeachers = new Set(classes.map(c => c.teacher?.id)).size;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.first_name || user?.username}! 🎓
        </h1>
        <p className="text-secondary-100 mt-1">
          Continue your learning journey. Join classes, complete assignments, and track your progress.
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
          <div className="p-3 bg-secondary-100 rounded-full mr-4">
            <HiBookOpen className="h-6 w-6 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">My Classes</p>
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
          <div className="p-3 bg-primary-100 rounded-full mr-4">
            <HiUserGroup className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Subjects</p>
            <p className="text-2xl font-bold text-gray-900">{uniqueSubjects}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
          <div className="p-3 bg-warning-100 rounded-full mr-4">
            <HiClipboard className="h-6 w-6 text-warning-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Teachers</p>
            <p className="text-2xl font-bold text-gray-900">{uniqueTeachers}</p>
          </div>
        </div>
      </div>
      
      {/* Join Class Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowJoinModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <HiAcademicCap className="h-5 w-5" />
          Join Class
        </button>
      </div>
      
      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-lg font-medium text-gray-900">No classes joined yet</h3>
          <p className="text-gray-500 mt-1">Join a class using a join code from your teacher</p>
          <button
            onClick={() => setShowJoinModal(true)}
            className="mt-4 btn-primary"
          >
            Join Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="card hover:shadow-xl transition-shadow">
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
                      Joined: {new Date(cls.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-sm text-secondary-600 hover:text-secondary-700 font-medium">
                    View Class
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setShowJoinModal(false)}></div>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Join a Class</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <HiX className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
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
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isJoining ? 'Joining...' : 'Join Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;