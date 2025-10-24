import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTaskBoard } from '../../hooks/useTaskBoard';
import TaskList from './TaskList';
import CreateListForm from './CreateListForm';
import CreateTaskModal from './CreateTaskModal';

import { Plus, Loader2, AlertTriangle, Sparkles, LayoutGrid } from 'lucide-react';

const TaskBoard = ({ workspaceId }) => {
  const { 
    lists = [], 
    loading, 
    error, 
    createList, 
    updateList, 
    deleteList, 
    createTask, 
    updateTask, 
    deleteTask, 
    moveTask,
    reorderLists,
    reorderTasks 
  } = useTaskBoard(workspaceId);
  
  const [showCreateList, setShowCreateList] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(null);
  const [editingList, setEditingList] = useState(null);

  const safeLists = Array.isArray(lists) ? lists : [];

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Reordering lists
    if (type === 'list') {
      const newListOrder = Array.from(lists);
      const [movedList] = newListOrder.splice(source.index, 1);
      newListOrder.splice(destination.index, 0, movedList);

      const listIds = newListOrder.map(list => list.id);

      try {
        await reorderLists(listIds);
      } catch (error) {
        console.error('Error reordering lists:', error);
      }
      return;
    }

    // Moving tasks
    const sourceList = lists.find(list => list.id === source.droppableId);
    const destinationList = lists.find(list => list.id === destination.droppableId);

    if (!sourceList || !destinationList) return;

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceList.tasks);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);

      try {
        const taskIds = newTasks.map(task => task.id);
        await reorderTasks(sourceList.id, taskIds);
      } catch (error) {
        console.error('Error reordering tasks:', error);
      }
    } else {
      // Moving to a different list
      const sourceTasks = Array.from(sourceList.tasks);
      const destinationTasks = Array.from(destinationList.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, movedTask);

      try {
        await moveTask(movedTask.id, destinationList.id, destination.index);
        await reorderTasks(sourceList.id, sourceTasks.map(task => task.id));
        await reorderTasks(destinationList.id, destinationTasks.map(task => task.id));
      } catch (error) {
        console.error('Error moving task:', error);
      }
    }
  };

  const handleCreateList = async (name) => {
    try {
      await createList(name);
      setShowCreateList(false);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleUpdateList = async (listId, name) => {
    try {
      await updateList(listId, { name });
      setEditingList(null);
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list? All tasks in it will also be deleted.')) {
      return;
    }

    try {
      await deleteList(listId);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 min-h-96 flex items-center justify-center">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-neon animate-pulse-glow">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Loading Task Board</p>
            <p className="text-gray-400 text-sm mt-1">Fetching your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 min-h-96 flex items-center justify-center">
        <div className="text-center space-y-4 animate-scale-in max-w-md">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-neon">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg mb-2">Failed to Load Tasks</p>
            <p className="text-red-300 text-sm mb-4">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span className="relative z-10">Retry</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-slide-in-down">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-neon">
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Task Board</h2>
              <p className="text-gray-300 text-sm mt-0.5">Manage your team's tasks with drag and drop</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateList(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add List</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        </div>
      </div>


      {/* Task Board */}
      {safeLists.length === 0 && !showCreateList ? (
        <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 min-h-96 flex items-center justify-center animate-scale-in">
          <div className="text-center max-w-md px-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-neon animate-float">
              <LayoutGrid className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-3">
              No Lists Yet
            </h3>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Create your first list to start organizing your tasks. Lists help you categorize and track work efficiently.
            </p>
            <button
              onClick={() => setShowCreateList(true)}
              className="group relative inline-flex items-center space-x-2 overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Your First List</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="task-board" type="list" direction="horizontal">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex gap-4 overflow-x-auto pb-4 min-h-96 px-1 transition-all duration-300 ${
                  snapshot.isDraggingOver ? 'bg-white/5 rounded-2xl' : ''
                }`}
              >
                {safeLists.map((list, index) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex-shrink-0 w-full sm:w-80 transition-all duration-300 ${
                          snapshot.isDragging ? 'opacity-80 scale-105 rotate-2' : ''
                        }`}
                      >
                        <TaskList
                          list={list}
                          onUpdate={handleUpdateList}
                          onDelete={handleDeleteList}
                          onAddTask={() => setShowCreateTask(list.id)}
                          isEditing={editingList === list.id}
                          onEditStart={() => setEditingList(list.id)}
                          onEditCancel={() => setEditingList(null)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Create List Form */}
                {showCreateList && (
                  <div className="flex-shrink-0 w-full sm:w-80 animate-slide-in-right">
                    <CreateListForm
                      onSubmit={handleCreateList}
                      onCancel={() => setShowCreateList(false)}
                    />
                  </div>
                )}

                {/* Add List Button (when lists exist) */}
                {!showCreateList && safeLists.length > 0 && (
                  <div className="flex-shrink-0 w-full sm:w-80">
                    <button
                      onClick={() => setShowCreateList(true)}
                      className="w-full h-full min-h-32 glass-panel backdrop-blur-2xl bg-white/5 border-2 border-dashed border-white/20 hover:border-green-400/50 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center group"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <p className="text-white font-semibold text-sm sm:text-base">Add Another List</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">Organize more tasks</p>
                    </button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Quick Tips */}
      {safeLists.length > 0 && (
        <div className="glass-panel backdrop-blur-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-white/20 animate-fade-in">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base sm:text-lg mb-2 flex items-center space-x-2">
                <span>💡 Pro Tips</span>
              </h4>
              <ul className="text-xs sm:text-sm text-gray-300 leading-relaxed space-y-1">
                <li>• Drag lists to reorder them horizontally</li>
                <li>• Drag tasks between lists to change their status</li>
                <li>• Click on a task to view or edit its details</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          listId={showCreateTask}
          lists={safeLists}
          workspaceId={workspaceId} 
          onClose={() => setShowCreateTask(null)}
          onCreate={createTask}
        />
      )}
    </div>
  );
};

export default TaskBoard;