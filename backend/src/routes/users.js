import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
router.get('/profile', async (req, res) => {
  try {
    const userId = req.headers['user-id'];

    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;