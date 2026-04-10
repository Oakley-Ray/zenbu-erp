import { useState } from 'react';
import { Link } from 'react-router';
import { useFetch } from '@/hooks/useApi';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Quote {
  id: string;
  quoteNumber: string;
  destination: { country: string };
  totalChargeableWeightKg: number;
  totalAmount: number;
  status: 'draft' | 'quoted' | 'selected' | 'expired';
  createdAt: string;
}

interface QuoteListResponse {
  data: Quote[];
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
  });
}

const statusMap: Record<string, { variant: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  draft: { variant: 'neutral', label: '草稿' },
  quoted: { variant: 'info', label: '已報價' },
  selected: { variant: 'success', label: '已選取' },
  expired: { variant: 'danger', label: '已過期' },
};

export function QuoteListPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, loading } = useFetch<QuoteListResponse>(
    `/logistics/quotes?page=${page}&limit=${limit}`,
    [page],
  );

  const columns = [
    { key: 'quoteNumber', title: '報價編號' },
    {
      key: 'destination',
      title: '目的地',
      render: (r: Quote) => r.destination.country,
    },
    {
      key: 'totalChargeableWeightKg',
      title: '總重',
      render: (r: Quote) => `${r.totalChargeableWeightKg} kg`,
    },
    {
      key: 'totalAmount',
      title: '報價金額',
      render: (r: Quote) => formatNTD(r.totalAmount),
    },
    {
      key: 'status',
      title: '狀態',
      render: (r: Quote) => {
        const s = statusMap[r.status] ?? { variant: 'neutral' as const, label: r.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (r: Quote) => formatDate(r.createdAt),
    },
    {
      key: 'actions',
      title: '操作',
      render: (r: Quote) => (
        <Link to={`/logistics/${r.id}`} className="text-primary-600 hover:underline text-sm">
          查看
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">物流報價</h2>
          <p className="mt-1 text-sm text-gray-500">管理所有國際物流報價</p>
        </div>
        <Link to="/logistics/create">
          <Button>建立報價</Button>
        </Link>
      </div>

      <Card>
        <Table<Quote>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          emptyText="尚無報價資料"
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
