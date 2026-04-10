import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, PoStatusBadge, Badge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface PO {
  id: string;
  poNumber: string;
  supplier?: { name: string };
  totalAmount: number;
  status: string;
  approvalLevel?: string;
  expectedDeliveryDate?: string;
  version: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_approval', label: '待審核' },
  { value: 'approved', label: '已核准' },
  { value: 'ordered', label: '已下單' },
  { value: 'partial_received', label: '部分到貨' },
  { value: 'received', label: '已到貨' },
  { value: 'closed', label: '已結案' },
];

const APPROVAL_LABELS: Record<string, string> = {
  manager: '主管',
  director: '經理',
  vp: '副總',
};

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function PurchaseOrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, loading, error, refetch } = useFetch<any>(
    `/procurement/purchase-orders?${params}`,
    [page, statusFilter],
  );

  const columns = [
    {
      key: 'poNumber',
      title: '採購單號',
      render: (r: PO) => (
        <div>
          <span className="font-medium text-gray-900">{r.poNumber}</span>
          {r.version > 1 && <Badge variant="info">v{r.version}</Badge>}
        </div>
      ),
    },
    { key: 'supplier', title: '供應商', render: (r: PO) => r.supplier?.name ?? '—' },
    { key: 'totalAmount', title: '金額', render: (r: PO) => formatNTD(r.totalAmount) },
    { key: 'status', title: '狀態', render: (r: PO) => <PoStatusBadge status={r.status} /> },
    {
      key: 'approvalLevel',
      title: '審核層級',
      render: (r: PO) => r.approvalLevel ? <Badge variant="info">{APPROVAL_LABELS[r.approvalLevel] ?? r.approvalLevel}</Badge> : '—',
    },
    { key: 'expectedDeliveryDate', title: '預期交期', render: (r: PO) => formatDate(r.expectedDeliveryDate) },
    { key: 'createdAt', title: '建立時間', render: (r: PO) => formatDate(r.createdAt) },
    {
      key: 'actions',
      title: '操作',
      render: (r: PO) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/procurement/purchase-orders/${r.id}`); }}>
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
          <h2 className="text-2xl font-bold text-gray-900">採購訂單</h2>
          <p className="mt-1 text-sm text-gray-500">管理採購訂單與審核流程</p>
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
          <Button onClick={() => navigate('/procurement/purchase-orders/create')}>新增採購單</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<PO>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          onRowClick={(r) => navigate(`/procurement/purchase-orders/${r.id}`)}
          emptyText="目前沒有採購訂單"
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
