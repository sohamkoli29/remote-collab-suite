import React, { useState } from 'react';
import { useTaskBoard } from '../../hooks/useTaskBoard';
import { useAuth } from '../../contexts/AuthContext';
import TaskModal from './TaskModal';

const TaskCard = ({ task, listId }) => {
  const { updateTask, deleteTask } = useTaskBoard();
  const { user: currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
        className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow group"
      >
        {/* Task Header */}
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">
            {task.title}
          </h4>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity ml-2"
            title="Delete task"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-gray-600 text-xs mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Meta */}
        <div className="flex items-center justify-between mt-3">
          {/* Priority */}
          <div className="flex items-center space-x-2">
            <select
              value={task.priority || 'medium'}
              onChange={(e) => handlePriorityChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Due Date */}
          {task.due_date && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                isOverdue(task.due_date)
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center justify-between mt-2">
          {task.assignee ? (
            <div className="flex items-center space-x-1">
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
              <span className="text-xs text-gray-600">
                {task.assignee.first_name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}

          {/* Creator */}
          {task.creator && task.creator.id !== task.assignee?.id && (
            <div className="text-xs text-gray-400">
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
        />
      )}
    </>
  );
};

export default TaskCard;