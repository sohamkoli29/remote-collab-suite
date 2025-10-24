import CreateTaskForm from './CreateTaskForm';
import { X, Plus } from 'lucide-react';

const CreateTaskModal = ({ listId, lists, workspaceId, onClose, onCreate }) => {
    
  console.log('🎯 CreateTaskModal received workspaceId:', workspaceId);

  const handleCreate = async (taskData) => {
    console.log('🎯 CreateTaskModal: Creating task with:', { listId, taskData });
    
    if (!listId) {
      console.error('❌ No listId provided to CreateTaskModal');
      return;
    }
    
    try {
      await onCreate(listId, taskData);
      onClose();
    } catch (error) {
      console.error('❌ Error in CreateTaskModal:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-neon">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white">Create New Task</h3>
              <p className="text-sm text-gray-400">Add a task to your list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          <CreateTaskForm
            listId={listId}
            lists={lists}
            workspaceId={workspaceId}
            onSubmit={handleCreate}
            onCancel={onClose}
          />
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};

export default CreateTaskModal;