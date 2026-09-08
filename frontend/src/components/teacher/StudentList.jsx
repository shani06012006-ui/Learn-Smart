// frontend/src/components/teacher/StudentList.jsx

import { useState } from 'react';
import { UserCircleIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const StudentList = ({ students, onBlock, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students?.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (isOnline) => {
    if (isOnline) {
      return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
    }
    return <ClockIcon className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = (isOnline) => {
    return isOnline ? 'Online' : 'Offline';
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredStudents?.map((student) => (
                <tr key={student.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">ID: {student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-600">{student.email}</td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(student.is_online)}
                      <span className={`text-sm ${student.is_online ? 'text-success-600' : 'text-gray-500'}`}>
                        {getStatusText(student.is_online)}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewProfile?.(student.id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onBlock?.(student.id)}
                        className={`text-sm font-medium ${
                          student.is_blocked 
                            ? 'text-success-600 hover:text-success-700' 
                            : 'text-danger-600 hover:text-danger-700'
                        }`}
                      >
                        {student.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents?.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;