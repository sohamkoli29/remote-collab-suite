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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 sticky top-0 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-purple-500/10 border-b border-white/10' 
          : 'bg-slate-900/80 backdrop-blur-lg border-b border-white/5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-neon group-hover:shadow-neon-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    CollabSuite
                  </h1>
                  <p className="text-xs text-gray-400 -mt-1">Remote Work Platform</p>
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
                      className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                        item.current
                          ? 'bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/20'
                          : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        item.current ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'
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
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Notifications Button */}
              <button className="relative p-2 sm:p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 hidden sm:flex">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              </button>

              {/* User Menu */}
              <div className="user-menu-container relative hidden md:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 group"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover ring-2 ring-purple-500/50 shadow-md"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-neon">
                      <span className="text-white text-sm font-bold">
                        {user?.first_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-white">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                    showUserMenu ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-scale-in origin-top-right">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">{user?.email}</p>
                      {user?.job_title && (
                        <p className="text-xs text-cyan-400 mt-1 flex items-center space-x-1">
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
                                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
                className="md:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
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
          <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-xl animate-slide-in-down">
            <div className="px-4 py-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 px-3 py-3 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-xl border border-purple-500/30">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-neon">
                    <span className="text-white font-bold">
                      {user?.first_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-300 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Notifications (Mobile) */}
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all sm:hidden">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notifications</span>
                </div>
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  3
                </span>
              </button>

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
                        ? 'bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-white border border-purple-500/30'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Menu Actions */}
              <div className="pt-3 border-t border-white/10 space-y-2">
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
                          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
      <main className="relative z-10 flex-1">
        {children}
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileEditorModal onClose={() => setShowProfile(false)} />
      )}

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;