import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to extract user ID from token (simplified for now)
const authenticateUser = (req, res, next) => {
  // In a real app, you'd verify JWT token
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
};

// Apply authentication to all workspace routes
router.use(authenticateUser);

// Get user's workspaces with member count
router.get('/', async (req, res) => {
  try {
    const { data: workspaceMembers, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace:workspaces (
          id,
          name,
          description,
          created_at,
          created_by
        ),
        role
      `)
      .eq('user_id', req.userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    // Get member counts for each workspace
    const workspacesWithMembers = await Promise.all(
      workspaceMembers.map(async (wm) => {
        const { count, error: countError } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', wm.workspace.id);

        if (countError) throw countError;

        return {
          ...wm.workspace,
          userRole: wm.role,
          memberCount: count || 0
        };
      })
    );

    res.json({ workspaces: workspacesWithMembers });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific workspace details with members
router.get('/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify user has access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) throw workspaceError;

    // Get workspace members with user details
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        role,
        joined_at,
        user:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    res.json({
      workspace: {
        ...workspace,
        userRole: membership.role
      },
      members: members.map(m => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joined_at
      }))
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new workspace
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert([{ 
        name, 
        description, 
        created_by: req.userId 
      }])
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert([{ 
        workspace_id: workspace.id, 
        user_id: req.userId, 
        role: 'admin' 
      }]);

    if (memberError) throw memberError;

    res.status(201).json({ 
      workspace: {
        ...workspace,
        userRole: 'admin',
        memberCount: 1
      }
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite user to workspace
router.post('/:workspaceId/invite', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify user has admin access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add user to workspace
    const { error: inviteError } = await supabase
      .from('workspace_members')
      .insert([{ 
        workspace_id: workspaceId, 
        user_id: user.id, 
        role 
      }]);

    if (inviteError) throw inviteError;

    res.json({ 
      message: 'User invited successfully',
      user: {
        id: user.id,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from workspace
router.delete('/:workspaceId/members/:userId', async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    // Verify user has admin access
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Prevent removing yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself from workspace' });
    }

    // Remove member
    const { error: removeError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (removeError) throw removeError;

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member role
router.patch('/:workspaceId/members/:userId/role', async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify user has admin access
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.userId)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update role
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;