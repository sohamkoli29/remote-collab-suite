import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, User, Mail, Briefcase, Phone, FileText, 
  Upload, Trash2, Loader2, Camera, CheckCircle,
  AlertCircle, UserPlus
} from 'lucide-react';

const ProfileEditorModal = ({ onClose }) => {
  const { user, updateUserProfile, uploadAvatar, deleteAvatar } = useAuth();
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    job_title: user?.job_title || ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await deleteAvatar();
    
    if (result.success) {
      setAvatarPreview(null);
      setSelectedFile(null);
      setSuccess('Profile picture removed successfully');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload avatar first if selected
      if (selectedFile) {
        const avatarResult = await uploadAvatar(selectedFile);
        if (!avatarResult.success) {
          setError(avatarResult.error);
          setLoading(false);
          return;
        }
      }

      // Update profile data
      const profileResult = await updateUserProfile(formData);
      
      if (profileResult.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(profileResult.error);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in" onClick={onClose}>
      <div 
        className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">Edit Profile</h2>
              <p className="text-gray-300 text-sm leading-tight mt-1">Update your personal information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm flex items-center gap-2 animate-scale-in">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="leading-tight flex-1">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm flex items-center gap-2 animate-scale-in">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="leading-tight flex-1">{success}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10">
            <div className="relative group">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-2 border-white/20 shadow-lg group-hover:border-purple-400/50 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center border-2 border-white/20 shadow-lg group-hover:scale-105 transition-all duration-300">
                  <span className="text-white text-2xl sm:text-3xl font-bold">
                    {user?.first_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-white mb-2">Profile Picture</p>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium border-2 border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Change Photo</span>
                </button>
                
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={loading}
                    className="group relative overflow-hidden bg-red-500/10 backdrop-blur-sm text-red-300 px-4 py-2 rounded-lg font-medium border-2 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
                <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>First Name <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 leading-normal text-sm sm:text-base"
                placeholder="John"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
                <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Last Name <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 leading-normal text-sm sm:text-base"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Email</span>
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-gray-400 cursor-not-allowed text-sm sm:text-base"
            />
            <p className="text-xs text-gray-400">Email cannot be changed</p>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
              <Briefcase className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span>Job Title</span>
            </label>
            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 leading-normal text-sm sm:text-base"
              placeholder="Software Engineer"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
              <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Phone Number</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 leading-normal text-sm sm:text-base"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>Bio</span>
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg sm:rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 resize-none text-sm sm:text-base"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-400">
              Brief description for your profile. Max 500 characters.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 backdrop-blur-sm text-white rounded-lg sm:rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 leading-none text-sm sm:text-base disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex-1 sm:flex-none overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                    <span className="leading-none">Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="leading-none">Save Changes</span>
                  </>
                )}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditorModal;