import { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, Edit2, Trash2, Save, Calendar, Flag, User, Clock, 
  Loader2, CheckCircle2 
} from 'lucide-react';

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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30';
      case 'high': return 'from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 text-gray-300 border-gray-500/30';
    }
  };

  // ✅ MODAL CONTENT (kept same, fixed padding/alignment)
  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl 
                   border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 
                        bg-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl 
                            bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white leading-tight">Task Details</h3>
              <p className="text-sm text-gray-400 leading-tight">View and edit task info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 
                       transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white 
                             placeholder-gray-400 focus:border-blue-400 focus:ring-4 
                             focus:ring-blue-500/30 transition-all"
                  placeholder="Enter task title"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 
                             text-white placeholder-gray-400 focus:border-blue-400 focus:ring-4 
                             focus:ring-blue-500/30 transition-all"
                  placeholder="Add more details..."
                />
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Flag className="h-4 w-4 text-orange-400" /> Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 
                               px-4 py-3 text-white focus:border-blue-400 focus:ring-4 
                               focus:ring-blue-500/30 transition-all"
                  >
                    <option value="low" className="bg-slate-800">Low</option>
                    <option value="medium" className="bg-slate-800">Medium</option>
                    <option value="high" className="bg-slate-800">High</option>
                    <option value="urgent" className="bg-slate-800">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Calendar className="h-4 w-4 text-purple-400" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white 
                               focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Title & Description */}
              <div className="space-y-3">
                <h4 className="text-2xl font-bold text-white leading-tight">{task.title}</h4>
                {task.description && (
                  <p className="text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Priority */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Flag className="h-4 w-4" /> Priority
                  </div>
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg border 
                                  bg-gradient-to-r ${getPriorityColor(task.priority)} 
                                  text-sm font-medium`}>
                    {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                  </div>
                </div>

                {/* Due Date */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" /> Due Date
                  </div>
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    isOverdue(task.due_date)
                      ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/10 text-gray-300 border border-white/20'
                  }`}>
                    {formatDate(task.due_date)}
                  </div>
                </div>

                {/* Assignee */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="h-4 w-4" /> Assignee
                  </div>
                  {task.assignee ? (
                    <div className="flex items-center gap-3">
                      {task.assignee.avatar_url ? (
                        <img
                          src={task.assignee.avatar_url}
                          alt={task.assignee.first_name}
                          className="h-8 w-8 rounded-lg object-cover ring-2 ring-purple-500/30"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 
                                        flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {getInitials(task.assignee.first_name, task.assignee.last_name)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-white truncate">
                        {task.assignee.first_name} {task.assignee.last_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </div>

                {/* Created */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" /> Created
                  </div>
                  <div className="text-sm text-white font-medium">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  {task.creator && (
                    <div className="text-xs text-gray-400 truncate">
                      by {task.creator.first_name} {task.creator.last_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 border-t border-white/10 
                        bg-white/10 px-6 py-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || isSubmitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 
                           text-white font-semibold shadow-lg transition-all hover:scale-[1.02] 
                           active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-5 w-5" /> Save Changes
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-white 
                           font-semibold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 
                           text-white font-semibold shadow-lg transition-all hover:scale-[1.02] 
                           active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Edit2 className="h-5 w-5" /> Edit Task
                </span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3.5 
                           text-white font-semibold shadow-lg transition-all hover:scale-[1.02] 
                           active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="h-5 w-5" /> Delete
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ✅ FIX: Render Modal via Portal to avoid clipping/misalignment
  return ReactDOM.createPortal(modalContent, document.body);
};

export default TaskModal;
