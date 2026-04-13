import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, OrderStatusBadge, PaymentStatusBadge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface Order {
  id: string;
  orderNumber: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'pending', label: '待確認' },
  { value: 'confirmed', label: '已確認' },
  { value: 'shipped', label: '已出貨' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
] as const;

function formatNTD(value: number): string {
  return `NT$ ${value.toLocaleString('zh-TW')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function OrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const query = statusFilter
    ? `/orders?page=${page}&limit=20&status=${statusFilter}`
    : `/orders?page=${page}&limit=20`;

  const { data, loading, error, refetch } = useFetch<OrderListResponse>(query, [page, statusFilter]);

  const columns = [
    {
      key: 'orderNumber',
      title: '訂單編號',
      render: (record: Order) => (
        <span className="font-medium text-gray-900">{record.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      title: '客戶',
      render: (record: Order) => record.customerName ?? '—',
    },
    {
      key: 'totalAmount',
      title: '金額',
      render: (record: Order) => formatNTD(record.totalAmount),
    },
    {
      key: 'status',
      title: '訂單狀態',
      render: (record: Order) => <OrderStatusBadge status={record.status} />,
    },
    {
      key: 'paymentStatus',
      title: '付款狀態',
      render: (record: Order) => <PaymentStatusBadge status={record.paymentStatus} />,
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (record: Order) => formatDate(record.createdAt),
    },
    {
      key: 'actions',
      title: '操作',
      render: (record: Order) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${record.id}`);
          }}
        >
          查看詳情
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
      {/* 頁面標題與篩選 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">訂單管理</h2>
          <p className="mt-1 text-sm text-gray-500">管理所有客戶訂單</p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button onClick={() => navigate('/orders/create')}>新增訂單</Button>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<Order>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          onRowClick={(record) => navigate(`/orders/${record.id}`)}
          emptyText="目前沒有訂單"
        />
        {data && (
          <Pagination
            current={data.page}
            total={data.total}
            pageSize={data.limit}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
