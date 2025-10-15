

const MembersPanel = ({ 
  members, 
  currentUser, 
  isAdmin, 
  onRemoveMember, 
  onUpdateRole,
  showActions = false 
}) => {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: 'bg-purple-100 text-purple-800',
      member: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${roleStyles[role] || roleStyles.member}`}>
        {role}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${showActions ? '' : 'sticky top-6'}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          {showActions ? 'All Members' : 'Members'} ({members.length})
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {members.map((member) => (
          <div key={member.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {getInitials(member.first_name, member.last_name)}
                  </span>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {member.first_name} {member.last_name}
                  {member.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-gray-500">(You)</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getRoleBadge(member.role)}
              
              {showActions && isAdmin && member.id !== currentUser?.id && (
                <div className="flex space-x-1">
                  <select
                    value={member.role}
                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                    title="Remove member"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersPanel;