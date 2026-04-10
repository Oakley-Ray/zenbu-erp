import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, FormField, inputClass, textareaClass } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface RfqItemRow {
  productName: string;
  sku: string;
  specification: string;
  quantity: number;
  unit: string;
}

const emptyItem = (): RfqItemRow => ({
  productName: '', sku: '', specification: '', quantity: 1, unit: 'pcs',
});

export function RfqFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<RfqItemRow[]>([emptyItem()]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: suppliers } = useFetch<any>('/procurement/suppliers?limit=100&status=active', []);

  const updateItem = (idx: number, field: keyof RfqItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/procurement/rfq', 'POST', {
        title,
        items: items.map((i) => ({
          productName: i.productName,
          sku: i.sku || undefined,
          specification: i.specification || undefined,
          quantity: i.quantity,
          unit: i.unit,
        })),
        invitedSupplierIds: selectedSupplierIds,
        deadline: deadline || undefined,
        note: note || undefined,
      });
      navigate('/procurement/rfq');
    } catch (err: any) {
      setError(err.message || '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">新增詢價單</h2>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="標題" required>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <FormField label="報價截止日">
            <input className={inputClass} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </FormField>
        </div>

        {/* 品項明細 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">詢價品項</h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => setItems((p) => [...p, emptyItem()])}>+ 新增品項</Button>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">品項名稱</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">規格</th>
                  <th className="px-3 py-2 text-right">數量</th>
                  <th className="px-3 py-2 text-left">單位</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2"><input className={inputClass} value={item.productName} onChange={(e) => updateItem(idx, 'productName', e.target.value)} required /></td>
                    <td className="px-3 py-2"><input className={inputClass} value={item.sku} onChange={(e) => updateItem(idx, 'sku', e.target.value)} /></td>
                    <td className="px-3 py-2"><input className={inputClass} value={item.specification} onChange={(e) => updateItem(idx, 'specification', e.target.value)} /></td>
                    <td className="px-3 py-2"><input className={`${inputClass} text-right w-20`} type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} required /></td>
                    <td className="px-3 py-2"><input className={inputClass} value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} style={{ width: 60 }} /></td>
                    <td className="px-3 py-2">
                      {items.length > 1 && (
                        <button type="button" className="text-red-500" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 供應商選擇 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">邀請供應商</h3>
          <div className="grid grid-cols-3 gap-2">
            {(suppliers?.data ?? []).map((s: any) => (
              <label key={s.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSupplierIds.includes(s.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={selectedSupplierIds.includes(s.id)}
                  onChange={() => toggleSupplier(s.id)}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.supplierCode}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <FormField label="備註">
          <textarea className={textareaClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>建立詢價單</Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/procurement/rfq')}>取消</Button>
        </div>
      </form>
    </div>
  );
}
