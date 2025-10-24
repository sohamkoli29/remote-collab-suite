import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { workspaceAPI } from '../../services/api';
import { Loader2, Check, X, AlertCircle, Calendar, User, Flag, List } from 'lucide-react';

const CreateTaskForm = ({ listId, lists = [], workspaceId, onSubmit, onCancel, compact = false }) => {
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedListId, setSelectedListId] = useState(listId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  console.log('🚀 CreateTaskForm mounted');
  console.log('📍 workspaceId prop:', workspaceId);
  console.log('📍 listId prop:', listId);
  console.log('📍 All props:', { workspaceId, listId, lists });

  // Fetch workspace members
  useEffect(() => {
    console.log('⚡ useEffect triggered with workspaceId:', workspaceId);
    const fetchMembers = async () => {
      if (!workspaceId) {
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const response = await workspaceAPI.getById(workspaceId);
        
        console.log('🔍 Full API Response:', response);
        console.log('🔍 Response.data:', response.data);
        
        const workspaceMembers = response.data?.members || [];
        
        console.log('✅ Extracted workspace members:', workspaceMembers);
        console.log('📊 Members count:', workspaceMembers.length);
        
        setMembers(workspaceMembers);
      } catch (error) {
        console.error('❌ Error fetching workspace members:', error);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const taskData = {
        listId: selectedListId,
        title: title.trim(),
        description: description.trim() || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        priority: priority || 'medium'
      };

      console.log('Submitting task data:', taskData);
      await onSubmit(taskData);
      
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setDueDate('');
      setPriority('medium');
      setSelectedListId(listId);
      
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.response?.data?.error || error.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="glass-panel backdrop-blur-sm bg-white/10 border-white/20 p-3 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for this task..."
            className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300"
            autoFocus
            required
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="group relative flex-1 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center space-x-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Add</span>
                  </>
                )}
              </span>
              {!isSubmitting && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 bg-white/5 backdrop-blur-sm text-white rounded-lg text-sm font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 animate-scale-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300"
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300 resize-none"
            placeholder="Enter task description (optional)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Assignee</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300 cursor-pointer"
              disabled={loadingMembers}
            >
              <option value="" className="bg-slate-800">
                {loadingMembers ? 'Loading members...' : 'Unassigned'}
              </option>
              {members.map(member => {
                const memberId = member.id;
                const memberName = `${member.first_name} ${member.last_name}`.trim();
                
                return (
                  <option key={memberId} value={memberId} className="bg-slate-800">
                    {memberName} {member.role === 'admin' ? '(Admin)' : ''}
                  </option>
                );
              })}
            </select>
            {members.length === 0 && !loadingMembers && (
              <p className="text-xs text-gray-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>No members in this workspace yet</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white flex items-center space-x-2">
              <Flag className="w-4 h-4 text-orange-400" />
              <span>Priority</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300 cursor-pointer"
            >
              <option value="low" className="bg-slate-800">Low</option>
              <option value="medium" className="bg-slate-800">Medium</option>
              <option value="high" className="bg-slate-800">High</option>
              <option value="urgent" className="bg-slate-800">Urgent</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Due Date</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {Array.isArray(lists) && lists.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white flex items-center space-x-2">
              <List className="w-4 h-4 text-green-400" />
              <span>List</span>
            </label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-400/50 transition-all duration-300 cursor-pointer"
            >
              {lists.map(list => (
                <option key={list.id} value={list.id} className="bg-slate-800">
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="group relative flex-1 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Task...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Create Task</span>
                </>
              )}
            </span>
            {!isSubmitting && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/5 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTaskForm;