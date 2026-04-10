import { useState } from 'react';
import { useFetch } from '@/hooks/useApi';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Card } from '@/components/ui/Card';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

interface CustomerListResponse {
  data: Customer[];
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

export function CustomerListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const { data, loading } = useFetch<CustomerListResponse>(
    `/ecommerce/admin/customers?page=${page}&limit=${limit}${searchParam}`,
    [page, search],
  );

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const columns = [
    { key: 'name', title: '姓名' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: '電話' },
    {
      key: 'orderCount',
      title: '訂單數',
      render: (r: Customer) => `${r.orderCount} 筆`,
    },
    {
      key: 'totalSpent',
      title: '累計消費',
      render: (r: Customer) => formatNTD(r.totalSpent),
    },
    {
      key: 'createdAt',
      title: '註冊時間',
      render: (r: Customer) => formatDate(r.createdAt),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">客戶管理</h2>
        <p className="mt-1 text-sm text-gray-500">瀏覽與搜尋所有客戶資料</p>
      </div>

      {/* 搜尋列 */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜尋姓名或 Email..."
          className="block w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        />
        <button
          onClick={handleSearch}
          className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          搜尋
        </button>
      </div>

      <Card>
        <Table<Customer>
          columns={columns}
          data={data?.data ?? []}
          loading={loading}
          emptyText="尚無客戶資料"
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
