// frontend/src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCredentials } from '../store/authSlice';
import { HiLogout, HiHome } from 'react-icons/hi';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  };
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container-custom px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LS</span>
          </div>
          <span className="text-xl font-bold text-primary-600">LearnSmart</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm text-gray-600 hidden md:block">
                {user.first_name || user.username}
              </span>
              <Link to="/" className="p-2 rounded-full hover:bg-gray-100">
                <HiHome className="h-5 w-5 text-gray-600" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100 text-red-600"
              >
                <HiLogout className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;