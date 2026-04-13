import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, Button, OrderStatusBadge, PaymentStatusBadge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { ShipmentPanel } from '../shipments/ShipmentPanel';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: {
    name?: string;
    recipient?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  note?: string;
}

function formatNTD(value: number): string {
  return `NT$ ${value.toLocaleString('zh-TW')}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, loading, error, refetch } = useFetch<Order>(`/orders/${id}`, [id]);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === 'cancelled') {
      const confirmed = window.confirm('確定要取消此訂單嗎？此操作無法復原。');
      if (!confirmed) return;
    }

    try {
      setActionLoading(true);
      await apiRequest(`/orders/${id}/status`, 'PATCH', { status: newStatus });
      refetch();
    } catch (err) {
      alert(`操作失敗：${(err as Error).message}`);
    } finally {
      setActionLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-600 text-lg mb-4">載入失敗：{error}</p>
        <Button onClick={refetch}>重新載入</Button>
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">載入中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-flex items-center gap-1 transition-colors"
          >
            &larr; 返回訂單列表
          </button>
          <h2 className="text-2xl font-bold text-gray-900">訂單 {order.orderNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'pending' && (
            <Button
              onClick={() => handleStatusChange('confirmed')}
              loading={actionLoading}
            >
              確認訂單
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button
              onClick={() => handleStatusChange('processing')}
              loading={actionLoading}
            >
              開始處理
            </Button>
          )}
          {order.status === 'processing' && (
            <Button
              onClick={() => handleStatusChange('shipped')}
              loading={actionLoading}
            >
              標記出貨
            </Button>
          )}
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <Button
              variant="danger"
              onClick={() => handleStatusChange('cancelled')}
              loading={actionLoading}
            >
              取消訂單
            </Button>
          )}
        </div>
      </div>

      {/* 訂單資訊 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="訂單資訊">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">訂單編號</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-gray-500">訂單狀態</dt>
              <dd className="mt-0.5"><OrderStatusBadge status={order.status} /></dd>
            </div>
            <div>
              <dt className="text-gray-500">付款狀態</dt>
              <dd className="mt-0.5"><PaymentStatusBadge status={order.paymentStatus} /></dd>
            </div>
            <div>
              <dt className="text-gray-500">建立時間</dt>
              <dd className="mt-0.5 text-gray-900">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">更新時間</dt>
              <dd className="mt-0.5 text-gray-900">{formatDateTime(order.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">客戶</dt>
              <dd className="mt-0.5 text-gray-900">{order.customerName ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="收件資訊">
          <dl className="grid grid-cols-1 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">收件人</dt>
              <dd className="mt-0.5 text-gray-900">
                {order.shippingAddress?.recipient ?? order.shippingAddress?.name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">電話</dt>
              <dd className="mt-0.5 text-gray-900">{order.shippingAddress?.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">地址</dt>
              <dd className="mt-0.5 text-gray-900">
                {[
                  order.shippingAddress?.postalCode,
                  order.shippingAddress?.city,
                  order.shippingAddress?.address,
                ].filter(Boolean).join(' ') || '—'}
              </dd>
            </div>
          </dl>
          {order.note && (
            <div className="mt-4 pt-3 border-t border-gray-100 text-sm">
              <dt className="text-gray-500">備註</dt>
              <dd className="mt-0.5 text-gray-900">{order.note}</dd>
            </div>
          )}
        </Card>
      </div>

      {/* 訂單商品 */}
      <Card title="訂單商品">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  商品名稱
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  數量
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  單價
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  小計
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatNTD(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">{formatNTD(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 金額摘要 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <div className="flex items-center gap-8">
              <span className="text-gray-500">商品小計</span>
              <span className="text-gray-900 w-28 text-right">{formatNTD(order.subtotal)}</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-gray-500">運費</span>
              <span className="text-gray-900 w-28 text-right">{formatNTD(order.shippingFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center gap-8">
                <span className="text-gray-500">折扣</span>
                <span className="text-red-600 w-28 text-right">-{formatNTD(order.discount)}</span>
              </div>
            )}
            <div className="flex items-center gap-8 pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">總計</span>
              <span className="font-bold text-lg text-gray-900 w-28 text-right">
                {formatNTD(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 出貨管理 — 訂單確認後才顯示 */}
      {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
        <ShipmentPanel
          orderId={order.id}
          orderItems={order.items.map((i) => ({
            id: i.id,
            productId: (i as any).productId ?? i.id,
            productName: i.productName,
            sku: (i as any).sku,
            quantity: i.quantity,
          }))}
          shippingAddress={order.shippingAddress}
        />
      )}
    </div>
  );
}
