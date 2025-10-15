import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for storage operations
);

// Middleware to extract user ID from token
const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

// Apply authentication to all routes
router.use(authenticateUser);

// Upload file to workspace
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { workspaceId, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // Generate unique file path
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${req.userId}/${workspaceId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('workspace-files')
      .getPublicUrl(filePath);

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert([{
        workspace_id: workspaceId,
        uploaded_by: req.userId,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        file_url: urlData.publicUrl,
        storage_path: filePath,
        description: description || null
      }])
      .select(`
        *,
        uploader:users!uploaded_by (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to delete the uploaded file
      await supabase.storage.from('workspace-files').remove([filePath]);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }

    res.status(201).json({ 
      message: 'File uploaded successfully',
      file: fileRecord
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get files for a workspace
router.get('/workspace/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // Get files
    const { data: files, error, count } = await supabase
      .from('files')
      .select(`
        *,
        uploader:users!uploaded_by (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ 
      files: files || [],
      total: count,
      hasMore: count > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file info
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*, workspace_id')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access (either uploader or workspace admin)
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', file.workspace_id)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user is uploader or admin
    if (file.uploaded_by !== req.userId && membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only the uploader or workspace admin can delete this file' });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('workspace-files')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) throw deleteError;

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get file info
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const { data: file, error } = await supabase
      .from('files')
      .select(`
        *,
        uploader:users!uploaded_by (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access to workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', file.workspace_id)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ file });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;