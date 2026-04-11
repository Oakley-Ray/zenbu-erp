import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  achievedDate?: string;
  status: string;
  deliverables: { name: string; description?: string; completed: boolean }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待完成',
  achieved: '已達成',
  missed: '已逾期',
  cancelled: '已取消',
};

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  pending: 'info',
  achieved: 'success',
  missed: 'error',
  cancelled: 'default',
};

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function MilestoneTimeline({ projectId }: { projectId: string }) {
  const { data: milestones, loading, refetch } = useFetch<Milestone[]>(
    `/project/milestones?projectId=${projectId}`,
    [projectId],
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/project/milestones', 'POST', {
        projectId,
        name: form.name,
        description: form.description || undefined,
        dueDate: form.dueDate,
      });
      setForm({ name: '', description: '', dueDate: '' });
      setShowForm(false);
      refetch();
    } catch (err: any) {
      alert(err.message || '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleAchieve = async (id: string) => {
    try {
      await apiRequest(`/project/milestones/${id}/achieve`, 'PATCH');
      refetch();
    } catch (err: any) {
      alert(err.message || '操作失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此里程碑？')) return;
    try {
      await apiRequest(`/project/milestones/${id}`, 'DELETE');
      refetch();
    } catch (err: any) {
      alert(err.message || '刪除失敗');
    }
  };

  if (loading) return <div className="text-gray-400 py-8 text-center">載入中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">里程碑</h3>
        <Button onClick={() => setShowForm(true)}>新增里程碑</Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
          <input
            type="text"
            className={inputClass}
            placeholder="里程碑名稱"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <textarea
            className={`${inputClass} h-16 resize-none`}
            placeholder="描述（選填）"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="date"
            className={inputClass}
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? '新增中...' : '新增'}</Button>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      {(!milestones || milestones.length === 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 py-12 text-center text-gray-400">
          尚未建立任何里程碑
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {milestones.map((m) => {
              const isOverdue = m.status === 'pending' && new Date(m.dueDate) < new Date();
              return (
                <div key={m.id} className="relative flex gap-4 pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 border-white ${
                    m.status === 'achieved' ? 'bg-green-500' :
                    isOverdue ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />

                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{m.name}</h4>
                          <Badge variant={isOverdue ? 'error' : STATUS_VARIANT[m.status] ?? 'default'}>
                            {isOverdue ? '已逾期' : STATUS_LABEL[m.status] ?? m.status}
                          </Badge>
                        </div>
                        {m.description && (
                          <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          到期日：{formatDate(m.dueDate)}
                          {m.achievedDate && ` | 達成日：${formatDate(m.achievedDate)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {m.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleAchieve(m.id)}>
                            標記達成
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                          刪除
                        </Button>
                      </div>
                    </div>

                    {m.deliverables.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-500 mb-1">交付物：</p>
                        {m.deliverables.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span>{d.completed ? '✓' : '○'}</span>
                            <span className={d.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                              {d.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
