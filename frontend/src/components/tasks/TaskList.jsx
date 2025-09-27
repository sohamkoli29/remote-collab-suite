import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import CreateTaskForm from './CreateTaskForm';

const TaskList = ({ 
  list, 
  onUpdate, 
  onDelete, 
  onAddTask, 
  isEditing, 
  onEditStart, 
  onEditCancel,
  dragHandleProps 
}) => {
  const [showCreateTask, setShowCreateTask] = React.useState(false);

  const handleSubmit = (name) => {
    onUpdate(list.id, name);
  };

  const handleCancel = () => {
    onEditCancel();
  };

  const handleAddTask = () => {
    setShowCreateTask(true);
  };

  const handleCreateTask = () => {
    setShowCreateTask(false);
    onAddTask();
  };

  const handleCancelCreateTask = () => {
    setShowCreateTask(false);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-fit max-h-full overflow-hidden flex flex-col">
      {/* List Header */}
      <div className="flex items-center justify-between mb-3">
        {isEditing ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleSubmit(formData.get('name'));
            }}
            className="flex-1"
          >
            <input
              type="text"
              name="name"
              defaultValue={list.name}
              className="w-full px-2 py-1 text-sm font-medium bg-white border rounded"
              autoFocus
              onBlur={handleCancel}
            />
          </form>
        ) : (
          <>
            <div 
              {...dragHandleProps}
              className="flex-1 flex items-center space-x-2 cursor-grab active:cursor-grabbing"
            >
              <h3 className="font-medium text-gray-900 text-sm">{list.name}</h3>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {list.tasks.length}
              </span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={onEditStart}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Edit list name"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(list.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete list"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tasks */}
      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 overflow-y-auto space-y-2 min-h-20 ${
              snapshot.isDraggingOver ? 'bg-blue-50 rounded' : ''
            }`}
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            {list.tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transform transition-transform ${
                      snapshot.isDragging ? 'rotate-5 shadow-lg' : ''
                    }`}
                  >
                    <TaskCard task={task} listId={list.id} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {list.tasks.length === 0 && !showCreateTask && (
              <div className="text-center py-8 text-gray-400">
                <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No tasks yet</p>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add Task Button */}
      {!showCreateTask ? (
        <button
          onClick={handleAddTask}
          className="mt-3 w-full flex items-center space-x-2 text-gray-500 hover:text-gray-700 text-sm py-2 px-3 rounded hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add a task</span>
        </button>
      ) : (
        <CreateTaskForm
          listId={list.id}
          onSubmit={handleCreateTask}
          onCancel={handleCancelCreateTask}
          compact={true}
        />
      )}
    </div>
  );
};

export default TaskList;