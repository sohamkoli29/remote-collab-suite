import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service key for storage
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

// Configure multer for avatar upload
const storage = multer.memoryStorage();
const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars'));
    }
  }
});

// Search users by email (for invitations)
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || email.length < 3) {
      return res.status(400).json({ error: 'Email query must be at least 3 characters' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, avatar_url')
      .ilike('email', `${email}%`)
      .limit(10);

    if (error) throw error;

    res.json({ users: users || [] });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, avatar_url, bio, phone, job_title, created_at')
      .eq('id', req.userId)
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { first_name, last_name, bio, phone, job_title } = req.body;
    
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;
    if (job_title !== undefined) updates.job_title = job_title;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select('id, first_name, last_name, email, avatar_url, bio, phone, job_title, created_at')
      .single();

    if (error) throw error;

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar
router.post('/avatar', authenticateUser, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old avatar if exists
    const { data: currentUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', req.userId)
      .single();

    if (currentUser?.avatar_url) {
      // Extract path from URL and delete
      const oldPath = currentUser.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    // Generate unique file path
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${req.userId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user record
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', req.userId)
      .select('id, first_name, last_name, email, avatar_url, bio, phone, job_title, created_at')
      .single();

    if (updateError) throw updateError;

    res.json({ 
      message: 'Avatar uploaded successfully',
      user 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete avatar
router.delete('/avatar', authenticateUser, async (req, res) => {
  try {
    const { data: currentUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', req.userId)
      .single();

    if (currentUser?.avatar_url) {
      // Extract path from URL and delete
      const path = currentUser.avatar_url.split('/avatars/')[1];
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    }

    // Update user record
    const { data: user, error } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', req.userId)
      .select('id, first_name, last_name, email, avatar_url, bio, phone, job_title, created_at')
      .single();

    if (error) throw error;

    res.json({ 
      message: 'Avatar deleted successfully',
      user 
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;