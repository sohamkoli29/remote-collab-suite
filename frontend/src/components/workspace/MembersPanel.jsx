import { Users, Crown, Mail, UserX, Shield, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const MembersPanel = ({ 
  members, 
  currentUser, 
  isAdmin, 
  onRemoveMember, 
  onUpdateRole,
  showActions = false 
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = (role, isMobile = false) => {
    if (role === 'admin') {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-yellow-500/20 to-orange-600/20 text-yellow-300 border border-yellow-500/30 ${isMobile ? 'flex-shrink-0' : ''}`}>
          <Crown className="w-3 h-3 flex-shrink-0" />
          {!isMobile && <span className="leading-none">Admin</span>}
        </div>
      );
    }
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-300 border border-white/20 ${isMobile ? 'flex-shrink-0' : ''}`}>
        <Users className="w-3 h-3 flex-shrink-0" />
        {!isMobile && <span className="leading-none">Member</span>}
      </div>
    );
  };

  const handleRemoveClick = (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      onRemoveMember(memberId);
      setActiveDropdown(null);
    }
  };

  return (
    <div className={`glass-panel backdrop-blur-2xl bg-white/10 border-white/20 ${showActions ? '' : 'sticky top-4 sm:top-6'}`}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-white leading-tight text-sm sm:text-base">
              {showActions ? 'All Members' : 'Members'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-tight mt-0.5">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Members List */}
      <div className="divide-y divide-white/10">
        {members.map((member) => (
          <div key={member.id} className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-white/5 transition-colors duration-200 group">
            <div className="flex items-center justify-between gap-3">
              {/* Member Info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Avatar */}
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover ring-2 ring-purple-500/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-white leading-none">
                      {getInitials(member.first_name, member.last_name)}
                    </span>
                  </div>
                )}
                
                {/* Name & Email */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate leading-tight">
                      {member.first_name} {member.last_name}
                    </span>
                    {member.id === currentUser?.id && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-medium rounded border border-cyan-500/30 flex-shrink-0 leading-none">
                        You
                      </span>
                    )}
                    {/* Mobile Role Badge */}
                    <div className="sm:hidden">
                      {getRoleBadge(member.role, true)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 leading-tight">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate text-xs">{member.email}</span>
                  </div>
                </div>
              </div>
              
              {/* Role & Actions */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Desktop Role Badge */}
                {!showActions && (
                  <div className="hidden sm:block">
                    {getRoleBadge(member.role)}
                  </div>
                )}
                
                {showActions && isAdmin && member.id !== currentUser?.id ? (
                  <>
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-2">
                      {/* Role Selector */}
                      <select
                        value={member.role}
                        onChange={(e) => onUpdateRole(member.id, e.target.value)}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg text-white text-xs font-medium focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 cursor-pointer leading-none min-w-[90px]"
                      >
                        <option value="member" className="bg-slate-800">Member</option>
                        <option value="admin" className="bg-slate-800">Admin</option>
                      </select>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveClick(member.id)}
                        className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                        title="Remove member"
                      >
                        <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Mobile Actions Dropdown */}
                    <div className="sm:hidden relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeDropdown === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-lg shadow-lg z-10 animate-scale-in origin-top-right">
                          <div className="py-1">
                            {/* Role Selection */}
                            <div className="px-3 py-2 border-b border-white/10">
                              <label className="text-xs font-medium text-gray-300 mb-1 block">Change Role</label>
                              <select
                                value={member.role}
                                onChange={(e) => {
                                  onUpdateRole(member.id, e.target.value);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-2 py-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50"
                              >
                                <option value="member" className="bg-slate-800">Member</option>
                                <option value="admin" className="bg-slate-800">Admin</option>
                              </select>
                            </div>
                            
                            {/* Remove Action */}
                            <button
                              onClick={() => handleRemoveClick(member.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-medium transition-colors duration-200"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Remove Member
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  showActions && (
                    <div className="hidden sm:block">
                      {getRoleBadge(member.role)}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Mobile Expanded Info */}
            {showActions && isAdmin && member.id !== currentUser?.id && (
              <div className="sm:hidden mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Role: <span className="text-white font-medium capitalize">{member.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Empty State */}
        {members.length === 0 && (
          <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-white font-semibold text-sm sm:text-base mb-1">No members yet</p>
            <p className="text-xs sm:text-sm text-gray-400 max-w-[200px] mx-auto">
              Invite people to join this workspace
            </p>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-10 sm:hidden"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};

export default MembersPanel;