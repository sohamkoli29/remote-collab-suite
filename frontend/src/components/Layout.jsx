import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileEditorModal from './profile/ProfileEditorModal';
import Footer from './Footer/Footer';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', current: location.pathname === '/' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">
                  Remote Collab Suite
                </h1>
              </div>
              
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      item.current
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                    onClick={() => setShowProfile(true)}
                   className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    {user?.avatar_url ? (
                     <img
                       src={user.avatar_url}
                       alt={`${user.first_name} ${user.last_name}`}
                       className="w-8 h-8 rounded-full object-cover"
                     />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                       <span className="text-white text-sm font-bold">
                          {user?.first_name?.charAt(0)?.toUpperCase()}
                       </span>
                     </div>
                   )}
                   <span className="text-sm font-medium text-gray-700">
                      {user?.first_name} {user?.last_name}
                   </span>
                  </button>

              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      {showProfile && (
  <ProfileEditorModal onClose={() => setShowProfile(false)} />
)}

        <Footer />
    </div>
  );
};

export default Layout;