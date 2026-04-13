import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface CostEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  taskId?: string;
}

interface CostSummary {
  budget: number;
  actualCost: number;
  remaining: number;
  usagePercent: number;
  byCategory: { category: string; total: string }[];
}

const CATEGORY_LABEL: Record<string, string> = {
  labor: '人力',
  material: '材料',
  equipment: '設備',
  other: '其他',
};

const CATEGORY_COLOR: Record<string, string> = {
  labor: 'bg-blue-500',
  material: 'bg-green-500',
  equipment: 'bg-yellow-500',
  other: 'bg-gray-500',
};

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function CostDashboard({ projectId }: { projectId: string }) {
  const { data: summary, refetch: refetchSummary } = useFetch<CostSummary>(
    `/project/costs/summary?projectId=${projectId}`,
    [projectId],
  );

  const { data: entries, refetch: refetchEntries } = useFetch<CostEntry[]>(
    `/project/costs?projectId=${projectId}`,
    [projectId],
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: 'labor',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/project/costs', 'POST', {
        projectId,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
      });
      setForm({ category: 'labor', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      refetchSummary();
      refetchEntries();
    } catch (err: any) {
      alert(err.message || '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此成本記錄？')) return;
    try {
      await apiRequest(`/project/costs/${id}`, 'DELETE');
      refetchSummary();
      refetchEntries();
    } catch (err: any) {
      alert(err.message || '刪除失敗');
    }
  };

  const isOverBudget = summary && summary.usagePercent > 100;
  const isWarning = summary && summary.usagePercent > 80 && summary.usagePercent <= 100;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">預算</p>
            <p className="text-xl font-semibold">{formatNTD(summary.budget)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">實際支出</p>
            <p className={`text-xl font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
              {formatNTD(summary.actualCost)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">剩餘預算</p>
            <p className={`text-xl font-semibold ${summary.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatNTD(summary.remaining)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">使用率</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(summary.usagePercent, 100)}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                {summary.usagePercent}%
              </span>
            </div>
            {isOverBudget && <p className="text-xs text-red-500 mt-1">已超出預算</p>}
            {isWarning && <p className="text-xs text-yellow-600 mt-1">預算即將用完</p>}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && summary.byCategory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">成本分類</h4>
          <div className="space-y-2">
            {summary.byCategory.map((c) => {
              const total = Number(c.total);
              const pct = Number(summary.actualCost) > 0
                ? Math.round((total / Number(summary.actualCost)) * 100)
                : 0;
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_COLOR[c.category] ?? 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-24 text-right">{formatNTD(total)}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add + List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">成本記錄</h3>
          <Button onClick={() => setShowForm(true)}>新增成本</Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="labor">人力</option>
                <option value="material">材料</option>
                <option value="equipment">設備</option>
                <option value="other">其他</option>
              </select>
              <input
                type="text"
                className={`${inputClass} col-span-2`}
                placeholder="描述"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <input
                type="number"
                className={inputClass}
                placeholder="金額"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                min="0"
                required
              />
            </div>
            <input
              type="date"
              className={`${inputClass} w-48`}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? '新增中...' : '新增'}</Button>
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>取消</Button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {(!entries || entries.length === 0) ? (
            <div className="py-8 text-center text-gray-400 text-sm">尚未記錄任何成本</div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="neutral">{CATEGORY_LABEL[entry.category] ?? entry.category}</Badge>
                  <span className="text-sm text-gray-900">{entry.description}</span>
                  <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatNTD(entry.amount)}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
