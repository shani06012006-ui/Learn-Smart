// frontend/src/components/layout/Sidebar.jsx

import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HomeIcon,
  UsersIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const teacherMenu = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'My Classes', path: '/teacher/classes', icon: UsersIcon },
    { name: 'Exams', path: '/teacher/exams', icon: ClipboardDocumentListIcon },
    { name: 'Materials', path: '/teacher/materials', icon: BookOpenIcon },
    { name: 'Analytics', path: '/teacher/analytics', icon: ChartBarIcon },
    { name: 'Live Classes', path: '/teacher/live', icon: VideoCameraIcon },
    { name: 'Messages', path: '/messages', icon: ChatBubbleLeftIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  const studentMenu = [
    { name: 'Dashboard', path: '/student/dashboard', icon: HomeIcon },
    { name: 'My Classes', path: '/student/classes', icon: AcademicCapIcon },
    { name: 'Exams', path: '/student/exams', icon: ClipboardDocumentListIcon },
    { name: 'Materials', path: '/student/materials', icon: BookOpenIcon },
    { name: 'Performance', path: '/student/performance', icon: ChartBarIcon },
    { name: 'Live Classes', path: '/student/live', icon: VideoCameraIcon },
    { name: 'Messages', path: '/messages', icon: ChatBubbleLeftIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  const menuItems = user?.user_type === 'teacher' ? teacherMenu : studentMenu;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-50 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LS</span>
            </div>
            <span className="text-xl font-bold text-primary-600">LearnSmart</span>
          </Link>
        </div>

        <nav className="mt-4 px-2 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mr-3 transition-colors ${
                    isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-8 bg-primary-600 rounded-full"></div>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="px-4 py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {user?.user_type}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;