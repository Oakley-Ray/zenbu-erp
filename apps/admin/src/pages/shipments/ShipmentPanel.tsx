import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface ShipmentItem {
  id: string;
  productName: string;
  sku?: string;
  quantity: number;
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  carrier?: string;
  shippingMethod: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  note?: string;
  items: ShipmentItem[];
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待處理',
  picked: '已揀貨',
  packed: '已包裝',
  shipped: '已出貨',
  in_transit: '運送中',
  delivered: '已送達',
};

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  pending: 'warning',
  picked: 'info',
  packed: 'info',
  shipped: 'info',
  in_transit: 'info',
  delivered: 'success',
};

const SHIPPING_METHODS = [
  { value: 'delivery', label: '宅配' },
  { value: 'store_pickup', label: '超商取貨' },
  { value: 'self_pickup', label: '自取' },
];

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function ShipmentPanel({ orderId, orderItems, shippingAddress }: {
  orderId: string;
  orderItems: OrderItem[];
  shippingAddress?: { name?: string; phone?: string; address?: string; city?: string; postalCode?: string };
}) {
  const { data: shipments, refetch } = useFetch<Shipment[]>(
    `/shipments/by-order/${orderId}`,
    [orderId],
  );

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    recipientName: shippingAddress?.name ?? '',
    recipientPhone: shippingAddress?.phone ?? '',
    recipientAddress: [shippingAddress?.postalCode, shippingAddress?.city, shippingAddress?.address].filter(Boolean).join(' '),
    carrier: '',
    shippingMethod: 'delivery',
    trackingNumber: '',
    note: '',
    selectedItems: orderItems.map((i) => ({ ...i, shipQty: i.quantity })),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/shipments', 'POST', {
        orderId,
        items: form.selectedItems
          .filter((i) => i.shipQty > 0)
          .map((i) => ({
            orderItemId: i.id,
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: i.shipQty,
          })),
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
        recipientAddress: form.recipientAddress,
        carrier: form.carrier || undefined,
        shippingMethod: form.shippingMethod,
        trackingNumber: form.trackingNumber || undefined,
        note: form.note || undefined,
      });
      setShowForm(false);
      refetch();
    } catch (err: any) {
      alert(err.message || '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiRequest(`/shipments/${id}/status`, 'PATCH', { status });
      refetch();
    } catch (err: any) {
      alert(err.message || '更新失敗');
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">出貨管理</h3>
        <Button onClick={() => setShowForm(true)}>建立出貨單</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-700">新出貨單</h4>

          {/* 收件資訊 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">收件人</label>
              <input className={inputClass} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-500">電話</label>
              <input className={inputClass} value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-gray-500">出貨方式</label>
              <select className={inputClass} value={form.shippingMethod} onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}>
                {SHIPPING_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">地址</label>
            <input className={inputClass} value={form.recipientAddress} onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">物流商</label>
              <input className={inputClass} value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="黑貓/新竹物流/..." />
            </div>
            <div>
              <label className="text-xs text-gray-500">追蹤號碼</label>
              <input className={inputClass} value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} placeholder="選填，可稍後補" />
            </div>
          </div>

          {/* 出貨品項 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">出貨品項</label>
            <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
              {form.selectedItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 text-sm">{item.productName}</span>
                  <span className="text-xs text-gray-400">訂購 {item.quantity}</span>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500">出貨</label>
                    <input
                      type="number"
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center"
                      value={item.shipQty}
                      onChange={(e) => {
                        const next = [...form.selectedItems];
                        next[idx] = { ...next[idx]!, shipQty: Math.min(Number(e.target.value), item.quantity) };
                        setForm({ ...form, selectedItems: next });
                      }}
                      min="0"
                      max={item.quantity}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">備註</label>
            <input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? '建立中...' : '建立出貨單'}</Button>
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      {/* 出貨單列表 */}
      {(!shipments || shipments.length === 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 py-8 text-center text-gray-400 text-sm">
          尚未建立出貨單
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{s.shipmentNumber}</span>
                  <Badge variant={STATUS_VARIANT[s.status] ?? 'neutral'}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {s.status === 'pending' && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(s.id, 'picked')}>揀貨完成</Button>
                  )}
                  {s.status === 'picked' && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(s.id, 'packed')}>包裝完成</Button>
                  )}
                  {s.status === 'packed' && (
                    <Button size="sm" onClick={() => handleStatusChange(s.id, 'shipped')}>確認出貨</Button>
                  )}
                  {s.status === 'shipped' && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(s.id, 'in_transit')}>已交給物流</Button>
                  )}
                  {s.status === 'in_transit' && (
                    <Button size="sm" onClick={() => handleStatusChange(s.id, 'delivered')}>已送達</Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">收件人：</span>
                  <span>{s.recipientName} {s.recipientPhone}</span>
                </div>
                <div>
                  <span className="text-gray-500">地址：</span>
                  <span>{s.recipientAddress}</span>
                </div>
                <div>
                  <span className="text-gray-500">物流：</span>
                  <span>{s.carrier ?? '—'} {s.trackingNumber ? `#${s.trackingNumber}` : ''}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <span key={item.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {item.productName} x{item.quantity}
                  </span>
                ))}
              </div>

              {(s.shippedAt || s.deliveredAt) && (
                <div className="mt-2 text-xs text-gray-400">
                  {s.shippedAt && <span>出貨：{formatDate(s.shippedAt)}</span>}
                  {s.deliveredAt && <span className="ml-3">送達：{formatDate(s.deliveredAt)}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
