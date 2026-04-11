import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface Resource {
  id: string;
  name: string;
  type: string;
  unit: string;
  unitCost: number;
}

interface Task {
  id: string;
  code: string;
  name: string;
  resourceAssignments?: {
    id: string;
    quantity: number;
    totalCost: number;
    resource?: Resource;
  }[];
}

const TYPE_LABEL: Record<string, string> = {
  personnel: '人員',
  equipment: '設備',
  material: '材料',
};

const TYPE_VARIANT: Record<string, 'info' | 'success' | 'warning'> = {
  personnel: 'info',
  equipment: 'success',
  material: 'warning',
};

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }

export function ResourceAllocation({ projectId }: { projectId: string }) {
  const { data: tasks, refetch: refetchTasks } = useFetch<Task[]>(
    `/project/tasks?projectId=${projectId}`,
    [projectId],
  );

  const { data: resources, refetch: refetchResources } = useFetch<Resource[]>(
    '/project/resources',
    [],
  );

  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState({ name: '', type: 'personnel', unit: 'hour', unitCost: '' });
  const [assignForm, setAssignForm] = useState({ taskId: '', resourceId: '', quantity: '1' });
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/project/resources', 'POST', {
        name: resourceForm.name,
        type: resourceForm.type,
        unit: resourceForm.unit,
        unitCost: resourceForm.unitCost ? Number(resourceForm.unitCost) : 0,
      });
      setResourceForm({ name: '', type: 'personnel', unit: 'hour', unitCost: '' });
      setShowResourceForm(false);
      refetchResources();
    } catch (err: any) {
      alert(err.message || '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/project/resources/assign', 'POST', {
        taskId: assignForm.taskId,
        resourceId: assignForm.resourceId,
        quantity: Number(assignForm.quantity),
      });
      setAssignForm({ taskId: '', resourceId: '', quantity: '1' });
      setShowAssignForm(false);
      refetchTasks();
    } catch (err: any) {
      alert(err.message || '分配失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await apiRequest(`/project/resources/assignments/${id}`, 'DELETE');
      refetchTasks();
    } catch (err: any) {
      alert(err.message || '移除失敗');
    }
  };

  return (
    <div className="space-y-6">
      {/* Resource Pool */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">資源池</h3>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowAssignForm(true)}>分配資源</Button>
            <Button onClick={() => setShowResourceForm(true)}>新增資源</Button>
          </div>
        </div>

        {showResourceForm && (
          <form onSubmit={handleAddResource} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                className={inputClass}
                placeholder="資源名稱"
                value={resourceForm.name}
                onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                required
              />
              <select
                className={inputClass}
                value={resourceForm.type}
                onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
              >
                <option value="personnel">人員</option>
                <option value="equipment">設備</option>
                <option value="material">材料</option>
              </select>
              <input
                type="text"
                className={inputClass}
                placeholder="單位 (hour/kg/...)"
                value={resourceForm.unit}
                onChange={(e) => setResourceForm({ ...resourceForm, unit: e.target.value })}
              />
              <input
                type="number"
                className={inputClass}
                placeholder="單位成本"
                value={resourceForm.unitCost}
                onChange={(e) => setResourceForm({ ...resourceForm, unitCost: e.target.value })}
                min="0"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? '新增中...' : '新增'}</Button>
              <Button variant="ghost" type="button" onClick={() => setShowResourceForm(false)}>取消</Button>
            </div>
          </form>
        )}

        {showAssignForm && (
          <form onSubmit={handleAssign} className="bg-blue-50 p-4 rounded-lg mb-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">分配資源至任務</p>
            <div className="grid grid-cols-3 gap-3">
              <select className={inputClass} value={assignForm.taskId} onChange={(e) => setAssignForm({ ...assignForm, taskId: e.target.value })} required>
                <option value="">選擇任務</option>
                {(tasks ?? []).map((t) => (
                  <option key={t.id} value={t.id}>{t.code} {t.name}</option>
                ))}
              </select>
              <select className={inputClass} value={assignForm.resourceId} onChange={(e) => setAssignForm({ ...assignForm, resourceId: e.target.value })} required>
                <option value="">選擇資源</option>
                {(resources ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({TYPE_LABEL[r.type]})</option>
                ))}
              </select>
              <input
                type="number"
                className={inputClass}
                placeholder="數量"
                value={assignForm.quantity}
                onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
                min="0"
                step="0.5"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? '分配中...' : '分配'}</Button>
              <Button variant="ghost" type="button" onClick={() => setShowAssignForm(false)}>取消</Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-3 gap-3">
          {(resources ?? []).map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{r.name}</span>
                <Badge variant={TYPE_VARIANT[r.type] ?? 'default'}>{TYPE_LABEL[r.type] ?? r.type}</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">{formatNTD(r.unitCost)} / {r.unit}</p>
            </div>
          ))}
          {(!resources || resources.length === 0) && (
            <p className="text-sm text-gray-400 col-span-3">尚未建立資源</p>
          )}
        </div>
      </div>

      {/* Task Assignments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">任務資源分配</h3>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {(tasks ?? []).filter((t) => t.resourceAssignments && t.resourceAssignments.length > 0).map((task) => (
            <div key={task.id} className="p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                <span className="text-gray-400 font-mono mr-2">{task.code}</span>
                {task.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {task.resourceAssignments!.map((ra) => (
                  <div key={ra.id} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1 text-xs">
                    <span>{ra.resource?.name}</span>
                    <span className="text-gray-400">x{ra.quantity}</span>
                    <span className="text-gray-400">{formatNTD(ra.totalCost)}</span>
                    <button
                      onClick={() => handleRemoveAssignment(ra.id)}
                      className="text-red-400 hover:text-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(tasks ?? []).every((t) => !t.resourceAssignments || t.resourceAssignments.length === 0) && (
            <div className="py-8 text-center text-gray-400 text-sm">尚未分配任何資源</div>
          )}
        </div>
      </div>
    </div>
  );
}
