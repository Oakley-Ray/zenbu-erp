import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, GrStatusBadge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface GR {
  id: string;
  grNumber: string;
  purchaseOrder?: { poNumber: string };
  status: string;
  receivedDate?: string;
  createdAt: string;
  items: any[];
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function GoodsReceiptListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);

  const { data, loading, error, refetch } = useFetch<any>(
    `/procurement/goods-receipts?${params}`,
    [page, statusFilter],
  );

  const columns = [
    {
      key: 'grNumber',
      title: '收貨單號',
      render: (r: GR) => <span className="font-medium text-gray-900">{r.grNumber}</span>,
    },
    { key: 'poNumber', title: '採購單號', render: (r: GR) => r.purchaseOrder?.poNumber ?? '—' },
    { key: 'itemCount', title: '品項數', render: (r: GR) => r.items?.length ?? 0 },
    {
      key: 'totalReceived',
      title: '總收貨量',
      render: (r: GR) => r.items?.reduce((s: number, i: any) => s + (i.receivedQty ?? 0), 0) ?? 0,
    },
    { key: 'status', title: '狀態', render: (r: GR) => <GrStatusBadge status={r.status} /> },
    { key: 'receivedDate', title: '收貨日期', render: (r: GR) => formatDate(r.receivedDate) },
    {
      key: 'actions',
      title: '操作',
      render: (r: GR) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/procurement/goods-receipts/${r.id}`); }}>
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
          <h2 className="text-2xl font-bold text-gray-900">收貨管理</h2>
          <p className="mt-1 text-sm text-gray-500">收貨作業與品質檢驗</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部狀態</option>
            <option value="draft">草稿</option>
            <option value="inspecting">檢驗中</option>
            <option value="completed">已完成</option>
          </select>
          <Button onClick={() => navigate('/procurement/goods-receipts/create')}>新增收貨單</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<GR>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          onRowClick={(r) => navigate(`/procurement/goods-receipts/${r.id}`)}
          emptyText="目前沒有收貨紀錄"
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
