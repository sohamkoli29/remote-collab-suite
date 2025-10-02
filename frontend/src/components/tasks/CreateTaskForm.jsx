import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { workspaceAPI } from '../../services/api';

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

  // Fetch workspace members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceId) {
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const response = await workspaceAPI.getById(workspaceId);
        
        // DEBUG: Log the entire response to see the structure
        console.log('🔍 Full API Response:', response);
        console.log('🔍 Response.data:', response.data);
        
        // Try multiple possible paths where members might be
        const workspaceMembers = response.data.workspace?.members || 
                                 response.data.members || 
                                 response.data.workspace?.users ||
                                 response.data.users ||
                                 [];
        
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
      
      // Reset form only on success
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
      <div className="bg-white rounded border border-gray-300 p-2">
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for this task..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            required
          />
          {error && (
            <div className="text-red-600 text-xs">{error}</div>
          )}
          <div className="flex space-x-1">
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="btn-primary text-sm px-2 py-1 flex-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-sm px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Enter task title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Enter task description (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="input-field"
              disabled={loadingMembers}
            >
              <option value="">
                {loadingMembers ? 'Loading members...' : 'Unassigned'}
              </option>
              {members.map(member => {
                // Handle different possible member data structures
                const memberId = member.id || member.user_id;
                const memberName = member.name || 
                                  `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                                  member.email ||
                                  'Unknown User';
                
                return (
                  <option key={memberId} value={memberId}>
                    {memberName}
                  </option>
                );
              })}
            </select>
            {members.length === 0 && !loadingMembers && (
              <p className="text-xs text-gray-500 mt-1">
                No members in this workspace yet
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-field"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {Array.isArray(lists) && lists.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              List
            </label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="input-field"
            >
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Task...' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTaskForm;