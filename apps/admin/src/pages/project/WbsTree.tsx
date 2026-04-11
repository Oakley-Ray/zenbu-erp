import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface WbsTask {
  id: string;
  code: string;
  name: string;
  status: string;
  progress: number;
  level: number;
  parentId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  plannedHours: number;
  actualHours: number;
  assigneeId?: string;
  dependencies: string[];
}

const STATUS_LABEL: Record<string, string> = {
  not_started: '未開始',
  in_progress: '進行中',
  completed: '已完成',
  cancelled: '已取消',
};

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

export function WbsTree({ projectId }: { projectId: string }) {
  const { data: tasks, loading, refetch } = useFetch<WbsTask[]>(
    `/project/tasks?projectId=${projectId}`,
    [projectId],
  );

  const [showForm, setShowForm] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>();
  const [form, setForm] = useState({ name: '', plannedStartDate: '', plannedEndDate: '', plannedHours: '' });
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allTasks = tasks ?? [];

  const hasChildren = (id: string) => allTasks.some((t) => t.parentId === id);

  /** 計算父任務的進度（子任務完成數 / 子任務總數） */
  const computeProgress = (id: string): number => {
    const children = allTasks.filter((t) => t.parentId === id);
    if (children.length === 0) return 0;
    const completedCount = children.filter((c) => {
      if (hasChildren(c.id)) return computeProgress(c.id) === 100;
      return c.progress === 100;
    }).length;
    return Math.round((completedCount / children.length) * 100);
  };

  /** 取得任務的顯示進度 */
  const getDisplayProgress = (task: WbsTask): number => {
    if (hasChildren(task.id)) return computeProgress(task.id);
    return task.progress;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/project/tasks', 'POST', {
        projectId,
        parentId,
        name: form.name,
        plannedStartDate: form.plannedStartDate || undefined,
        plannedEndDate: form.plannedEndDate || undefined,
        plannedHours: form.plannedHours ? Number(form.plannedHours) : undefined,
      });
      setForm({ name: '', plannedStartDate: '', plannedEndDate: '', plannedHours: '' });
      setShowForm(false);
      setParentId(undefined);
      refetch();
    } catch (err: any) {
      alert(err.message || '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  /** 勾選/取消勾選完成 */
  const handleToggleComplete = async (task: WbsTask) => {
    const newProgress = task.progress === 100 ? 0 : 100;
    try {
      await apiRequest(`/project/tasks/${task.id}`, 'PATCH', { progress: newProgress });
      refetch();
    } catch (err: any) {
      alert(err.message || '更新失敗');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('確定要刪除此任務？')) return;
    try {
      await apiRequest(`/project/tasks/${taskId}`, 'DELETE');
      refetch();
    } catch (err: any) {
      alert(err.message || '刪除失敗');
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isHidden = (task: WbsTask): boolean => {
    if (!task.parentId) return false;
    if (collapsed.has(task.parentId)) return true;
    const parent = allTasks.find((t) => t.id === task.parentId);
    return parent ? isHidden(parent) : false;
  };

  if (loading) return <div className="text-gray-400 py-8 text-center">載入中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">工作分解結構 (WBS)</h3>
        <Button onClick={() => { setShowForm(true); setParentId(undefined); }}>
          新增根任務
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {parentId ? '新增子任務' : '新增根任務'}
          </p>
          <input
            type="text"
            className={inputClass}
            placeholder="任務名稱"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="date"
              className={inputClass}
              value={form.plannedStartDate}
              onChange={(e) => setForm({ ...form, plannedStartDate: e.target.value })}
              placeholder="開始日期"
            />
            <input
              type="date"
              className={inputClass}
              value={form.plannedEndDate}
              onChange={(e) => setForm({ ...form, plannedEndDate: e.target.value })}
              placeholder="結束日期"
            />
            <input
              type="number"
              className={inputClass}
              value={form.plannedHours}
              onChange={(e) => setForm({ ...form, plannedHours: e.target.value })}
              placeholder="計劃工時"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? '新增中...' : '新增'}</Button>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
        {allTasks.length === 0 ? (
          <div className="py-12 text-center text-gray-400">尚未建立任何任務</div>
        ) : (
          allTasks.filter((t) => !isHidden(t)).map((task) => {
            const isLeaf = !hasChildren(task.id);
            const isCompleted = isLeaf ? task.progress === 100 : computeProgress(task.id) === 100;
            const displayProgress = getDisplayProgress(task);

            return (
              <div
                key={task.id}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${isCompleted ? 'bg-green-50/30' : ''}`}
                style={{ paddingLeft: `${task.level * 24 + 16}px` }}
              >
                <div className="flex items-center gap-3">
                  {/* 展開/收合 */}
                  <button
                    onClick={() => toggleCollapse(task.id)}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {hasChildren(task.id) ? (collapsed.has(task.id) ? '▶' : '▼') : ' '}
                  </button>

                  {/* 勾選框（僅葉節點可勾選） */}
                  {isLeaf ? (
                    <input
                      type="checkbox"
                      checked={task.progress === 100}
                      onChange={() => handleToggleComplete(task)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  ) : (
                    <div className="w-4 h-4 flex items-center justify-center">
                      {isCompleted ? (
                        <span className="text-green-500 text-sm">✓</span>
                      ) : (
                        <span className="text-gray-300 text-sm">○</span>
                      )}
                    </div>
                  )}

                  {/* WBS Code */}
                  <span className="text-xs text-gray-400 font-mono w-12">{task.code}</span>

                  {/* Name + details */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.name}
                    </span>
                    <div className="flex gap-3 mt-0.5">
                      {task.plannedStartDate && (
                        <span className="text-[10px] text-gray-400">
                          {task.plannedStartDate.slice(0, 10)} ~ {task.plannedEndDate?.slice(0, 10) ?? '?'}
                        </span>
                      )}
                      {Number(task.plannedHours) > 0 && (
                        <span className="text-[10px] text-gray-400">{task.plannedHours}h</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-1.5 w-24">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          displayProgress === 100 ? 'bg-green-500' :
                          displayProgress > 0 ? 'bg-primary-500' :
                          'bg-gray-200'
                        }`}
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{displayProgress}%</span>
                  </div>

                  {/* Status label */}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isCompleted ? 'bg-green-100 text-green-700' :
                    displayProgress > 0 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {isCompleted ? '已完成' : displayProgress > 0 ? '進行中' : '未開始'}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => { setShowForm(true); setParentId(task.id); }}
                    className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer"
                    title="新增子任務"
                  >
                    + 子任務
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                    title="刪除"
                  >
                    刪除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
