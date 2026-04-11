import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, FormField } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function ProjectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: existing } = useFetch<any>(
    id ? `/project/projects/${id}` : null,
    [id],
  );

  const { data: usersData } = useFetch<any>('/users?limit=100', []);
  const users: User[] = usersData?.data ?? usersData ?? [];

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    budget: '',
    managerId: '',
  });
  const [saving, setSaving] = useState(false);

  const [loaded, setLoaded] = useState(false);
  if (isEdit && existing && !loaded) {
    setForm({
      name: existing.name ?? '',
      description: existing.description ?? '',
      startDate: existing.startDate?.slice(0, 10) ?? '',
      endDate: existing.endDate?.slice(0, 10) ?? '',
      budget: String(existing.budget ?? ''),
      managerId: existing.managerId ?? '',
    });
    setLoaded(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        managerId: form.managerId || undefined,
      };

      if (isEdit) {
        await apiRequest(`/project/projects/${id}`, 'PATCH', payload);
      } else {
        await apiRequest('/project/projects', 'POST', payload);
      }
      navigate('/project');
    } catch (err: any) {
      alert(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '編輯專案' : '新增專案'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <FormField label="專案名稱" required>
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </FormField>

        <FormField label="說明">
          <textarea
            className={`${inputClass} h-24 resize-none`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>

        <FormField label="負責人">
          <select
            className={inputClass}
            value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
          >
            <option value="">未指定</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="開始日期" required>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </FormField>
          <FormField label="結束日期">
            <input
              type="date"
              className={inputClass}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="預算 (NT$)">
          <input
            type="number"
            className={inputClass}
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            min="0"
            step="1"
          />
        </FormField>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? '儲存中...' : isEdit ? '更新' : '建立專案'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate('/project')}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
