import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTaskBoard } from '../../hooks/useTaskBoard';
import TaskList from './TaskList';
import CreateListForm from './CreateListForm';
import CreateTaskModal from './CreateTaskModal';
import DebugTaskCreate from './DebugTaskCreate';

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
  const [showCreateTask, setShowCreateTask] = useState(null); // listId for which to create task
  const [editingList, setEditingList] = useState(null);

  const safeLists = Array.isArray(lists) ? lists : [];

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    // If dropped outside any droppable area
    if (!destination) return;

    // If dropped in the same position
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

      // Update local state optimistically
      const listIds = newListOrder.map(list => list.id);
      setLists(newListOrder);

      // Update backend
      try {
        await reorderLists(listIds);
      } catch (error) {
        // Revert on error
        setLists(lists);
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

      // Update local state optimistically
      const updatedLists = lists.map(list =>
        list.id === sourceList.id
          ? { ...list, tasks: newTasks }
          : list
      );
      setLists(updatedLists);

      // Update backend
      try {
        const taskIds = newTasks.map(task => task.id);
        await reorderTasks(sourceList.id, taskIds);
      } catch (error) {
        // Revert on error
        setLists(lists);
        console.error('Error reordering tasks:', error);
      }
    } else {
      // Moving to a different list
      const sourceTasks = Array.from(sourceList.tasks);
      const destinationTasks = Array.from(destinationList.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, movedTask);

      // Update local state optimistically
      const updatedLists = lists.map(list => {
        if (list.id === sourceList.id) {
          return { ...list, tasks: sourceTasks };
        }
        if (list.id === destinationList.id) {
          return { ...list, tasks: destinationTasks };
        }
        return list;
      });
      setLists(updatedLists);

      // Update backend
      try {
        await moveTask(movedTask.id, destinationList.id, destination.index);
        
        // Also update order in both lists
        await reorderTasks(sourceList.id, sourceTasks.map(task => task.id));
        await reorderTasks(destinationList.id, destinationTasks.map(task => task.id));
      } catch (error) {
        // Revert on error
        setLists(lists);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Board</h2>
          <p className="text-gray-600 mt-1">Manage your team's tasks with drag and drop</p>
        </div>
        <button
          onClick={() => setShowCreateList(true)}
          className="btn-primary"
        >
          Add List
        </button>
      </div>

      {/* Debug Component - Temporary */}
      <DebugTaskCreate lists={safeLists} />

      {/* Task Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="task-board" type="list" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex space-x-4 overflow-x-auto pb-4 min-h-96"
            >
              {safeLists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex-shrink-0 w-80"
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
                <div className="flex-shrink-0 w-80">
                  <CreateListForm
                    onSubmit={handleCreateList}
                    onCancel={() => setShowCreateList(false)}
                  />
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          listId={showCreateTask}
          lists={safeLists}
          onClose={() => setShowCreateTask(null)}
          onCreate={createTask}
        />
      )}
    </div>
  );
};

export default TaskBoard;