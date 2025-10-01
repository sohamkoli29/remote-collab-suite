import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class TaskBoardModel {
  // Get all lists for a workspace
  // Get all lists for a workspace
static async getLists(workspaceId) {
  try {
    console.log('🔍 Getting lists for workspace:', workspaceId);
    
    // First get the basic lists
    const { data: lists, error: listsError } = await supabase
      .from('task_lists')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true });

    if (listsError) {
      console.error('❌ Error fetching lists:', listsError);
      throw listsError;
    }

    console.log('✅ Basic lists retrieved:', lists?.length || 0);

    if (!lists || lists.length === 0) {
      return [];
    }

    // Get tasks for each list separately to avoid relationship issues
    const listsWithTasks = await Promise.all(
      lists.map(async (list) => {
        try {
          const { data: tasks, error: tasksError } = await supabase
            .from('task_items')
            .select(`
              *,
              assignee:users!task_items_assignee_id_fkey (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              ),
              creator:users!task_items_created_by_fkey (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            `)
            .eq('list_id', list.id)
            .order('position', { ascending: true });

          if (tasksError) {
            console.error(`❌ Error fetching tasks for list ${list.id}:`, tasksError);
            return { ...list, tasks: [] };
          }

          return { ...list, tasks: tasks || [] };
        } catch (taskError) {
          console.error(`❌ Error processing list ${list.id}:`, taskError);
          return { ...list, tasks: [] };
        }
      })
    );

    console.log('✅ Lists with tasks processed successfully');
    return listsWithTasks;
  } catch (error) {
    console.error('❌ Error in TaskBoardModel.getLists:', error);
    throw error;
  }
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
  // Create a new task
static async createTask(listId, taskData, userId) {
  try {
    console.log('=== CREATING TASK ===');
    console.log('listId:', listId);
    console.log('taskData:', taskData);
    console.log('userId:', userId);

    // Get max position
    const { data: tasks } = await supabase
      .from('task_items')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);

    const position = tasks && tasks.length > 0 ? tasks[0].position + 1 : 0;

    // Insert task
    const taskInsert = {
      list_id: listId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || null,
      position: position,
      created_by: userId,
      assignee_id: taskData.assigneeId || null,
      due_date: taskData.dueDate || null,
      priority: taskData.priority || 'medium',
      created_at: new Date().toISOString()
    };

    console.log('Task insert data:', taskInsert);

    // First insert without the complex select to avoid relationship issues
    const { data: task, error } = await supabase
      .from('task_items')
      .insert([taskInsert])
      .select('*') // Only select basic fields first
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('✅ Task created successfully with ID:', task.id);

    // Now get the full task data with user relationships separately
    const { data: fullTask, error: fetchError } = await supabase
      .from('task_items')
      .select(`
        *,
        assignee:users!task_items_assignee_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        creator:users!task_items_created_by_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', task.id)
      .single();

    if (fetchError) {
      console.error('Error fetching full task data:', fetchError);
      // Return basic task if we can't get full data
      return task;
    }

    return fullTask;

  } catch (error) {
    console.error('Error in createTask:', error);
    throw error;
  }
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