// frontend/src/components/layout/Navbar.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  Cog6ToothIcon, 
  UserIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { logoutUser } from '../../store/slices/authSlice';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications || { unreadCount: 0 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left section */}
      <button
        className="p-2 rounded-md hover:bg-gray-100 lg:hidden transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Bars3Icon className="h-6 w-6 text-gray-600" />
      </button>

      <div className="flex-1 flex items-center justify-between">
        {/* Search - Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-md ml-4">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Search - Mobile */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-full hover:bg-gray-100 relative transition-colors">
            <BellIcon className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserCircleIcon className="h-8 w-8 text-primary-600" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.first_name || user?.username || 'User'}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 slide-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full capitalize">
                    {user?.role || user?.user_type || 'User'}
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="h-4 w-4 mr-3 text-gray-500" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-500" />
                  Settings
                </Link>
                <hr className="my-1" />
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  onClick={handleLogout}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-danger-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="absolute top-16 left-0 right-0 p-4 bg-white border-b border-gray-200 md:hidden">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;