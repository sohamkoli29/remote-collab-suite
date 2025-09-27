import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class TaskBoardModel {
  // Get all lists for a workspace
  static async getLists(workspaceId) {
    const { data: lists, error } = await supabase
      .from('task_lists')
      .select(`
        *,
        tasks:task_items (
          *,
          assignee:users (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          creator:users (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (error) throw error;
    return lists;
  }

  // Create a new list
  static async createList(workspaceId, name, position = 0) {
    // Get current max position to place at the end
    if (position === 0) {
      const { data: lists } = await supabase
        .from('task_lists')
        .select('position')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: false })
        .limit(1);
      
      position = lists && lists.length > 0 ? lists[0].position + 1 : 0;
    }

    const { data: list, error } = await supabase
      .from('task_lists')
      .insert([{
        workspace_id: workspaceId,
        name,
        position,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return list;
  }

  // Update list
  static async updateList(listId, updates) {
    const { data: list, error } = await supabase
      .from('task_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;
    return list;
  }

  // Delete list and its tasks
  static async deleteList(listId) {
    // First delete all tasks in the list
    const { error: tasksError } = await supabase
      .from('task_items')
      .delete()
      .eq('list_id', listId);

    if (tasksError) throw tasksError;

    // Then delete the list
    const { error } = await supabase
      .from('task_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;
    return { success: true };
  }

  // Reorder lists
  static async reorderLists(workspaceId, listOrders) {
    const updates = listOrders.map((listId, index) => ({
      id: listId,
      position: index
    }));

    const { error } = await supabase
      .from('task_lists')
      .upsert(updates);

    if (error) throw error;
    return { success: true };
  }

  // Create a new task
  static async createTask(listId, taskData, userId) {
    // Get current max position in the list
    const { data: tasks } = await supabase
      .from('task_items')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);

    const position = tasks && tasks.length > 0 ? tasks[0].position + 1 : 0;

    const { data: task, error } = await supabase
      .from('task_items')
      .insert([{
        list_id: listId,
        title: taskData.title,
        description: taskData.description,
        position,
        created_by: userId,
        assignee_id: taskData.assigneeId,
        due_date: taskData.dueDate,
        priority: taskData.priority || 'medium',
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        assignee:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return task;
  }

  // Update task
  static async updateTask(taskId, updates) {
    const { data: task, error } = await supabase
      .from('task_items')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        assignee:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return task;
  }

  // Delete task
  static async deleteTask(taskId) {
    const { error } = await supabase
      .from('task_items')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return { success: true };
  }

  // Move task to different list
  static async moveTask(taskId, newListId, newPosition = 0) {
    // Update task's list and position
    const { data: task, error } = await supabase
      .from('task_items')
      .update({
        list_id: newListId,
        position: newPosition,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select(`
        *,
        assignee:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        creator:users (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return task;
  }

  // Reorder tasks within a list
  static async reorderTasks(listId, taskOrders) {
    const updates = taskOrders.map((taskId, index) => ({
      id: taskId,
      position: index
    }));

    const { error } = await supabase
      .from('task_items')
      .upsert(updates);

    if (error) throw error;
    return { success: true };
  }
}