import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workspaceAPI } from '../services/api';
import { Plus, Users, ArrowRight, Briefcase, Sparkles, Crown, X, Loader2, FolderOpen, Zap, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await workspaceAPI.getAll();
      setWorkspaces(response.data.workspaces || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await workspaceAPI.create(newWorkspace);
      setWorkspaces(prev => [response.data.workspace, ...prev]);
      setNewWorkspace({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert(error.response?.data?.error || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGradientColor = (index) => {
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-cyan-500 to-blue-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '4s' }}></div>
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        <div className="relative z-10 text-center space-y-6 animate-scale-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-neon animate-pulse-glow">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-white">Loading Your Workspaces</h3>
            <p className="text-gray-300">Preparing your collaborative environment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-12 animate-slide-in-down">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-neon group-hover:shadow-neon-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
      <img
        src="/Logo.png"
        alt="KaaryaSetu Logo"
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
      />
    </div>
                <h1 className="text-5xl font-display font-bold text-white">
                  Your Workspaces
                </h1>
              </div>
              <p className="text-gray-300 text-lg flex items-center space-x-2 ml-15">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Collaborate with your team in dedicated spaces</span>
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Workspace</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 font-medium mb-2">Total Workspaces</p>
                <p className="text-4xl font-display font-bold text-white">{workspaces.length}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Active</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 font-medium mb-2">Total Members</p>
                <p className="text-4xl font-display font-bold text-white">
                  {workspaces.reduce((acc, w) => acc + (w.memberCount || 0), 0)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400 font-medium">Collaborating</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 font-medium mb-2">Admin Rights</p>
                <p className="text-4xl font-display font-bold text-white">
                  {workspaces.filter(w => w.userRole === 'admin').length}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">Privileges</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform duration-300">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Create Workspace Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 max-w-2xl w-full animate-scale-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-neon">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white">Create New Workspace</h3>
                    <p className="text-sm text-gray-300">Set up a collaborative space for your team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-200">
                    Workspace Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Briefcase className={`w-5 h-5 transition-colors duration-300 ${
                        focusedInput === 'name' ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300"
                      value={newWorkspace.name}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="e.g., Marketing Team, Product Development"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-200">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 resize-none"
                    rows={4}
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                    onFocus={() => setFocusedInput('description')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Describe the purpose of this workspace..."
                  />
                </div>

                <div className="flex items-center space-x-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="group relative flex-1 overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      {creating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>Create Workspace</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-8 py-3.5 bg-white/5 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {workspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {workspaces.map((workspace, index) => (
              <Link
                key={workspace.id}
                to={`/workspace/${workspace.id}`}
                className="group glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 hover:shadow-glass-lg transition-all duration-300 relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradientColor(index)}`} />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradientColor(index)} flex items-center justify-center shadow-neon transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <span className="text-white font-bold text-xl">
                      {getInitials(workspace.name)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {workspace.userRole === 'admin' && (
                      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>Admin</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-display font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {workspace.name}
                  </h3>
                  
                  {workspace.description && (
                    <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                      {workspace.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium">{workspace.memberCount} members</span>
                    </div>
                    <div className="flex items-center space-x-1 text-cyan-400 font-semibold text-sm group-hover:space-x-2 transition-all">
                      <span>Open</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Add New Workspace Card */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="glass-panel backdrop-blur-2xl bg-white/5 border-2 border-dashed border-white/20 hover:border-purple-400/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-neon">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create New Workspace</h3>
              <p className="text-sm text-gray-300 text-center px-4">
                Start collaborating with your team
              </p>
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 text-center py-20 animate-scale-in">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-neon animate-float">
                <FolderOpen className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-4">
                No Workspaces Yet
              </h3>
              <p className="text-gray-300 text-lg mb-10 leading-relaxed">
                Create your first workspace to start collaborating with your team. Organize projects, share files, and communicate effectively.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="group relative inline-flex items-center space-x-2 overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Workspace</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        {workspaces.length > 0 && (
          <div className="mt-12 glass-panel backdrop-blur-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-white/20 animate-fade-in">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-lg mb-2 flex items-center space-x-2">
                  <span>💡 Pro Tip</span>
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Organize workspaces by team, project, or department. Invite members to collaborate on tasks, documents, and video calls in real-time. Use admin privileges to manage permissions and workspace settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;