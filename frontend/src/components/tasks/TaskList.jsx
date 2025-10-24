import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import CreateTaskForm from './CreateTaskForm';
import { GripVertical, Edit2, Trash2, Plus, ClipboardList } from 'lucide-react';

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

  const tasks = Array.isArray(list?.tasks) ? list.tasks : [];

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

  if (!list) {
    return (
      <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 h-fit p-6">
        <div className="text-center text-gray-400 py-8">
          <p>List not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 h-fit max-h-full overflow-hidden flex flex-col hover:bg-white/15 transition-all duration-300">
      {/* List Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
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
              className="w-full px-3 py-2 text-sm font-semibold bg-white/10 border-2 border-purple-500/50 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300"
              autoFocus
              onBlur={handleCancel}
            />
          </form>
        ) : (
          <>
            <div 
              {...dragHandleProps}
              className="flex-1 flex items-center space-x-2 cursor-grab active:cursor-grabbing group"
            >
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
              <h3 className="font-semibold text-white text-sm sm:text-base truncate">{list.name}</h3>
              <span className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 text-xs px-2 py-1 rounded-full border border-purple-500/30 flex-shrink-0">
                {tasks.length}
              </span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={onEditStart}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Edit list name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(list.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Delete list"
              >
                <Trash2 className="w-4 h-4" />
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
            className={`flex-1 overflow-y-auto space-y-2 min-h-20 py-2 transition-all duration-300 rounded-lg ${
              snapshot.isDraggingOver ? 'bg-purple-500/10 ring-2 ring-purple-500/30' : ''
            }`}
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transform transition-all duration-300 ${
                      snapshot.isDragging ? 'rotate-2 scale-105 opacity-80' : ''
                    }`}
                  >
                    <TaskCard task={task} listId={list.id} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Empty state */}
            {tasks.length === 0 && !showCreateTask && (
              <div className="text-center py-8 text-gray-400">
                <div className="w-12 h-12 mx-auto bg-white/5 rounded-xl flex items-center justify-center mb-3">
                  <ClipboardList className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm">No tasks yet</p>
                <p className="text-xs text-gray-500 mt-1">Add your first task below</p>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add Task Button */}
      {!showCreateTask ? (
        <button
          onClick={handleAddTask}
          className="mt-3 w-full flex items-center justify-center space-x-2 text-gray-300 hover:text-white text-sm py-2.5 px-3 rounded-lg hover:bg-white/10 transition-all duration-200 border-2 border-dashed border-white/20 hover:border-purple-400/50 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">Add a task</span>
        </button>
      ) : (
        <div className="mt-3 animate-scale-in">
          <CreateTaskForm
            listId={list.id}
            onSubmit={handleCreateTask}
            onCancel={handleCancelCreateTask}
            compact={true}
          />
        </div>
      )}
    </div>
  );
};

export default TaskList;