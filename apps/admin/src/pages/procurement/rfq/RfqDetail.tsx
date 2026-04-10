import { useState } from 'react';
import { useParams } from 'react-router';
import { Button, Card, RfqStatusBadge, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }

export function RfqDetailPage() {
  const { id } = useParams();
  const { data: rfq, loading, refetch } = useFetch<any>(`/procurement/rfq/${id}`, [id]);
  const { data: quotations } = useFetch<any[]>(`/procurement/rfq/${id}/compare`, [id]);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSend = async () => {
    setActionLoading(true);
    try {
      await apiRequest(`/procurement/rfq/${id}/send`, 'PATCH', {});
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAward = async (supplierId: string) => {
    if (!confirm('確認決標給此供應商？')) return;
    setActionLoading(true);
    try {
      await apiRequest(`/procurement/rfq/${id}/award`, 'PATCH', { supplierId });
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !rfq) {
    return <div className="py-20 text-center text-gray-500">載入中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{rfq.rfqNumber}</h2>
            <RfqStatusBadge status={rfq.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{rfq.title}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'draft' && (
            <Button loading={actionLoading} onClick={handleSend}>發送詢價</Button>
          )}
        </div>
      </div>

      {/* 詢價品項 */}
      <Card title="詢價品項">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">品項</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">規格</th>
              <th className="pb-2 text-right">數量</th>
              <th className="pb-2">單位</th>
            </tr>
          </thead>
          <tbody>
            {(rfq.items ?? []).map((item: any) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{item.productName}</td>
                <td className="py-2">{item.sku ?? '—'}</td>
                <td className="py-2">{item.specification ?? '—'}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 報價比較 */}
      {quotations && quotations.length > 0 && (
        <Card title="報價比較（按金額排序）">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">排名</th>
                <th className="pb-2">供應商</th>
                <th className="pb-2 text-right">報價金額</th>
                <th className="pb-2 text-right">交期（天）</th>
                <th className="pb-2">付款條件</th>
                <th className="pb-2">狀態</th>
                <th className="pb-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q: any, idx: number) => (
                <tr key={q.id} className={`border-b last:border-0 ${q.isAwarded ? 'bg-green-50' : ''}`}>
                  <td className="py-2 font-bold">{idx + 1}</td>
                  <td className="py-2 font-medium">{q.supplierName}</td>
                  <td className="py-2 text-right">{formatNTD(q.totalAmount)}</td>
                  <td className="py-2 text-right">{q.leadTimeDays ?? '—'}</td>
                  <td className="py-2">{q.paymentTerms ?? '—'}</td>
                  <td className="py-2">
                    {q.isAwarded ? <Badge variant="success">得標</Badge> : <Badge variant="neutral">未得標</Badge>}
                  </td>
                  <td className="py-2">
                    {rfq.status === 'quoted' && !q.isAwarded && (
                      <Button size="sm" loading={actionLoading} onClick={() => handleAward(q.supplierId)}>
                        決標
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {rfq.note && (
        <Card title="備註">
          <p className="text-sm text-gray-700">{rfq.note}</p>
        </Card>
      )}
    </div>
  );
}
