import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, FormField } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface OrderItemRow {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export function OrderFormPage() {
  const navigate = useNavigate();

  const { data: productsData } = useFetch<any>('/products?limit=200', []);
  const products: Product[] = productsData?.data ?? productsData ?? [];

  const { data: customersData } = useFetch<any>('/customers?limit=200', []);
  const customers: Customer[] = customersData?.data ?? customersData ?? [];

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [shippingFee, setShippingFee] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [note, setNote] = useState('');
  const [shipping, setShipping] = useState({ name: '', phone: '', address: '', city: '', postalCode: '' });
  const [saving, setSaving] = useState(false);

  // 選擇客戶時自動帶入資訊
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerEmail(c.email ?? '');
      if (c.address) setShipping((s) => ({ ...s, name: c.name, address: c.address ?? '' }));
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleItemChange = (idx: number, field: string, value: string | number) => {
    const next = [...items];
    if (field === 'productId') {
      const p = products.find((p) => p.id === value);
      next[idx] = {
        ...next[idx]!,
        productId: value as string,
        productName: p?.name ?? '',
        unitPrice: p?.price ?? 0,
      };
    } else {
      (next[idx] as any)[field] = value;
    }
    setItems(next);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = subtotal + Number(shippingFee || 0) - Number(discount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('請至少新增一個商品');
      return;
    }
    setSaving(true);
    try {
      const order = await apiRequest<any>('/orders', 'POST', {
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingFee: Number(shippingFee || 0),
        discount: Number(discount || 0),
        shippingAddress: shipping.name ? {
          name: shipping.name,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city || undefined,
          postalCode: shipping.postalCode || undefined,
        } : undefined,
        note: note || undefined,
      });
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      alert(err.message || '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button onClick={() => navigate('/orders')} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
          &larr; 返回訂單列表
        </button>
        <h2 className="text-2xl font-bold text-gray-900">新增訂單</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 客戶資訊 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">客戶資訊</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="選擇客戶">
              <select className={inputClass} value={customerId} onChange={(e) => handleCustomerChange(e.target.value)}>
                <option value="">手動輸入</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                ))}
              </select>
            </FormField>
            <FormField label="客戶名稱" required>
              <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </FormField>
            <FormField label="Email">
              <input type="email" className={inputClass} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* 訂單品項 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">訂單品項</h3>
            <Button type="button" variant="ghost" onClick={handleAddItem}>+ 新增品項</Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              尚未新增品項，點擊「+ 新增品項」開始
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <select
                    className={`${inputClass} flex-1`}
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">選擇商品</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ''} — NT$ {Number(p.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500">數量</label>
                    <input
                      type="number"
                      className="w-20 rounded-md border border-gray-300 px-2 py-2 text-sm text-center"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-28 text-right">
                    NT$ {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-500 hover:text-red-700 cursor-pointer text-sm"
                  >
                    移除
                  </button>
                </div>
              ))}

              <div className="flex flex-col items-end gap-1 pt-3 border-t border-gray-200 text-sm">
                <div className="flex gap-4">
                  <span className="text-gray-500">小計</span>
                  <span className="w-28 text-right">NT$ {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">運費</span>
                  <input type="number" className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} min="0" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">折扣</span>
                  <input type="number" className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right" value={discount} onChange={(e) => setDiscount(e.target.value)} min="0" />
                </div>
                <div className="flex gap-4 pt-2 border-t border-gray-100 font-semibold">
                  <span>總計</span>
                  <span className="w-28 text-right">NT$ {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 收件資訊 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">收件資訊</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="收件人">
              <input className={inputClass} value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
            </FormField>
            <FormField label="電話">
              <input className={inputClass} value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="郵遞區號">
              <input className={inputClass} value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
            </FormField>
            <FormField label="城市">
              <input className={inputClass} value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
            </FormField>
            <FormField label="地址">
              <input className={inputClass} value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
            </FormField>
          </div>
        </div>

        {/* 備註 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <FormField label="備註">
            <textarea className={`${inputClass} h-20 resize-none`} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? '建立中...' : '建立訂單'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate('/orders')}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
