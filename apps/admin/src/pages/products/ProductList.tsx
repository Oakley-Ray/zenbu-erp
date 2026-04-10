import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, Badge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  status: 'active' | 'draft' | 'archived';
  categoryName: string;
}

interface ProductListResponse {
  data: Product[];
  meta: { total: number };
}

const STATUS_OPTIONS = [
  { value: '', label: '全部狀態' },
  { value: 'active', label: '上架中' },
  { value: 'draft', label: '草稿' },
  { value: 'archived', label: '已下架' },
] as const;

const statusMap: Record<string, { variant: 'success' | 'neutral' | 'warning'; label: string }> = {
  active: { variant: 'success', label: '上架中' },
  draft: { variant: 'neutral', label: '草稿' },
  archived: { variant: 'warning', label: '已下架' },
};

function formatNTD(value: number): string {
  return `NT$ ${value.toLocaleString('zh-TW')}`;
}

export function ProductListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParts = [`page=${page}`, 'limit=20'];
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  if (statusFilter) queryParts.push(`status=${statusFilter}`);
  const query = queryParts.join('&');

  const { data, loading } = useFetch<ProductListResponse>(
    `/products?${query}`,
    [page, search, statusFilter],
  );

  const products = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns = [
    { key: 'name', title: '商品名稱' },
    { key: 'sku', title: 'SKU' },
    {
      key: 'price',
      title: '售價',
      render: (r: Product) => formatNTD(r.price),
    },
    {
      key: 'costPrice',
      title: '成本',
      render: (r: Product) => formatNTD(r.costPrice),
    },
    {
      key: 'status',
      title: '狀態',
      render: (r: Product) => {
        const s = statusMap[r.status] ?? { variant: 'neutral' as const, label: r.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    { key: 'categoryName', title: '分類' },
    {
      key: 'actions',
      title: '操作',
      render: (r: Product) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products/edit/${r.id}`);
          }}
        >
          編輯
        </Button>
      ),
    },
  ];

  /** 搜尋時重置頁碼 */
  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
        <Button onClick={() => navigate('/products/create')}>新增商品</Button>
      </div>

      {/* 篩選列 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="搜尋商品名稱或 SKU..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full sm:w-72 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="block w-full sm:w-44 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<Product> columns={columns} data={products} loading={loading} />
        <Pagination current={page} total={total} pageSize={20} onChange={setPage} />
      </div>
    </div>
  );
}
