// frontend/src/components/teacher/ClassCard.jsx

import { Link } from 'react-router-dom';
import { UserGroupIcon, AcademicCapIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';

const ClassCard = ({ classData }) => {
  const { id, name, subject, description, student_count, join_code, created_at } = classData;

  return (
    <Link to={`/teacher/classes/${id}`}>
      <Card hover className="h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{subject}</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {student_count || 0} students
          </span>
        </div>
        
        {description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{description}</p>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Join Code: <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">{join_code}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Created: {new Date(created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{student_count || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ClassCard;