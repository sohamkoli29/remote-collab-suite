import { useState, useEffect } from 'react';
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
import { 
  Loader2, MessageSquare, UserPlus, Video, Crown, Copy, 
  CheckCircle2, ClipboardList, FileText, Palette, FolderOpen,
  TrendingUp, Users, BarChart3, Settings, ArrowLeft, Sparkles,
  Calendar, Shield, Bell, AlertTriangle, ChevronRight, Activity
} from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

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
      fetchWorkspace();
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
      fetchWorkspace();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await workspaceAPI.updateMemberRole(workspaceId, userId, newRole);
      fetchWorkspace();
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
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        <div className="relative z-10 text-center space-y-6 animate-scale-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-neon animate-pulse-glow">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-white">Loading Workspace</h3>
            <p className="text-gray-300">Setting up your collaborative environment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        <div className="relative z-10 glass-panel backdrop-blur-2xl bg-white/10 border-white/20 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-neon mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white mb-3">
            {error || 'Workspace Not Found'}
          </h3>
          <p className="text-gray-300 mb-8">
            {error ? 'We encountered an error loading the workspace.' : 'This workspace does not exist or you don\'t have access.'}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = workspace.userRole === 'admin';

  const tabs = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'documents', icon: FileText, label: 'Documents' },
    { id: 'tasks', icon: ClipboardList, label: 'Tasks' },
    { id: 'files', icon: FolderOpen, label: 'Files' },
    { id: 'whiteboard', icon: Palette, label: 'Whiteboard' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        
        {/* Workspace Header */}
        <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-slide-in-down">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Top Row - Back Button & Title */}
            <div className="flex items-start space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 sm:p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white truncate">{workspace.name}</h1>
                  {isAdmin && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 text-yellow-300 border border-yellow-500/30 px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit">
                      <Crown className="w-3 h-3" />
                      <span>Admin</span>
                    </div>
                  )}
                </div>
                {workspace.description && (
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">{workspace.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                    <span>{members.length} members</span>
                  </span>
                  <span className="hidden sm:flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span>Active</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`group relative overflow-hidden px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 ${
                  showChat 
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-white/5 backdrop-blur-sm text-white border-2 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{showChat ? 'Hide Chat' : 'Show Chat'}</span>
                </span>
              </button>
              
              <div className="flex gap-2 sm:gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="group relative overflow-hidden bg-white/5 backdrop-blur-sm text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold border-2 border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-300 flex-1 sm:flex-none"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">Invite</span>
                    </span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowVideoCall(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex-1 sm:flex-none"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Join Call</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel (Floating) */}
        {showChat && (
          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-slide-in-up">
            <ChatPanel workspaceId={workspaceId} isOpen={showChat} />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 p-2 animate-fade-in overflow-x-auto">
          <nav className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'chat' && !showChat) {
                      setShowChat(true);
                    }
                  }}
                  className={`group relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96 animate-fade-in">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-3 shadow-neon group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{members.length}</div>
                      <div className="text-xs sm:text-sm text-gray-300">Total Members</div>
                    </div>
                  </div>

                  <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-3 shadow-neon group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">0</div>
                      <div className="text-xs sm:text-sm text-gray-300">Active Tasks</div>
                    </div>
                  </div>

                  <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-3 shadow-neon group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">0</div>
                      <div className="text-xs sm:text-sm text-gray-300">Documents</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-display font-bold text-white">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { icon: MessageSquare, title: 'Open Chat', desc: 'Communicate with your team', gradient: 'from-blue-500 to-cyan-500', action: () => setActiveTab('chat') },
                      { icon: ClipboardList, title: 'Task Board', desc: 'Manage team tasks', gradient: 'from-green-500 to-emerald-500', action: () => setActiveTab('tasks') },
                      { icon: FileText, title: 'Documents', desc: 'Collaborative editing', gradient: 'from-purple-500 to-pink-500', action: () => setActiveTab('documents') },
                      { icon: Palette, title: 'Whiteboard', desc: 'Visual collaboration', gradient: 'from-orange-500 to-red-500', action: () => setShowWhiteboard(true) },
                    ].map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                          <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors text-sm sm:text-base truncate">{action.title}</div>
                          <div className="text-xs sm:text-sm text-gray-400 truncate">{action.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
 {/* Recent Activity */}
<div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
  <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-4 sm:mb-6">Recent Activity</h3>
  <div className="space-y-3">
    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-xl">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-semibold">You</span> created this workspace
        </p>
        <p className="text-xs text-gray-400">{new Date(workspace.created_at).toLocaleDateString()}</p>
      </div>
    </div>
    
    {members.slice(0, 3).map((member) => (
      <div key={member.id} className="flex items-center space-x-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-xl">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">
            <span className="font-semibold">{member.first_name} {member.last_name}</span> joined the workspace
          </p>
          <p className="text-xs text-gray-400">{new Date(member.joinedAt).toLocaleDateString()}</p>
        </div>
      </div>
    ))}
    
    {members.length === 0 && (
      <div className="text-center py-8 sm:py-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
        </div>
        <p className="text-gray-300 font-medium mb-2 text-sm sm:text-base">No recent activity</p>
        <p className="text-xs sm:text-sm text-gray-400">Invite members to get started!</p>
      </div>
    )}
  </div>
</div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                <MembersPanel 
                  members={members} 
                  currentUser={user}
                  isAdmin={isAdmin}
                  onRemoveMember={handleRemoveMember}
                  onUpdateRole={handleUpdateRole}
                />
                
                {/* Workspace Info */}
                <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
                  <h3 className="font-semibold text-white text-base sm:text-lg mb-4">Workspace Info</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Workspace ID</label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-white/5 px-2 sm:px-3 py-2 rounded-lg font-mono text-gray-300 truncate">
                          {workspace.id}
                        </code>
                        <button
                          onClick={handleCopyId}
                          className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 flex-shrink-0"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Created</label>
                      <p className="text-sm text-white">
                        {new Date(workspace.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Your Role</label>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        workspace.userRole === 'admin' 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-600/20 text-yellow-300 border border-yellow-500/30' 
                          : 'bg-white/10 text-gray-300 border border-white/20'
                      }`}>
                        {workspace.userRole === 'admin' && <Crown className="w-3 h-3" />}
                        <span className="capitalize">{workspace.userRole}</span>
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
            <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Collaborative Whiteboard</h3>
                  <p className="text-sm text-gray-300">
                    Draw, brainstorm, and collaborate in real-time
                  </p>
                </div>
                <button
                  onClick={() => setShowWhiteboard(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>Open Whiteboard</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </div>
              
              {/* Whiteboard Preview */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-white/10 h-80 flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-neon">
                    <Palette className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-2">Click "Open Whiteboard" to start collaborating</p>
                  <p className="text-sm text-gray-400">Draw, sketch, and brainstorm with your team in real-time</p>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Palette, title: 'Drawing Tools', desc: 'Pen, eraser, shapes, and more', gradient: 'from-purple-500 to-pink-500' },
                  { icon: Users, title: 'Real-time Sync', desc: 'See others drawing live', gradient: 'from-cyan-500 to-blue-500' },
                  { icon: TrendingUp, title: 'Export', desc: 'Save as PNG or JPG', gradient: 'from-green-500 to-emerald-500' },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Workspace Files</h3>
                  <p className="text-sm text-gray-300">
                    Share and manage files with your team
                  </p>
                </div>
                <button
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className={`group relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    showFileUpload
                      ? 'bg-white/5 text-white border-2 border-white/10'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                  }`}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5" />
                    <span>{showFileUpload ? 'Cancel' : 'Upload File'}</span>
                  </span>
                  {!showFileUpload && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  )}
                </button>
              </div>

              {/* File Upload Section */}
              {showFileUpload && (
                <div className="mb-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-white/10 animate-scale-in">
                  <FileUpload
                    workspaceId={workspaceId}
                    onUploadComplete={(file) => {
                      setShowFileUpload(false);
                      window.location.reload();
                    }}
                  />
                </div>
              )}

              {/* File Browser */}
              <FileBrowser workspaceId={workspaceId} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
              <ChatPanel workspaceId={workspaceId} isOpen={true} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">Workspace Members</h3>
                    <p className="text-sm text-gray-300">
                      Manage members and their permissions
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <UserPlus className="w-5 h-5" />
                        <span>Invite Members</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
                {[
                  { value: members.length, label: 'Total Members', gradient: 'from-purple-500 to-pink-500', icon: Users },
                  { value: members.filter(m => m.role === 'admin').length, label: 'Admins', gradient: 'from-yellow-500 to-orange-500', icon: Crown },
                  { value: members.filter(m => m.role === 'member').length, label: 'Members', gradient: 'from-green-500 to-emerald-500', icon: CheckCircle2 },
                ].map((stat, index) => (
                  <div key={index} className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 text-center group hover:bg-white/15 transition-all duration-300">
                    <div className={`w-14 h-14 mx-auto mb-3 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Pending Invitations */}
              <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
                <h3 className="text-xl font-display font-bold text-white mb-4">Pending Invitations</h3>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-300 font-medium mb-2">No pending invitations</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline transition-colors"
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
              <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
                <h3 className="text-2xl font-display font-bold text-white mb-6">Workspace Settings</h3>
                {isAdmin ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-200">
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300"
                        defaultValue={workspace.name}
                        disabled
                      />
                      <p className="text-sm text-gray-400">
                        Workspace name cannot be changed yet. This feature is coming soon.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-200">
                        Description
                      </label>
                      <textarea
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 resize-none"
                        rows={3}
                        defaultValue={workspace.description}
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-200">
                        Workspace Visibility
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 cursor-pointer">
                          <input type="radio" name="visibility" className="mr-3" defaultChecked disabled />
                          <div>
                            <div className="text-sm text-white font-medium">Private</div>
                            <div className="text-xs text-gray-400">Only invited members can join</div>
                          </div>
                        </label>
                        <label className="flex items-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 opacity-50 cursor-not-allowed">
                          <input type="radio" name="visibility" className="mr-3" disabled />
                          <div>
                            <div className="text-sm text-white font-medium">Public</div>
                            <div className="text-xs text-gray-400">Anyone with the link can join (Coming Soon)</div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="border-t border-white/10 pt-6">
                      <button className="px-6 py-3 bg-white/5 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/10 opacity-50 cursor-not-allowed" disabled>
                        Save Changes (Coming Soon)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-neon">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-xl font-display font-bold text-white mb-3">Admin Access Required</h4>
                    <p className="text-gray-300 mb-2">
                      Only workspace admins can modify workspace settings.
                    </p>
                    <p className="text-sm text-gray-400">
                      Contact a workspace admin to make changes.
                    </p>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              {isAdmin && (
                <div className="glass-panel backdrop-blur-2xl bg-red-500/10 border-red-500/30">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-display font-bold text-red-300 mb-2">Danger Zone</h4>
                      <p className="text-sm text-red-200">
                        Permanent actions that cannot be undone
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => alert('This feature will be implemented later')}
                        className="px-6 py-3 bg-white/5 backdrop-blur-sm text-red-300 rounded-xl font-semibold border-2 border-red-500/30 hover:border-red-500/50 hover:bg-white/10 transition-all duration-300"
                      >
                        Archive Workspace
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you absolutely sure? This will delete the workspace and all its data permanently.')) {
                            alert('Workspace deletion will be implemented later');
                          }
                        }}
                        className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                      >
                        <span className="relative z-10">Delete Workspace</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* User Preferences */}
              <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
                <h3 className="text-xl font-display font-bold text-white mb-6">Your Preferences</h3>
                <div className="space-y-6">
                  {[
                    { title: 'Email Notifications', desc: 'Receive email updates for workspace activity' },
                    { title: 'Desktop Notifications', desc: 'Show browser notifications for new messages' },
                  ].map((pref, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1">{pref.title}</label>
                        <p className="text-sm text-gray-400">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-14 h-7 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-cyan-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
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
    </div>
  );
};

export default Workspace;