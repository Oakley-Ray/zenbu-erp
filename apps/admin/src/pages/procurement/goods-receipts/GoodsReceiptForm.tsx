import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button, FormField, inputClass, selectClass, textareaClass } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

const INSPECTION_TYPES = [
  { value: 'exempt', label: '免檢' },
  { value: 'sampling', label: '抽檢' },
  { value: 'full', label: '全檢' },
];

const INSPECTION_RESULTS = [
  { value: 'pass', label: '合格' },
  { value: 'conditional_accept', label: '條件接受' },
  { value: 'fail', label: '不合格' },
];

interface GrItem {
  poItemId: string;
  productId?: string;
  productName: string;
  sku: string;
  orderedQty: number;
  pendingQty: number;
  receivedQty: number;
  inspectionType: string;
  inspectionResult: string;
  acceptedQty: number;
  rejectedQty: number;
  note: string;
}

export function GoodsReceiptFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetPoId = searchParams.get('poId') ?? '';

  const [purchaseOrderId, setPurchaseOrderId] = useState(presetPoId);
  const [items, setItems] = useState<GrItem[]>([]);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 載入 PO 詳情
  const { data: po } = useFetch<any>(
    purchaseOrderId ? `/procurement/purchase-orders/${purchaseOrderId}` : null,
    [purchaseOrderId],
  );

  // 當 PO 載入後，初始化收貨品項
  useEffect(() => {
    if (po?.items) {
      setItems(
        po.items.map((item: any) => ({
          poItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku ?? '',
          orderedQty: item.orderedQty,
          pendingQty: item.orderedQty - (item.receivedQty ?? 0),
          receivedQty: item.orderedQty - (item.receivedQty ?? 0), // 預設收滿
          inspectionType: 'sampling',
          inspectionResult: 'pass',
          acceptedQty: item.orderedQty - (item.receivedQty ?? 0),
          rejectedQty: 0,
          note: '',
        })),
      );
    }
  }, [po]);

  const updateItem = (index: number, field: keyof GrItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // 自動計算
      if (field === 'receivedQty' || field === 'rejectedQty') {
        const received = field === 'receivedQty' ? value : next[index].receivedQty;
        const rejected = field === 'rejectedQty' ? value : next[index].rejectedQty;
        next[index].acceptedQty = Math.max(0, received - rejected);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/procurement/goods-receipts', 'POST', {
        purchaseOrderId,
        receivedDate,
        note: note || undefined,
        items: items.map((i) => ({
          poItemId: i.poItemId,
          productId: i.productId,
          productName: i.productName,
          sku: i.sku || undefined,
          orderedQty: i.orderedQty,
          receivedQty: i.receivedQty,
          inspectionType: i.inspectionType,
          inspectionResult: i.inspectionResult,
          acceptedQty: i.acceptedQty,
          rejectedQty: i.rejectedQty,
          note: i.note || undefined,
        })),
      });
      navigate('/procurement/goods-receipts');
    } catch (err: any) {
      setError(err.message || '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">新增收貨單</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="採購單號" required>
            <input
              className={inputClass}
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              placeholder="輸入 PO ID 或從採購單進入"
              required
            />
            {po && <p className="text-sm text-green-600 mt-1">已載入：{po.poNumber}</p>}
          </FormField>
          <FormField label="收貨日期">
            <input className={inputClass} type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
          </FormField>
        </div>

        {items.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">品項</th>
                  <th className="px-3 py-2 text-right">訂購量</th>
                  <th className="px-3 py-2 text-right">待收量</th>
                  <th className="px-3 py-2 text-right">實收量</th>
                  <th className="px-3 py-2 text-left">檢驗類型</th>
                  <th className="px-3 py-2 text-left">檢驗結果</th>
                  <th className="px-3 py-2 text-right">合格</th>
                  <th className="px-3 py-2 text-right">不合格</th>
                  <th className="px-3 py-2 text-left">備註</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.productName}</div>
                      {item.sku && <div className="text-gray-400 text-xs">{item.sku}</div>}
                    </td>
                    <td className="px-3 py-2 text-right">{item.orderedQty}</td>
                    <td className="px-3 py-2 text-right text-orange-600">{item.pendingQty}</td>
                    <td className="px-3 py-2">
                      <input className={`${inputClass} text-right w-20`} type="number" min={0} value={item.receivedQty} onChange={(e) => updateItem(idx, 'receivedQty', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <select className={selectClass} value={item.inspectionType} onChange={(e) => updateItem(idx, 'inspectionType', e.target.value)}>
                        {INSPECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={selectClass} value={item.inspectionResult} onChange={(e) => updateItem(idx, 'inspectionResult', e.target.value)}>
                        {INSPECTION_RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input className={`${inputClass} text-right w-20`} type="number" min={0} value={item.acceptedQty} onChange={(e) => updateItem(idx, 'acceptedQty', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={`${inputClass} text-right w-20`} type="number" min={0} value={item.rejectedQty} onChange={(e) => updateItem(idx, 'rejectedQty', Number(e.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} value={item.note} onChange={(e) => updateItem(idx, 'note', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <FormField label="備註">
          <textarea className={textareaClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>建立收貨單</Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/procurement/goods-receipts')}>取消</Button>
        </div>
      </form>
    </div>
  );
}
