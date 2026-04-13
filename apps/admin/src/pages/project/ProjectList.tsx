import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, Badge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget: number;
  actualCost: number;
  progress: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'planning', label: '規劃中' },
  { value: 'active', label: '進行中' },
  { value: 'on_hold', label: '暫停' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  planning: 'info',
  active: 'success',
  on_hold: 'warning',
  completed: 'neutral',
  cancelled: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  planning: '規劃中',
  active: '進行中',
  on_hold: '暫停',
  completed: '已完成',
  cancelled: '已取消',
};

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function ProjectListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, loading, error, refetch } = useFetch<any>(
    `/project/projects?${params}`,
    [page, statusFilter],
  );

  const columns = [
    {
      key: 'projectCode',
      title: '專案編號',
      render: (r: Project) => <span className="font-medium text-gray-900">{r.projectCode}</span>,
    },
    { key: 'name', title: '專案名稱', render: (r: Project) => r.name },
    {
      key: 'status',
      title: '狀態',
      render: (r: Project) => (
        <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'}>
          {STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'progress',
      title: '進度',
      render: (r: Project) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${r.progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{r.progress}%</span>
        </div>
      ),
    },
    { key: 'budget', title: '預算', render: (r: Project) => formatNTD(r.budget) },
    {
      key: 'cost',
      title: '實際成本',
      render: (r: Project) => {
        const over = Number(r.actualCost) > Number(r.budget) && Number(r.budget) > 0;
        return <span className={over ? 'text-red-600 font-medium' : ''}>{formatNTD(r.actualCost)}</span>;
      },
    },
    { key: 'startDate', title: '開始日期', render: (r: Project) => formatDate(r.startDate) },
    {
      key: 'actions',
      title: '操作',
      render: (r: Project) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/project/${r.id}`); }}>
          查看
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-600 text-lg mb-4">載入失敗：{error}</p>
        <Button onClick={refetch}>重新載入</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">專案管理</h2>
          <p className="mt-1 text-sm text-gray-500">管理專案、WBS、資源與里程碑</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button onClick={() => navigate('/project/create')}>新增專案</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<Project>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          onRowClick={(r) => navigate(`/project/${r.id}`)}
          emptyText="目前沒有專案"
        />
        {data && (
          <Pagination
            current={data.meta?.page ?? 1}
            total={data.meta?.total ?? 0}
            pageSize={data.meta?.limit ?? 20}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
