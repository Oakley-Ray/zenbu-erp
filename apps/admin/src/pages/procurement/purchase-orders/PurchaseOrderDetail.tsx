import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, PoStatusBadge, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { useRole } from '@/hooks/useRole';

const APPROVAL_LABELS: Record<string, string> = { manager: '主管', director: '經理', vp: '副總' };

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { data: po, loading, refetch } = useFetch<any>(`/procurement/purchase-orders/${id}`, [id]);
  const { data: amendments } = useFetch<any[]>(`/procurement/purchase-orders/${id}/amendments`, [id]);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      await apiRequest(`/procurement/purchase-orders/${id}/${action}`, 'PATCH', body ?? {});
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !po) {
    return <div className="py-20 text-center text-gray-500">載入中...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{po.poNumber}</h2>
            <PoStatusBadge status={po.status} />
            {po.version > 1 && <Badge variant="info">v{po.version}</Badge>}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            供應商：{po.supplier?.name ?? '—'} | 建立時間：{formatDate(po.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {po.status === 'draft' && (
            <Button loading={actionLoading} onClick={() => handleAction('submit')}>送審</Button>
          )}
          {po.status === 'pending_approval' && isAdmin && (
            <>
              <Button loading={actionLoading} onClick={() => handleAction('approve')}>核准</Button>
              <Button variant="danger" loading={actionLoading} onClick={() => {
                const note = prompt('退回原因：');
                if (note) handleAction('reject', { note });
              }}>退回</Button>
            </>
          )}
          {po.status === 'approved' && (
            <Button loading={actionLoading} onClick={() => handleAction('status', { status: 'ordered' })}>
              確認下單
            </Button>
          )}
          {['ordered', 'partial_received'].includes(po.status) && (
            <Button variant="secondary" onClick={() => navigate(`/procurement/goods-receipts/create?poId=${po.id}`)}>
              建立收貨單
            </Button>
          )}
          {po.status !== 'closed' && po.status !== 'cancelled' && (
            <Button variant="danger" loading={actionLoading} onClick={() => handleAction('status', { status: 'cancelled' })}>
              取消
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500">總金額</p>
          <p className="text-xl font-bold">{formatNTD(po.totalAmount)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">審核層級</p>
          <p className="text-xl font-bold">{APPROVAL_LABELS[po.approvalLevel] ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">預期交期</p>
          <p className="text-xl font-bold">{formatDate(po.expectedDeliveryDate)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">付款條件</p>
          <p className="text-xl font-bold">{po.paymentTerms ?? '—'}</p>
        </Card>
      </div>

      {/* 審核資訊 */}
      {po.approvedBy && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border text-sm">
          <span className="text-gray-500">審核人：</span>{po.approvedBy}
          <span className="ml-4 text-gray-500">審核時間：</span>{formatDate(po.approvedAt)}
          {po.approvalNote && (
            <div className="mt-2"><span className="text-gray-500">備註：</span>{po.approvalNote}</div>
          )}
        </div>
      )}

      {/* 品項明細 */}
      <Card title="品項明細">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">品項</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">規格</th>
              <th className="pb-2 text-right">單價</th>
              <th className="pb-2 text-right">訂購數量</th>
              <th className="pb-2 text-right">已到貨</th>
              <th className="pb-2 text-right">未交</th>
              <th className="pb-2 text-right">小計</th>
            </tr>
          </thead>
          <tbody>
            {(po.items ?? []).map((item: any) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{item.productName}</td>
                <td className="py-2">{item.sku ?? '—'}</td>
                <td className="py-2">{item.specification ?? '—'}</td>
                <td className="py-2 text-right">{formatNTD(item.unitPrice)}</td>
                <td className="py-2 text-right">{item.orderedQty} {item.unit}</td>
                <td className="py-2 text-right">{item.receivedQty ?? 0}</td>
                <td className="py-2 text-right font-medium text-orange-600">
                  {item.orderedQty - (item.receivedQty ?? 0)}
                </td>
                <td className="py-2 text-right font-medium">{formatNTD(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-bold">
              <td colSpan={7} className="py-2 text-right">小計</td>
              <td className="py-2 text-right">{formatNTD(po.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={7} className="py-1 text-right text-gray-500">稅額</td>
              <td className="py-1 text-right">{formatNTD(po.tax)}</td>
            </tr>
            <tr className="font-bold text-lg">
              <td colSpan={7} className="py-2 text-right">總計</td>
              <td className="py-2 text-right">{formatNTD(po.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {/* 變更歷程 */}
      {amendments && amendments.length > 0 && (
        <Card title="變更歷程">
          <div className="space-y-3">
            {amendments.map((a: any) => (
              <div key={a.id} className="p-3 bg-gray-50 rounded-md text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">v{a.fromVersion} → v{a.toVersion}</span>
                  <span className="text-gray-500">{formatDate(a.createdAt)}</span>
                </div>
                <p className="mt-1 text-gray-700">{a.changeDescription}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {po.note && (
        <Card title="備註">
          <p className="text-sm text-gray-700">{po.note}</p>
        </Card>
      )}
    </div>
  );
}
