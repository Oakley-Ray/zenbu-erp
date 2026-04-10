import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, SupplierStatusBadge, Badge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  contactPhone?: string;
  status: string;
  overallScore: number;
  qualityScore: number;
  deliveryScore: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'active', label: '有效' },
  { value: 'inactive', label: '停用' },
  { value: 'blacklisted', label: '黑名單' },
] as const;

function ScoreBadge({ score }: { score: number }) {
  const n = Number(score);
  const variant = n >= 80 ? 'success' : n >= 60 ? 'warning' : 'danger';
  return <Badge variant={variant}>{n.toFixed(1)}</Badge>;
}

export function SupplierListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);
  if (search) params.set('search', search);

  const { data, loading, error, refetch } = useFetch<any>(
    `/procurement/suppliers?${params}`,
    [page, statusFilter, search],
  );

  const columns = [
    {
      key: 'supplierCode',
      title: '供應商編號',
      render: (r: Supplier) => <span className="font-medium text-gray-900">{r.supplierCode}</span>,
    },
    { key: 'name', title: '供應商名稱', render: (r: Supplier) => r.name },
    { key: 'contactPerson', title: '聯絡人', render: (r: Supplier) => r.contactPerson ?? '—' },
    { key: 'contactPhone', title: '電話', render: (r: Supplier) => r.contactPhone ?? '—' },
    {
      key: 'status',
      title: '狀態',
      render: (r: Supplier) => <SupplierStatusBadge status={r.status} />,
    },
    { key: 'overallScore', title: '綜合評分', render: (r: Supplier) => <ScoreBadge score={r.overallScore} /> },
    { key: 'qualityScore', title: '品質', render: (r: Supplier) => <ScoreBadge score={r.qualityScore} /> },
    { key: 'deliveryScore', title: '交期', render: (r: Supplier) => <ScoreBadge score={r.deliveryScore} /> },
    {
      key: 'actions',
      title: '操作',
      render: (r: Supplier) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/procurement/suppliers/${r.id}`); }}>
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
          <h2 className="text-2xl font-bold text-gray-900">供應商管理</h2>
          <p className="mt-1 text-sm text-gray-500">管理供應商資料、評分與合約</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="搜尋供應商..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button onClick={() => navigate('/procurement/suppliers/create')}>新增供應商</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<Supplier>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          onRowClick={(r) => navigate(`/procurement/suppliers/${r.id}`)}
          emptyText="目前沒有供應商資料"
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
