import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class WhiteboardModel {
  // Save whiteboard state
  static async saveState(workspaceId, elements, appState) {
    const { data: whiteboard, error } = await supabase
      .from('whiteboards')
      .upsert({
        workspace_id: workspaceId,
        elements: JSON.stringify(elements || []),
        app_state: JSON.stringify(appState || {}),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workspace_id'
      })
      .select()
      .single();

    if (error) throw error;
    return whiteboard;
  }

  // Load whiteboard state
  static async loadState(workspaceId) {
    const { data: whiteboard, error } = await supabase
      .from('whiteboards')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return whiteboard || {
      elements: [],
      appState: {}
    };
  }

  // Clear whiteboard
  static async clear(workspaceId) {
    const { error } = await supabase
      .from('whiteboards')
      .delete()
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }
}