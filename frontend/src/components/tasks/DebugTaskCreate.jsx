
import { taskAPI } from '../../services/api';

const DebugTaskCreate = ({ lists }) => {
  const testTaskCreation = async () => {
    if (!lists || lists.length === 0) {
      console.log('No lists available');
      return;
    }

    const firstListId = lists[0].id;
    
    const testData = {
      listId: firstListId,
      title: 'Test Task ' + new Date().toLocaleTimeString(),
      description: null,
      assigneeId: null,
      dueDate: null,
      priority: 'medium'
    };

    console.log('🧪 Testing task creation with:', testData);

    try {
      const response = await taskAPI.createTask(testData);
      console.log('✅ Test successful:', response.data);
      alert('Test task created successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error);
      console.log('Error response:', error.response?.data);
      alert('Test failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg mt-4">
      <h3 className="font-medium text-blue-800">Debug Task Creation</h3>
      <p className="text-sm text-blue-600 mb-2">
        Lists available: {lists?.length || 0}
      </p>
      <button 
        onClick={testTaskCreation}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        Test Create Simple Task
      </button>
    </div>
  );
};

export default DebugTaskCreate;