'use client';

import { useEffect } from 'react';
import { useLifeOS, Task } from './useLifeOSState';
import { useCollection } from './useCollection';
import type { GoalTarget } from '@/lib/lifeGoals';

export const isTaskDone = (t?: Pick<Task, 'status'> | null) => !!t && (t.status === 'done' || t.status === 'completed');

type Targets = ReturnType<typeof useCollection<GoalTarget>>;

/**
 * Goal target ↔ task. Turning a day target into a task stores the task id;
 * ticking either side ticks the other (the task → target direction runs in <LinkSync/>).
 */
export function useGoalTargetLinks(targets: Targets) {
  const { state, addTask, updateTaskStatus } = useLifeOS();
  const taskOf = (t: GoalTarget) => (t.taskId ? state.tasks.find((x) => x.id === t.taskId) : undefined);

  const toggle = async (t: GoalTarget) => {
    const done = !t.done;
    await targets.update(t.id, { done });
    const task = taskOf(t);
    if (task && isTaskDone(task) !== done) await updateTaskStatus(task.id, done ? 'done' : 'todo');
  };

  const makeTask = async (t: GoalTarget) => {
    if (taskOf(t)) return;
    const taskId = await addTask({ title: t.title, due: t.periodStart, priority: 'Medium', projectId: '' });
    await targets.update(t.id, { taskId });
  };

  return { toggle, makeTask, taskOf };
}

/**
 * Keeps linked records in step with the task list. Mounted once in the layout.
 * - Goal targets follow the done state of the task made from them.
 */
export function LinkSync() {
  const { state, loading } = useLifeOS();
  const targets = useCollection<GoalTarget>('goal_targets');

  useEffect(() => {
    if (loading || targets.loading) return;
    targets.items.forEach((t) => {
      if (!t.taskId) return;
      const task = state.tasks.find((x) => x.id === t.taskId);
      if (!task) return; // not loaded, or deleted: the target simply offers "Make task" again
      const done = isTaskDone(task);
      if (done !== t.done) targets.update(t.id, { done });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tasks, targets.items, loading, targets.loading]);

  return null;
}
