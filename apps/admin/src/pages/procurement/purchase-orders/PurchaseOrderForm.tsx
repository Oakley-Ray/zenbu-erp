import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button, FormField, inputClass, selectClass, textareaClass } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface ItemRow {
  productId?: string;
  productName: string;
  sku: string;
  specification: string;
  unitPrice: number;
  orderedQty: number;
  unit: string;
}

const emptyItem = (): ItemRow => ({
  productName: '',
  sku: '',
  specification: '',
  unitPrice: 0,
  orderedQty: 1,
  unit: 'pcs',
});

export function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [tax, setTax] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: suppliers } = useFetch<any>('/procurement/suppliers?limit=100&status=active', []);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.orderedQty, 0);
  const totalAmount = subtotal + tax;

  const updateItem = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) { setError('請選擇供應商'); return; }
    setSaving(true);
    setError('');
    try {
      await apiRequest('/procurement/purchase-orders', 'POST', {
        supplierId,
        items: items.map((i) => ({
          productName: i.productName,
          sku: i.sku || undefined,
          specification: i.specification || undefined,
          unitPrice: i.unitPrice,
          orderedQty: i.orderedQty,
          unit: i.unit,
        })),
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        paymentTerms: paymentTerms || undefined,
        tax,
        note: note || undefined,
      });
      navigate('/procurement/purchase-orders');
    } catch (err: any) {
      setError(err.message || '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">新增採購訂單</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="供應商" required>
            <select className={selectClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">請選擇</option>
              {(suppliers?.data ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s.supplierCode})</option>
              ))}
            </select>
          </FormField>
          <FormField label="預期交期">
            <input className={inputClass} type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
          </FormField>
          <FormField label="付款條件">
            <input className={inputClass} placeholder="如 NET30" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
          </FormField>
        </div>

        {/* 品項明細 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">品項明細</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ 新增品項</Button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">品項名稱</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">規格</th>
                  <th className="px-3 py-2 text-right">單價</th>
                  <th className="px-3 py-2 text-right">數量</th>
                  <th className="px-3 py-2 text-left">單位</th>
                  <th className="px-3 py-2 text-right">小計</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">
                      <input className={inputClass} value={item.productName} onChange={(e) => updateItem(idx, 'productName', e.target.value)} required />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} value={item.sku} onChange={(e) => updateItem(idx, 'sku', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} value={item.specification} onChange={(e) => updateItem(idx, 'specification', e.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={`${inputClass} text-right`} type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} required />
                    </td>
                    <td className="px-3 py-2">
                      <input className={`${inputClass} text-right`} type="number" min={1} value={item.orderedQty} onChange={(e) => updateItem(idx, 'orderedQty', Number(e.target.value))} required />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} style={{ width: 60 }} />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {(item.unitPrice * item.orderedQty).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" className="text-red-500 hover:text-red-700" onClick={() => removeItem(idx)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 金額 */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">小計</span>
              <span>NT$ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">稅額</span>
              <input
                className={`${inputClass} text-right w-32`}
                type="number"
                min={0}
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>總計</span>
              <span>NT$ {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <FormField label="備註">
          <textarea className={textareaClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>建立採購單</Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/procurement/purchase-orders')}>取消</Button>
        </div>
      </form>
    </div>
  );
}
