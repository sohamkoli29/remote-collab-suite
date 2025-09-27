import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

export const useTaskBoard = (workspaceId) => {
  const { user: currentUser } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId || !currentUser?.id) return;

    let isMounted = true;

    const initializeTaskBoard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial task board data
        await loadTaskBoard();

        // Join task board room
        await socketService.joinTaskBoard(workspaceId, currentUser.id);

      } catch (error) {
        console.error('Error initializing task board:', error);
        if (isMounted) {
          setError('Failed to load task board');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeTaskBoard();

    // Socket event listeners for real-time updates
    const handleTaskCreated = (task) => {
      if (isMounted) {
        setLists(prevLists => 
          prevLists.map(list => 
            list.id === task.list_id 
              ? { ...list, tasks: [...list.tasks, task] }
              : list
          )
        );
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (isMounted) {
        setLists(prevLists =>
          prevLists.map(list => ({
            ...list,
            tasks: list.tasks.map(task =>
              task.id === updatedTask.id ? updatedTask : task
            )
          }))
        );
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      if (isMounted) {
        setLists(prevLists =>
          prevLists.map(list => ({
            ...list,
            tasks: list.tasks.filter(task => task.id !== taskId)
          }))
        );
      }
    };

    const handleTaskMoved = ({ task, sourceListId, destinationListId }) => {
      if (isMounted) {
        setLists(prevLists => {
          // Remove task from source list
          const updatedLists = prevLists.map(list =>
            list.id === sourceListId
              ? { ...list, tasks: list.tasks.filter(t => t.id !== task.id) }
              : list
          );

          // Add task to destination list
          return updatedLists.map(list =>
            list.id === destinationListId
              ? { ...list, tasks: [...list.tasks, task] }
              : list
          );
        });
      }
    };

    const handleListCreated = (newList) => {
      if (isMounted) {
        setLists(prevLists => [...prevLists, { ...newList, tasks: [] }]);
      }
    };

    const handleListUpdated = (updatedList) => {
      if (isMounted) {
        setLists(prevLists =>
          prevLists.map(list =>
            list.id === updatedList.id ? { ...list, ...updatedList } : list
          )
        );
      }
    };

    const handleListDeleted = ({ listId }) => {
      if (isMounted) {
        setLists(prevLists => prevLists.filter(list => list.id !== listId));
      }
    };

    // Subscribe to socket events
    socketService.on('task-created', handleTaskCreated);
    socketService.on('task-updated', handleTaskUpdated);
    socketService.on('task-deleted', handleTaskDeleted);
    socketService.on('task-moved', handleTaskMoved);
    socketService.on('list-created', handleListCreated);
    socketService.on('list-updated', handleListUpdated);
    socketService.on('list-deleted', handleListDeleted);

    // Cleanup
    return () => {
      isMounted = false;
      socketService.off('task-created', handleTaskCreated);
      socketService.off('task-updated', handleTaskUpdated);
      socketService.off('task-deleted', handleTaskDeleted);
      socketService.off('task-moved', handleTaskMoved);
      socketService.off('list-created', handleListCreated);
      socketService.off('list-updated', handleListUpdated);
      socketService.off('list-deleted', handleListDeleted);
      socketService.leaveTaskBoard(workspaceId, currentUser.id);
    };
  }, [workspaceId, currentUser]);

  const loadTaskBoard = async () => {
    try {
      const response = await taskAPI.getTaskBoard(workspaceId);
      setLists(response.data.lists || []);
    } catch (error) {
      console.error('Error loading task board:', error);
      throw error;
    }
  };

  const createList = async (name) => {
    try {
      const response = await taskAPI.createList({ workspaceId, name });
      const newList = response.data.list;
      
      // Emit socket event for real-time update
      socketService.emitListCreated(workspaceId, newList);
      
      return newList;
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  };

  const updateList = async (listId, updates) => {
    try {
      const response = await taskAPI.updateList(listId, updates);
      const updatedList = response.data.list;
      
      // Emit socket event for real-time update
      socketService.emitListUpdated(workspaceId, updatedList);
      
      return updatedList;
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  };

  const deleteList = async (listId) => {
    try {
      await taskAPI.deleteList(listId);
      
      // Emit socket event for real-time update
      socketService.emitListDeleted(workspaceId, listId);
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  };

  const createTask = async (listId, taskData) => {
    try {
      const response = await taskAPI.createTask({ listId, ...taskData });
      const newTask = response.data.task;
      
      // Emit socket event for real-time update
      socketService.emitTaskCreated(workspaceId, newTask);
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await taskAPI.updateTask(taskId, updates);
      const updatedTask = response.data.task;
      
      // Emit socket event for real-time update
      socketService.emitTaskUpdated(workspaceId, updatedTask);
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);
      
      // Emit socket event for real-time update
      socketService.emitTaskDeleted(workspaceId, taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const moveTask = async (taskId, newListId, newPosition) => {
    try {
      const response = await taskAPI.moveTask(taskId, newListId, newPosition);
      const movedTask = response.data.task;
      
      // Emit socket event for real-time update
      // Note: We need to track source list ID - this will be handled in the drag-and-drop component
      
      return movedTask;
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  };

  const reorderLists = async (listOrders) => {
    try {
      await taskAPI.reorderLists(workspaceId, listOrders);
    } catch (error) {
      console.error('Error reordering lists:', error);
      throw error;
    }
  };

  const reorderTasks = async (listId, taskOrders) => {
    try {
      await taskAPI.reorderTasks(listId, taskOrders);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      throw error;
    }
  };

  return {
    lists,
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
    reorderTasks,
    refresh: loadTaskBoard
  };
};