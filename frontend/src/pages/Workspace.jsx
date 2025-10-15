import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../services/socket';
import MembersPanel from '../components/workspace/MembersPanel';
import InviteModal from '../components/workspace/InviteModal';
import ChatPanel from '../components/chat/ChatPanel';
import TaskBoard from '../components/tasks/TaskBoard';
import DocumentWorkspace from '../components/documents/DocumentWorkspace';
import VideoCallModal from '../components/video/VideoCallModal';
import CallNotification from '../components/video/CallNotification';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import FileUpload from '../components/files/FileUpload';
import FileBrowser from '../components/files/FileBrowser';

const Workspace = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);
  
  useEffect(() => {
  const handleIncomingCall = (data) => {
    setIncomingCall({
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      workspaceName: workspace?.name
    });
  };

  socketService.on('incoming-call', handleIncomingCall);

  return () => {
    socketService.off('incoming-call', handleIncomingCall);
  };
}, [workspace]);

  const fetchWorkspace = async () => {
    try {
      const response = await workspaceAPI.getById(workspaceId);
      setWorkspace(response.data.workspace);
      setMembers(response.data.members);
    } catch (error) {
      console.error('Error fetching workspace:', error);
      setError('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (email, role) => {
    try {
      await workspaceAPI.inviteUser(workspaceId, email, role);
      setShowInviteModal(false);
      fetchWorkspace(); // Refresh data
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error.response?.data?.error || 'Failed to invite user';
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await workspaceAPI.removeMember(workspaceId, userId);
      fetchWorkspace(); // Refresh data
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await workspaceAPI.updateMemberRole(workspaceId, userId, newRole);
      fetchWorkspace(); // Refresh data
    } catch (error) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleAcceptCall = () => {
  setIncomingCall(null);
  setShowVideoCall(true);
};


const handleDeclineCall = () => {
  setIncomingCall(null);
  // Optionally send decline notification to caller
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Workspace not found</div>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isAdmin = workspace.userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-gray-600 mt-2">{workspace.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                showChat 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-primary"
              >
                Invite Members
              </button>
            )}
            <button
                onClick={() => setShowVideoCall(true)}
                 className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                 <span>Join Video Call</span>
                </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <span>{members.length} members</span>
          <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            workspace.userRole === 'admin' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {workspace.userRole}
          </span>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ChatPanel workspaceId={workspaceId} isOpen={showChat} />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'documents', 'tasks','files','whiteboard', 'chat', 'members', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'chat' && !showChat) {
                  setShowChat(true);
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'chat' ? `${tab} ${showChat ? '▲' : '▼'}` : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-primary-600">{members.length}</div>
                  <div className="text-sm text-gray-600">Total Members</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Active Tasks</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Documents</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Open Chat</div>
                      <div className="text-sm text-gray-600">Communicate with your team</div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Task Board</div>
                      <div className="text-sm text-gray-600">Manage team tasks</div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Documents</div>
                      <div className="text-sm text-gray-600">Collaborative editing</div>
                    </div>
                  </button>
                  
                <button 
                   onClick={() => setShowWhiteboard(true)}
                   className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                 >
                   <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                     <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                     </svg>
                   </div>
                   <div className="text-left">
                     <div className="font-medium text-gray-900">Whiteboard</div>
                     <div className="text-sm text-gray-600">Start visual collaboration</div>
                   </div>
                 </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">You</span> created a new workspace
                      </p>
                      <p className="text-xs text-gray-500">{new Date(workspace.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {members.slice(0, 3).map((member, index) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{member.first_name} {member.last_name}</span> joined the workspace
                        </p>
                        <p className="text-xs text-gray-500">{new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  
                  {members.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2">No recent activity yet</p>
                      <p className="text-sm mt-1">Invite members to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Members Sidebar */}
            <div className="space-y-6">
              <MembersPanel 
                members={members} 
                currentUser={user}
                isAdmin={isAdmin}
                onRemoveMember={handleRemoveMember}
                onUpdateRole={handleUpdateRole}
              />
              
              {/* Workspace Info */}
              <div className="card">
                <h3 className="font-medium text-gray-900 mb-4">Workspace Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Workspace ID</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate flex-1">
                        {workspace.id}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(workspace.id)}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(workspace.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Your Role</label>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                      workspace.userRole === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workspace.userRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <DocumentWorkspace workspaceId={workspaceId} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <TaskBoard workspaceId={workspaceId} />
          </div>
        )}


      {activeTab === 'whiteboard' && (
  <div className="space-y-6">
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium">Collaborative Whiteboard</h3>
          <p className="text-sm text-gray-600 mt-1">
            Draw, brainstorm, and collaborate in real-time
          </p>
        </div>
        <button
          onClick={() => setShowWhiteboard(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Open Whiteboard</span>
        </button>
      </div>
      
      {/* Whiteboard Preview */}
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-600 font-medium">Click "Open Whiteboard" to start collaborating</p>
          <p className="text-sm text-gray-500 mt-2">Draw, sketch, and brainstorm with your team in real-time</p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="flex items-start space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Drawing Tools</h4>
            <p className="text-sm text-gray-600">Pen, eraser, shapes, and more</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Real-time Sync</h4>
            <p className="text-sm text-gray-600">See others drawing live</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Export</h4>
            <p className="text-sm text-gray-600">Save as PNG or JPG</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{activeTab === 'files' && (
  <div className="space-y-6">
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium">Workspace Files</h3>
          <p className="text-sm text-gray-600 mt-1">
            Share and manage files with your team
          </p>
        </div>
        <button
          onClick={() => setShowFileUpload(!showFileUpload)}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>{showFileUpload ? 'Cancel' : 'Upload File'}</span>
        </button>
      </div>

      {/* File Upload Section */}
      {showFileUpload && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <FileUpload
            workspaceId={workspaceId}
            onUploadComplete={(file) => {
              setShowFileUpload(false);
              // Refresh file list
              window.location.reload(); // Simple refresh, or implement proper state update
            }}
          />
        </div>
      )}

      {/* File Browser */}
      <FileBrowser workspaceId={workspaceId} />
    </div>
  </div>
)}




        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <ChatPanel workspaceId={workspaceId} isOpen={true} />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium">Workspace Members</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage members and their permissions in this workspace
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary"
                  >
                    Invite Members
                  </button>
                )}
              </div>
              <MembersPanel 
                members={members} 
                currentUser={user}
                isAdmin={isAdmin}
                onRemoveMember={handleRemoveMember}
                onUpdateRole={handleUpdateRole}
                showActions={true}
              />
            </div>

            {/* Membership Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-primary-600">{members.length}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {members.filter(m => m.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.role === 'member').length}
                </div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
            </div>

            {/* Invitation History (Placeholder) */}
            <div className="card">
              <h3 className="text-lg font-medium mb-4">Pending Invitations</h3>
              <div className="text-center text-gray-500 py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2">No pending invitations</p>
                {isAdmin && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    Send your first invitation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium mb-4">Workspace Settings</h3>
              {isAdmin ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      defaultValue={workspace.name}
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Workspace name cannot be changed yet. This feature is coming soon.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="input-field"
                      rows={3}
                      defaultValue={workspace.description}
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workspace Visibility
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="visibility" className="mr-2" defaultChecked disabled />
                        <span className="text-sm text-gray-700">Private - Only invited members can join</span>
                      </label>
                      <label className="flex items-center opacity-50">
                        <input type="radio" name="visibility" className="mr-2" disabled />
                        <span className="text-sm text-gray-700">Public - Anyone with the link can join (Coming Soon)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button className="btn-secondary" disabled>
                      Save Changes (Coming Soon)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h4 className="mt-4 text-lg font-medium text-gray-900">Admin Access Required</h4>
                  <p className="mt-2 text-gray-600">
                    Only workspace admins can modify workspace settings.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact a workspace admin to make changes.
                  </p>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            {isAdmin && (
              <div className="card border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-red-700">Danger Zone</h4>
                    <p className="text-sm text-red-600 mt-1">
                      Permanent actions that cannot be undone
                    </p>
                  </div>
                  <div className="space-x-3">
                    <button
                      onClick={() => alert('This feature will be implemented later')}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Archive Workspace
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you absolutely sure? This will delete the workspace and all its data permanently.')) {
                          alert('Workspace deletion will be implemented later');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Your Preferences */}
            <div className="card">
              <h3 className="text-lg font-medium mb-4">Your Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Notifications</label>
                    <p className="text-sm text-gray-500">Receive email updates for workspace activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Desktop Notifications</label>
                    <p className="text-sm text-gray-500">Show browser notifications for new messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
        {showVideoCall && (
  <VideoCallModal
    workspaceId={workspaceId}
    currentUser={user}
    onClose={() => setShowVideoCall(false)}
  />
)}
{showWhiteboard && (
  <WhiteboardCanvas
    workspaceId={workspaceId}
    currentUser={user}
    onClose={() => setShowWhiteboard(false)}
  />
)}
      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
          existingMembers={members}
        />
      )}
      {incomingCall && (
  <CallNotification
    callerName={incomingCall.callerName}
    callerAvatar={incomingCall.callerAvatar}
    workspaceName={incomingCall.workspaceName}
    onAccept={handleAcceptCall}
    onDecline={handleDeclineCall}
  />
)}
    </div>
  );
};

export default Workspace;