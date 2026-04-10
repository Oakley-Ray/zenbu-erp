import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Badge, SupplierStatusBadge, Card } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

export function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: supplier, loading, refetch } = useFetch<any>(`/procurement/suppliers/${id}`, [id]);
  const { data: contracts } = useFetch<any[]>(`/procurement/suppliers/${id}/contracts`, [id]);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBlacklist = async () => {
    const reason = prompt('請輸入黑名單原因：');
    if (!reason) return;
    setActionLoading(true);
    try {
      await apiRequest(`/procurement/suppliers/${id}`, 'PATCH', {
        status: 'blacklisted',
        blacklistReason: reason,
      });
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await apiRequest(`/procurement/suppliers/${id}`, 'PATCH', { status: 'active' });
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !supplier) {
    return <div className="py-20 text-center text-gray-500">載入中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{supplier.supplierCode}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(`/procurement/suppliers/edit/${id}`)}>
            編輯
          </Button>
          {supplier.status === 'active' && (
            <Button variant="danger" loading={actionLoading} onClick={handleBlacklist}>
              列入黑名單
            </Button>
          )}
          {supplier.status === 'blacklisted' && (
            <Button loading={actionLoading} onClick={handleActivate}>
              恢復有效
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card title="基本資訊">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">狀態</dt>
              <dd><SupplierStatusBadge status={supplier.status} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">聯絡人</dt>
              <dd>{supplier.contactPerson ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">電話</dt>
              <dd>{supplier.contactPhone ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd>{supplier.contactEmail ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">統一編號</dt>
              <dd>{supplier.taxId ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">付款條件</dt>
              <dd>{supplier.paymentTerms ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="評分">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">綜合評分</dt>
              <dd className="text-xl font-bold text-gray-900">{Number(supplier.overallScore).toFixed(1)}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">品質合格率</dt>
              <dd><Badge variant={Number(supplier.qualityScore) >= 80 ? 'success' : 'warning'}>{Number(supplier.qualityScore).toFixed(1)}%</Badge></dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">交期達成率</dt>
              <dd><Badge variant={Number(supplier.deliveryScore) >= 80 ? 'success' : 'warning'}>{Number(supplier.deliveryScore).toFixed(1)}%</Badge></dd>
            </div>
          </dl>
        </Card>

        <Card title="地址與備註">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">地址</dt>
              <dd>{supplier.address ?? '—'}</dd>
            </div>
            {supplier.blacklistReason && (
              <div>
                <dt className="text-red-500 mb-1">黑名單原因</dt>
                <dd className="text-red-700">{supplier.blacklistReason}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 mb-1">備註</dt>
              <dd>{supplier.note ?? '—'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* 合約列表 */}
      <Card title="合約記錄">
        {contracts && contracts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">合約編號</th>
                <th className="pb-2">標題</th>
                <th className="pb-2">期間</th>
                <th className="pb-2">金額</th>
                <th className="pb-2">狀態</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{c.contractNumber}</td>
                  <td className="py-2">{c.title ?? '—'}</td>
                  <td className="py-2">{c.startDate?.slice(0, 10)} ~ {c.endDate?.slice(0, 10)}</td>
                  <td className="py-2">{c.amount ? `NT$ ${Number(c.amount).toLocaleString()}` : '—'}</td>
                  <td className="py-2"><Badge variant={c.isActive ? 'success' : 'neutral'}>{c.isActive ? '有效' : '已過期'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">尚無合約記錄</p>
        )}
      </Card>
    </div>
  );
}
