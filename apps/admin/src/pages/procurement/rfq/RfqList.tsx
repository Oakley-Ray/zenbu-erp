import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, RfqStatusBadge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface Rfq {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  deadline?: string;
  invitedSupplierIds: string[];
  items: any[];
  createdAt: string;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function RfqListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, loading, error, refetch } = useFetch<any>(
    `/procurement/rfq?${params}`,
    [page, statusFilter],
  );

  const columns = [
    { key: 'rfqNumber', title: '詢價單號', render: (r: Rfq) => <span className="font-medium text-gray-900">{r.rfqNumber}</span> },
    { key: 'title', title: '標題', render: (r: Rfq) => r.title },
    { key: 'itemCount', title: '品項數', render: (r: Rfq) => r.items?.length ?? 0 },
    { key: 'supplierCount', title: '邀請供應商', render: (r: Rfq) => r.invitedSupplierIds?.length ?? 0 },
    { key: 'status', title: '狀態', render: (r: Rfq) => <RfqStatusBadge status={r.status} /> },
    { key: 'deadline', title: '截止日期', render: (r: Rfq) => formatDate(r.deadline) },
    { key: 'createdAt', title: '建立時間', render: (r: Rfq) => formatDate(r.createdAt) },
    {
      key: 'actions',
      title: '操作',
      render: (r: Rfq) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/procurement/rfq/${r.id}`); }}>
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
          <h2 className="text-2xl font-bold text-gray-900">詢價/報價 (RFQ)</h2>
          <p className="mt-1 text-sm text-gray-500">管理詢價單、比價與決標</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部狀態</option>
            <option value="draft">草稿</option>
            <option value="sent">已發送</option>
            <option value="quoted">已報價</option>
            <option value="closed">已結案</option>
          </select>
          <Button onClick={() => navigate('/procurement/rfq/create')}>新增詢價單</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<Rfq>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          onRowClick={(r) => navigate(`/procurement/rfq/${r.id}`)}
          emptyText="目前沒有詢價紀錄"
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
