import { useState } from 'react';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Transaction {
  id: string;
  transactionId: string;
  orderNumber: string;
  provider: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface TransactionListResponse {
  data: Transaction[];
  total: number;
}

function formatNTD(value: number): string {
  return `NT$ ${value.toLocaleString('zh-TW')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransactionListPage() {
  const [page, setPage] = useState(1);
  const [orderId, setOrderId] = useState('');
  const [filterOrderId, setFilterOrderId] = useState('');
  const [refunding, setRefunding] = useState<string | null>(null);
  const limit = 20;

  const orderParam = filterOrderId ? `&orderId=${encodeURIComponent(filterOrderId)}` : '';
  const { data, loading, refetch } = useFetch<TransactionListResponse>(
    `/payments?page=${page}&limit=${limit}${orderParam}`,
    [page, filterOrderId],
  );

  const handleFilter = () => {
    setPage(1);
    setFilterOrderId(orderId);
  };

  const handleRefund = async (transactionId: string) => {
    if (!window.confirm('確定要對此交易進行退款嗎？此操作無法復原。')) return;

    setRefunding(transactionId);
    try {
      await apiRequest(`/payments/${transactionId}/refund`, 'POST');
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : '退款失敗');
    } finally {
      setRefunding(null);
    }
  };

  const columns = [
    { key: 'transactionId', title: '交易編號' },
    { key: 'orderNumber', title: '訂單編號' },
    { key: 'provider', title: '金流商' },
    {
      key: 'amount',
      title: '金額',
      render: (r: Transaction) => formatNTD(r.amount),
    },
    {
      key: 'status',
      title: '狀態',
      render: (r: Transaction) => <PaymentStatusBadge status={r.status} />,
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (r: Transaction) => formatDate(r.createdAt),
    },
    {
      key: 'actions',
      title: '操作',
      render: (r: Transaction) =>
        r.status === 'success' ? (
          <Button
            variant="danger"
            size="sm"
            loading={refunding === r.transactionId}
            onClick={() => handleRefund(r.transactionId)}
          >
            退款
          </Button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">交易記錄</h2>
        <p className="mt-1 text-sm text-gray-500">瀏覽所有金流交易紀錄</p>
      </div>

      {/* 篩選 */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          placeholder="依訂單編號篩選..."
          className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        />
        <Button variant="secondary" onClick={handleFilter}>
          篩選
        </Button>
        {filterOrderId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOrderId('');
              setFilterOrderId('');
              setPage(1);
            }}
          >
            清除
          </Button>
        )}
      </div>

      <Card>
        <Table<Transaction>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          emptyText="尚無交易記錄"
        />
        {data && (
          <Pagination
            current={page}
            total={data.total}
            pageSize={limit}
            onChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}
