import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { 
  X, UserPlus, Mail, Shield, Loader2, AlertCircle, 
  Search, Check, ChevronDown 
} from 'lucide-react';

const InviteModal = ({ onClose, onInvite, existingMembers }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const existingEmails = existingMembers.map(m => m.email);

  useEffect(() => {
    if (email.length >= 3) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.search(email);
      const filteredResults = response.data.users
        .filter(user => !existingEmails.includes(user.email))
        .slice(0, 5);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (existingEmails.includes(email)) {
      setError('This user is already a member');
      return;
    }

    try {
      await onInvite(email, role);
      setEmail('');
      setRole('member');
      setIsDropdownOpen(false);
    } catch (error) {
      setError(error);
    }
  };

  const selectUser = (user) => {
    setEmail(user.email);
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-xl sm:rounded-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 sticky top-0 bg-white/5 backdrop-blur-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-display font-bold text-white truncate leading-tight">Invite to Workspace</h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate leading-tight mt-0.5 sm:mt-1">Add a new member to collaborate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-scale-in">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="leading-tight flex-1">{error}</span>
              </div>
            )}

            {/* Email Input with Search */}
            <div className="space-y-2 sm:space-y-3 relative search-container">
              <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 leading-normal text-sm sm:text-base"
                  placeholder="Enter email address"
                  required
                />
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Search Results Dropdown */}
              {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden animate-scale-in max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 transition-colors duration-200 flex items-center gap-2 sm:gap-3 border-b border-white/5 last:border-b-0"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-xs font-bold text-white leading-none">
                          {getInitials(user.first_name, user.last_name)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white leading-tight truncate">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-400 leading-tight truncate">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role Select */}
            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
                <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Role</span>
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 cursor-pointer leading-normal text-sm sm:text-base appearance-none pr-10"
                >
                  <option value="member" className="bg-slate-800 text-sm">Member - Can view and contribute</option>
                  <option value="admin" className="bg-slate-800 text-sm">Admin - Full workspace control</option>
                </select>
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
              </div>
              
              {/* Role Description */}
              <div className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                {role === 'member' ? (
                  <span>Members can view, create, and edit content in the workspace</span>
                ) : (
                  <span>Admins have full control including member management and workspace settings</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex-1 overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                      <span className="leading-none">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="leading-none">Send Invite</span>
                    </>
                  )}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white/5 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 leading-none text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;