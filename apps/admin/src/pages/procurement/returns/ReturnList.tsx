import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, Badge, ClaimStatusBadge, Button } from '@/components/ui';
import { useFetch } from '@/hooks/useApi';

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  supplierId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
}

interface Claim {
  id: string;
  claimNumber: string;
  claimType: string;
  amount: number;
  settledAmount?: number;
  status: string;
  createdAt: string;
}

const RETURN_STATUS_MAP: Record<string, { variant: any; label: string }> = {
  draft: { variant: 'neutral', label: '草稿' },
  submitted: { variant: 'warning', label: '已提交' },
  confirmed: { variant: 'info', label: '已確認' },
  completed: { variant: 'success', label: '已完成' },
};

const CLAIM_TYPE_MAP: Record<string, string> = {
  quality_defect: '品質不良',
  late_delivery: '延遲交貨',
  shortage: '短交',
  other: '其他',
};

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function ReturnListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'returns' | 'claims'>('returns');
  const [page, setPage] = useState(1);

  const { data: returnsData, loading: returnsLoading } = useFetch<any>(
    `/procurement/returns?page=${page}&limit=20`,
    [page],
  );
  const { data: claimsData, loading: claimsLoading } = useFetch<any>(
    `/procurement/claims?page=${page}&limit=20`,
    [page],
  );

  const returnColumns = [
    { key: 'returnNumber', title: '退貨單號', render: (r: PurchaseReturn) => <span className="font-medium">{r.returnNumber}</span> },
    { key: 'itemCount', title: '品項數', render: (r: PurchaseReturn) => r.items?.length ?? 0 },
    { key: 'totalAmount', title: '金額', render: (r: PurchaseReturn) => formatNTD(r.totalAmount) },
    {
      key: 'status', title: '狀態', render: (r: PurchaseReturn) => {
        const s = RETURN_STATUS_MAP[r.status] ?? { variant: 'neutral', label: r.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    { key: 'createdAt', title: '建立時間', render: (r: PurchaseReturn) => formatDate(r.createdAt) },
  ];

  const claimColumns = [
    { key: 'claimNumber', title: '索賠單號', render: (r: Claim) => <span className="font-medium">{r.claimNumber}</span> },
    { key: 'claimType', title: '類型', render: (r: Claim) => CLAIM_TYPE_MAP[r.claimType] ?? r.claimType },
    { key: 'amount', title: '索賠金額', render: (r: Claim) => formatNTD(r.amount) },
    { key: 'settledAmount', title: '確認金額', render: (r: Claim) => r.settledAmount ? formatNTD(r.settledAmount) : '—' },
    { key: 'status', title: '狀態', render: (r: Claim) => <ClaimStatusBadge status={r.status} /> },
    { key: 'createdAt', title: '建立時間', render: (r: Claim) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">退貨與索賠</h2>
          <p className="mt-1 text-sm text-gray-500">管理採購退貨與供應商索賠</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'returns' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setTab('returns'); setPage(1); }}
        >
          退貨單
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'claims' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setTab('claims'); setPage(1); }}
        >
          索賠單
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {tab === 'returns' ? (
          <>
            <Table<PurchaseReturn>
              columns={returnColumns}
              data={returnsData?.data ?? []}
              loading={returnsLoading}
              emptyText="目前沒有退貨紀錄"
            />
            {returnsData && (
              <Pagination
                current={returnsData.meta?.page ?? 1}
                total={returnsData.meta?.total ?? 0}
                pageSize={returnsData.meta?.limit ?? 20}
                onChange={setPage}
              />
            )}
          </>
        ) : (
          <>
            <Table<Claim>
              columns={claimColumns}
              data={claimsData?.data ?? []}
              loading={claimsLoading}
              emptyText="目前沒有索賠紀錄"
            />
            {claimsData && (
              <Pagination
                current={claimsData.meta?.page ?? 1}
                total={claimsData.meta?.total ?? 0}
                pageSize={claimsData.meta?.limit ?? 20}
                onChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
