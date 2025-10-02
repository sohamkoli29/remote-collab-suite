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
    if (!workspaceId || !currentUser?.id) {
      setError('Workspace ID and user ID are required');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initializeTaskBoard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial task board data
        await loadTaskBoard();

        // Join task board room (with error handling)
        try {
          await socketService.joinTaskBoard(workspaceId, currentUser.id);
          console.log('Successfully joined task board room');
        } catch (socketError) {
          console.warn('Failed to join task board room, but continuing:', socketError);
        }

      } catch (error) {
        console.error('Error initializing task board:', error);
        if (isMounted) {
          setError(error.message || 'Failed to load task board');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeTaskBoard();

    // Socket event handlers
    const handleTaskCreated = (task) => {
      console.log('📨 Socket: task-created received:', task);
      if (isMounted) {
        setLists(prevLists => {
          const updatedLists = prevLists.map(list => 
            list.id === task.list_id 
              ? { ...list, tasks: [...(list.tasks || []), task] }
              : list
          );
          console.log('🔄 Updated lists after task creation:', updatedLists);
          return updatedLists;
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (isMounted) {
        setLists(prevLists =>
          prevLists.map(list => ({
            ...list,
            tasks: (list.tasks || []).map(task =>
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
            tasks: (list.tasks || []).filter(task => task.id !== taskId)
          }))
        );
      }
    };

    const handleTaskMoved = ({ task, sourceListId, destinationListId }) => {
      if (isMounted) {
        setLists(prevLists => {
          const updatedLists = prevLists.map(list =>
            list.id === sourceListId
              ? { ...list, tasks: (list.tasks || []).filter(t => t.id !== task.id) }
              : list
          );

          return updatedLists.map(list =>
            list.id === destinationListId
              ? { ...list, tasks: [...(list.tasks || []), task] }
              : list
          );
        });
      }
    };

    const handleListCreated = (newList) => {
      console.log('📨 Socket: list-created received:', newList);
      if (isMounted) {
        setLists(prevLists => {
          const updatedLists = [...prevLists, { ...newList, tasks: [] }];
          console.log('🔄 Updated lists after list creation:', updatedLists);
          return updatedLists;
        });
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

    const handleSocketConnected = () => {
      console.log('🔌 Socket connected/reconnected, rejoining task board');
      if (isMounted) {
        socketService.joinTaskBoard(workspaceId, currentUser.id).catch(console.error);
      }
    };

    // Register all socket event listeners
    // These will work regardless of current connection state
    socketService.on('task-created', handleTaskCreated);
    socketService.on('task-updated', handleTaskUpdated);
    socketService.on('task-deleted', handleTaskDeleted);
    socketService.on('task-moved', handleTaskMoved);
    socketService.on('list-created', handleListCreated);
    socketService.on('list-updated', handleListUpdated);
    socketService.on('list-deleted', handleListDeleted);
    socketService.on('socket-connected', handleSocketConnected);

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
      socketService.off('socket-connected', handleSocketConnected);
      
      try {
        socketService.leaveTaskBoard(workspaceId, currentUser.id);
      } catch (error) {
        console.warn('Error leaving task board:', error);
      }
    };
  }, [workspaceId, currentUser]);

  const loadTaskBoard = async () => {
    try {
      const response = await taskAPI.getTaskBoard(workspaceId);
      setLists(response.data.lists || []);
    } catch (error) {
      console.error('Error loading task board:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load task board';
      throw new Error(errorMessage);
    }
  };

  const createList = async (name) => {
    try {
      const response = await taskAPI.createList({ workspaceId, name });
      const newList = response.data.list;
      
      // Optimistically update local state immediately
      setLists(prevLists => [...prevLists, { ...newList, tasks: [] }]);
      
      // Also emit for other clients
      if (socketService.isConnected) {
        socketService.emitListCreated(workspaceId, newList);
      }
      
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
      
      // Optimistically update local state immediately
      setLists(prevLists =>
        prevLists.map(list =>
          list.id === updatedList.id ? { ...list, ...updatedList } : list
        )
      );
      
      // Also emit for other clients
      if (socketService.isConnected) {
        socketService.emitListUpdated(workspaceId, updatedList);
      }
      
      return updatedList;
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  };

  const deleteList = async (listId) => {
    try {
      await taskAPI.deleteList(listId);
      
      // Optimistically update local state immediately
      setLists(prevLists => prevLists.filter(list => list.id !== listId));
      
      // Also emit for other clients
      if (socketService.isConnected) {
        socketService.emitListDeleted(workspaceId, listId);
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  };

  const createTask = async (listId, taskData) => {
    try {
      console.log('🔄 createTask called with:', { listId, taskData });
      
      // Handle parameter variations
      let requestData;
      if (typeof listId === 'object' && !taskData) {
        // Called with single object parameter
        requestData = {
          listId: listId.listId,
          title: listId.title,
          description: listId.description,
          assigneeId: listId.assigneeId,
          dueDate: listId.dueDate,
          priority: listId.priority || 'medium'
        };
      } else {
        // Called with separate parameters
        requestData = {
          listId,
          title: taskData.title,
          description: taskData.description,
          assigneeId: taskData.assigneeId,
          dueDate: taskData.dueDate,
          priority: taskData.priority || 'medium'
        };
      }
      
      // Validate required fields
      if (!requestData.listId) {
        throw new Error('List ID is required');
      }
      if (!requestData.title) {
        throw new Error('Title is required');
      }
      
      console.log('📤 Sending to API:', requestData);
      
      const response = await taskAPI.createTask(requestData);
      const newTask = response.data.task;
      
      console.log('✅ Task created successfully:', newTask);
      
      // Optimistically update local state immediately
      setLists(prevLists => {
        const updatedLists = prevLists.map(list => 
          list.id === newTask.list_id 
            ? { ...list, tasks: [...(list.tasks || []), newTask] }
            : list
        );
        console.log('🔄 Updated lists after task creation:', updatedLists);
        return updatedLists;
      });
      
      // Also emit for other clients
      if (socketService.isConnected) {
        socketService.emitTaskCreated(workspaceId, newTask);
      }
      
      return newTask;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      
      if (error.response) {
        const serverError = error.response.data;
        const errorMessage = serverError.error || `Server error: ${error.response.status}`;
        const errorDetails = serverError.details ? ` - ${serverError.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw error;
      }
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await taskAPI.updateTask(taskId, updates);
      const updatedTask = response.data.task;
      
      // Optimistically update local state immediately
      setLists(prevLists =>
        prevLists.map(list => ({
          ...list,
          tasks: (list.tasks || []).map(task =>
            task.id === updatedTask.id ? updatedTask : task
          )
        }))
      );
      
      // Also emit for other clients
      if (socketService.isConnected) {
        socketService.emitTaskUpdated(workspaceId, updatedTask);
      }
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);
      
      // Optimistically update local state immediately
      setLists(prevLists =>
        prevLists.map(list => ({
          ...list,
          tasks: (list.tasks || []).filter(task => task.id !== taskId)
        }))
      );
      
      // Also emit for other clients
      if (socketService.isConnected) {
        socketService.emitTaskDeleted(workspaceId, taskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const moveTask = async (taskId, newListId, newPosition) => {
    try {
      const response = await taskAPI.moveTask(taskId, newListId, newPosition);
      return response.data.task;
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