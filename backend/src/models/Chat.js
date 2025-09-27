import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class ChatModel {
  // Create a new message
  static async createMessage(workspaceId, userId, content, messageType = 'text') {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert([{
        workspace_id: workspaceId,
        user_id: userId,
        content,
        message_type: messageType,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        user:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return message;
  }

  // Get message history for a workspace
  static async getMessages(workspaceId, limit = 50, offset = 0) {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return messages.reverse(); // Return in chronological order
  }

  // Get online users in a workspace
  static async getOnlineUsers(workspaceId) {
    // This would typically come from Redis, but for now we'll use a simple approach
    // In a production app, you'd store online status in Redis
    return []; // Placeholder
  }

  // Mark message as read
  static async markAsRead(messageId, userId) {
    const { error } = await supabase
      .from('message_reads')
      .insert([{
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString()
      }])
      .upsert(); // Handle duplicate reads

    if (error) throw error;
  }

  // Get unread message count for user in workspace
  static async getUnreadCount(workspaceId, userId) {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .not('user_id', 'eq', userId) // Don't count user's own messages
      .not('message_reads', 'cs', `{"user_id": "${userId}"}`); // Messages not read by user

    if (error) throw error;
    return count || 0;
  }
}