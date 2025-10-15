import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:3001/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      config.headers['User-ID'] = user.id;
    }
  }
  return config;
});

// Make sure these exports exist
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  getById: (workspaceId) => api.get(`/workspaces/${workspaceId}`),
  create: (workspaceData) => api.post('/workspaces', workspaceData),
  inviteUser: (workspaceId, email, role) => 
    api.post(`/workspaces/${workspaceId}/invite`, { email, role }),
  removeMember: (workspaceId, userId) => 
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  updateMemberRole: (workspaceId, userId, role) => 
    api.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role }),
 
  getMembers: (workspaceId) => 
    api.get(`/workspaces/${workspaceId}/members`),
};

export const userAPI = {
  search: (email) => api.get(`/users/search?email=${email}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteAvatar: () => api.delete('/users/avatar'),
};

export const chatAPI = {
  getMessages: (workspaceId, limit = 50, offset = 0) => 
    api.get(`/chat/workspace/${workspaceId}/messages?limit=${limit}&offset=${offset}`),
  getUnreadCount: (workspaceId) => 
    api.get(`/chat/workspace/${workspaceId}/unread-count`),
  markMessagesRead: (messageIds, workspaceId) =>
    api.post('/chat/messages/mark-read', { messageIds, workspaceId }),
};

export const taskAPI = {
  getTaskBoard: (workspaceId) => api.get(`/tasks/workspace/${workspaceId}`),
  
  // Lists
  createList: (listData) => api.post('/tasks/lists', listData),
  updateList: (listId, updates) => api.put(`/tasks/lists/${listId}`, updates),
  deleteList: (listId) => api.delete(`/tasks/lists/${listId}`),
  reorderLists: (workspaceId, listOrders) => api.post('/tasks/lists/reorder', { workspaceId, listOrders }),
  
  // Tasks
  createTask: (taskData) => {
    console.log('🚀 taskAPI.createTask called with:', taskData);
    return api.post('/tasks/tasks', taskData)
      .then(response => {
        console.log('✅ taskAPI.createTask success:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ taskAPI.createTask error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });
  },
  updateTask: (taskId, updates) => api.put(`/tasks/tasks/${taskId}`, updates),
  deleteTask: (taskId) => api.delete(`/tasks/tasks/${taskId}` ),
  moveTask: (taskId, newListId, newPosition) => api.post(`/tasks/tasks/${taskId}/move`, { newListId, newPosition }),
  reorderTasks: (listId, taskOrders) => api.post('/tasks/tasks/reorder', { listId, taskOrders }),
};


// Add document API endpoints
export const documentAPI = {
  getDocuments: (workspaceId) => api.get(`/documents/workspace/${workspaceId}`),
  getDocument: (documentId) => api.get(`/documents/${documentId}`),
  createDocument: (documentData) => api.post('/documents', documentData),
  updateDocument: (documentId, updates) => api.put(`/documents/${documentId}`, updates),
  deleteDocument: (documentId) => api.delete(`/documents/${documentId}`),
  getCollaborators: (documentId) => api.get(`/documents/${documentId}/collaborators`),
};

// Add to API exports
export const documentSnapshotAPI = {
  getSnapshots: (documentId, limit = 50, offset = 0) => 
    api.get(`/document-snapshots/document/${documentId}?limit=${limit}&offset=${offset}`),
  
  createSnapshot: (documentId, description) => 
    api.post(`/document-snapshots/document/${documentId}`, { description }),
  
  restoreSnapshot: (snapshotId) => 
    api.post(`/document-snapshots/${snapshotId}/restore`),
  
  deleteSnapshot: (snapshotId) => 
    api.delete(`/document-snapshots/${snapshotId}`),
};

export const fileAPI = {
  upload: (workspaceId, file, description) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);
    if (description) formData.append('description', description);
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getWorkspaceFiles: (workspaceId, limit = 50, offset = 0) => 
    api.get(`/files/workspace/${workspaceId}?limit=${limit}&offset=${offset}`),
  getFile: (fileId) => api.get(`/files/${fileId}`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
};


export default api;