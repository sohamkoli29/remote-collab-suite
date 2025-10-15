import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workspaceAPI } from '../services/api';

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

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
    try {
      const response = await workspaceAPI.create(newWorkspace);
      setWorkspaces(prev => [response.data.workspace, ...prev]);
      setNewWorkspace({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert(error.response?.data?.error || 'Failed to create workspace');
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Workspaces</h1>
          <p className="text-gray-600 mt-1">Collaborate with your team in dedicated workspaces</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create Workspace
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Create New Workspace</h3>
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                placeholder="Enter workspace name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                placeholder="Enter workspace description (optional)"
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Create Workspace
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            to={`/workspace/${workspace.id}`}
            className="card hover:shadow-md transition-shadow duration-200 hover:border-primary-300 block"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {getInitials(workspace.name)}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                workspace.userRole === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {workspace.userRole}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
              {workspace.name}
            </h3>
            
            {workspace.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workspace.description}</p>
            )}
            
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{workspace.memberCount} members</span>
              <span className="text-primary-600 hover:text-primary-700 font-medium">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {workspaces.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-gray-600 mb-4">Create your first workspace to start collaborating with your team.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create Workspace
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;