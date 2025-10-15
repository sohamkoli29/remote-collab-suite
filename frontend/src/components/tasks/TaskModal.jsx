import  { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TaskModal = ({ task, listId, onClose, onUpdate, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    assigneeId: task.assignee_id || '',
    dueDate: task.due_date ? task.due_date.split('T')[0] : '',
    priority: task.priority || 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(task.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate || null,
        priority: formData.priority
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setIsSubmitting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!formData.title.trim() || isSubmitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      title: task.title,
                      description: task.description || '',
                      assigneeId: task.assignee_id || '',
                      dueDate: task.due_date ? task.due_date.split('T')[0] : '',
                      priority: task.priority || 'medium'
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Task Header */}
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h4>
                {task.description && (
                  <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                )}
              </div>

              {/* Task Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <div className="mt-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs inline-block">
                    In List
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs inline-block ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Due Date:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs inline-block ${
                    isOverdue(task.due_date) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formatDate(task.due_date)}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Assignee:</span>
                  <div className="mt-1 flex items-center space-x-2">
                    {task.assignee ? (
                      <>
                        {task.assignee.avatar_url ? (
                          <img
                            src={task.assignee.avatar_url}
                            alt={task.assignee.first_name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {getInitials(task.assignee.first_name, task.assignee.last_name)}
                            </span>
                          </div>
                        )}
                        <span>{task.assignee.first_name} {task.assignee.last_name}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Activity */}
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Activity</h5>
                <div className="text-sm text-gray-500">
                  Created by {task.creator?.first_name} {task.creator?.last_name} on{' '}
                  {new Date(task.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  Edit Task
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Task'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;