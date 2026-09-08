// frontend/src/pages/TeacherDashboard.jsx

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetClassesQuery, useCreateClassMutation } from '../api/apiSlice';
import toast from 'react-hot-toast';
import { HiX, HiPlus, HiUserGroup, HiBookOpen, HiClipboard } from 'react-icons/hi';

const TeacherDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
  });
  
  const { data: classes = [], isLoading, refetch } = useGetClassesQuery();
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleCreateClass = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject) {
      toast.error('Name and subject are required');
      return;
    }
    
    try {
      await createClass(formData).unwrap();
      toast.success('Class created successfully!');
      setFormData({ name: '', subject: '', description: '' });
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to create class');
    }
  };
  
  const totalStudents = classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0);
  
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
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.first_name || user?.username}! 👋
        </h1>
        <p className="text-primary-100 mt-1">
          Manage your classes, track student progress, and create engaging learning experiences.
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
          <div className="p-3 bg-primary-100 rounded-full mr-4">
            <HiBookOpen className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
          <div className="p-3 bg-secondary-100 rounded-full mr-4">
            <HiUserGroup className="h-6 w-6 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center">
          <div className="p-3 bg-warning-100 rounded-full mr-4">
            <HiClipboard className="h-6 w-6 text-warning-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Classes</p>
            <p className="text-2xl font-bold text-gray-900">{classes.filter(c => c.is_active !== false).length}</p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus className="h-5 w-5" />
          Create Class
        </button>
      </div>
      
      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900">No classes yet</h3>
          <p className="text-gray-500 mt-1">Create your first class to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 btn-primary"
          >
            Create Class
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {cls.student_count || 0} students
                </span>
              </div>
              {cls.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{cls.description}</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      Join Code: <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">{cls.join_code}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(cls.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Class</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <HiX className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Math 101"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="input-field"
                    placeholder="Brief description of the class"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Class'}
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

export default TeacherDashboard;