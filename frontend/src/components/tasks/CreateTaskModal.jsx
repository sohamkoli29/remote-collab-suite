
import CreateTaskForm from './CreateTaskForm';

const CreateTaskModal = ({ listId, lists , onClose, onCreate }) => {
    const handleCreate = async (taskData) => {
    console.log('🎯 CreateTaskModal: Creating task with:', { listId, taskData });
    
    // Make sure listId is passed correctly
    if (!listId) {
      console.error('❌ No listId provided to CreateTaskModal');
      return;
    }
    
    try {
      await onCreate(listId, taskData);
      onClose();
    } catch (error) {
      console.error('❌ Error in CreateTaskModal:', error);
      // Error is handled by CreateTaskForm
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
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
          <CreateTaskForm
            listId={listId}
            lists={lists}
            onSubmit={handleCreate}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;