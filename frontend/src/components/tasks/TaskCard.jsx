import { useState } from 'react';
import { useTaskBoard } from '../../hooks/useTaskBoard';
import { useAuth } from '../../contexts/AuthContext';
import TaskModal from './TaskModal';
import { X, Calendar, AlertCircle, Loader2, User } from 'lucide-react';

const TaskCard = ({ task, listId }) => {
  const { updateTask, deleteTask } = useTaskBoard();
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': 
        return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30';
      case 'high': 
        return 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-500/30';
      case 'medium': 
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'low': 
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30';
      default: 
        return 'bg-white/10 text-gray-300 border-white/20';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': 
      case 'high': 
        return <AlertCircle className="w-3 h-3" />;
      default: 
        return null;
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await updateTask(task.id, { priority: newPriority });
    } catch (error) {
      console.error('Error updating task priority:', error);
    }
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="glass-panel backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 cursor-pointer transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
      >
        {/* Task Header */}
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-white text-sm line-clamp-2 flex-1 group-hover:text-cyan-300 transition-colors">
            {task.title}
          </h4>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ml-2 flex-shrink-0"
            title="Delete task"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-gray-300 text-xs mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Task Meta */}
        <div className="flex items-center flex-wrap gap-2 mt-3">
          {/* Priority */}
          <select
            value={task.priority || 'medium'}
            onChange={(e) => handlePriorityChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className={`text-xs px-2 py-1 rounded-lg border font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${getPriorityColor(task.priority)}`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Due Date */}
          {task.due_date && (
            <span
              className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-lg font-medium ${
                isOverdue(task.due_date)
                  ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30'
                  : 'bg-white/10 text-gray-300 border border-white/20'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.due_date)}</span>
            </span>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          {task.assignee ? (
            <div className="flex items-center space-x-2">
              {task.assignee.avatar_url ? (
                <img
                  src={task.assignee.avatar_url}
                  alt={task.assignee.first_name}
                  className="w-6 h-6 rounded-lg object-cover ring-2 ring-purple-500/30"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">
                    {getInitials(task.assignee.first_name, task.assignee.last_name)}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-300 font-medium">
                {task.assignee.first_name}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-400">
              <User className="w-4 h-4" />
              <span className="text-xs">Unassigned</span>
            </div>
          )}

          {/* Creator */}
          {task.creator && task.creator.id !== task.assignee?.id && (
            <div className="text-xs text-gray-500">
              by {task.creator.first_name}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={task}
          listId={listId}
          onClose={() => setShowModal(false)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          usePortal={true}
        />
      )}
    </>
  );
};

export default TaskCard;