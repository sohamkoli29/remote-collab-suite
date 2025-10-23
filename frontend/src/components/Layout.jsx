import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileEditorModal from './profile/ProfileEditorModal';
import Footer from './Footer/Footer';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  User, 
  Sparkles, 
  Menu, 
  X,
  Settings,
  Bell,
  ChevronDown
} from 'lucide-react';

const Layout = ({ children }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard,
      current: location.pathname === '/' 
    },
  ];

  const userMenuItems = [
    { name: 'Your Profile', icon: User, action: () => setShowProfile(true) },
    { name: 'Settings', icon: Settings, action: () => console.log('Settings') },
    { name: 'Sign Out', icon: LogOut, action: logout, danger: true },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20' 
          : 'bg-white/70 backdrop-blur-lg border-b border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-neon transition-all duration-300 group-hover:scale-110">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-display font-bold text-gradient bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    CollabSuite
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Remote Work Platform</p>
                </div>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex md:space-x-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                        item.current
                          ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-purple-600 shadow-inner-glow'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        item.current ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600'
                      } transition-colors`} />
                      <span>{item.name}</span>
                      
                      {/* Active Indicator */}
                      {item.current && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications Button */}
              <button className="relative btn-icon hidden sm:flex">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>

              {/* User Menu */}
              <div className="user-menu-container relative hidden md:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:shadow-lg group"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-white shadow-md"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">
                        {user?.first_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                    showUserMenu ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel animate-scale-in origin-top-right">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                      {user?.job_title && (
                        <p className="text-xs text-purple-600 mt-1 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{user.job_title}</span>
                        </p>
                      )}
                    </div>
                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              item.action();
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                              item.danger
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-gray-700 hover:bg-white/60'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden btn-icon"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl animate-slide-in-down">
            <div className="px-4 py-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 px-3 py-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.first_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      item.current
                        ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-purple-600'
                        : 'text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Menu Actions */}
              <div className="pt-3 border-t border-gray-200/50 space-y-2">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        item.action();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        item.danger
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-white/60'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileEditorModal onClose={() => setShowProfile(false)} />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;