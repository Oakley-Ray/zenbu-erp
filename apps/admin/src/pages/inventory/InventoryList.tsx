import { useState } from 'react';
import { Table, Pagination, Badge, Button, Modal, FormField, inputClass } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

/* ---------- Types ---------- */

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface InventoryItem {
  id: string;
  product: Product;
  warehouse: string;
  quantity: number;
  reserved: number;
  safetyStock: number;
}

interface InventoryResponse {
  data: InventoryItem[];
  total: number;
}

/* ---------- Component ---------- */

export function InventoryListPage() {
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjust modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustRef, setAdjustRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add stock modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addWarehouse, setAddWarehouse] = useState('main');
  const [addNote, setAddNote] = useState('');

  const { data, loading, error, refetch } = useFetch<InventoryResponse>(
    `/inventory?page=${page}&limit=20`,
    [page],
  );

  const { data: productsData } = useFetch<any>('/products?limit=200', []);
  const allProducts: { id: string; name: string; sku?: string }[] = productsData?.data ?? productsData ?? [];

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const lowStockCount = items.filter(
    (i) => i.quantity - i.reserved <= i.safetyStock,
  ).length;

  const displayItems = lowStockOnly
    ? items.filter((i) => i.quantity - i.reserved <= i.safetyStock)
    : items;

  /* ---------- Adjustment handlers ---------- */

  function openAdjustModal(item: InventoryItem) {
    setSelectedItem(item);
    setAdjustType('in');
    setAdjustQty('');
    setAdjustRef('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedItem(null);
  }

  async function handleSubmitAdjust() {
    if (!selectedItem || !adjustQty) return;
    const qty = Number(adjustQty);
    if (isNaN(qty) || qty <= 0) return;

    setSubmitting(true);
    try {
      await apiRequest('/inventory/adjust', 'POST', {
        productId: selectedItem.product.id,
        warehouse: selectedItem.warehouse,
        quantity: adjustType === 'in' ? qty : -qty,
        reference: adjustRef,
        referenceType: 'manual',
      });
      closeModal();
      refetch();
    } catch (err) {
      alert((err as Error).message ?? '調整失敗');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Add stock handler ---------- */

  async function handleAddStock() {
    if (!addProductId || !addQty) return;
    const qty = Number(addQty);
    if (isNaN(qty) || qty <= 0) return;

    setSubmitting(true);
    try {
      await apiRequest(`/inventory/${addProductId}/in`, 'POST', {
        quantity: qty,
        warehouse: addWarehouse || 'main',
        note: addNote || '初始入庫',
      });
      setAddModalOpen(false);
      setAddProductId('');
      setAddQty('');
      setAddWarehouse('main');
      setAddNote('');
      refetch();
    } catch (err) {
      alert((err as Error).message ?? '新增失敗');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Table columns ---------- */

  const columns = [
    {
      key: 'productName',
      title: '商品名稱',
      render: (r: InventoryItem) => (
        <span className="font-medium text-gray-900">{r.product.name}</span>
      ),
    },
    {
      key: 'sku',
      title: 'SKU',
      render: (r: InventoryItem) => (
        <span className="font-mono text-xs">{r.product.sku}</span>
      ),
    },
    {
      key: 'warehouse',
      title: '倉庫',
    },
    {
      key: 'quantity',
      title: '庫存數量',
      className: 'text-right',
    },
    {
      key: 'reserved',
      title: '已預留',
      className: 'text-right',
    },
    {
      key: 'available',
      title: '可用',
      className: 'text-right',
      render: (r: InventoryItem) => {
        const available = r.quantity - r.reserved;
        return (
          <span className={available <= r.safetyStock ? 'text-red-600 font-semibold' : ''}>
            {available}
          </span>
        );
      },
    },
    {
      key: 'safetyStock',
      title: '安全庫存',
      className: 'text-right',
    },
    {
      key: 'status',
      title: '狀態',
      render: (r: InventoryItem) => {
        const available = r.quantity - r.reserved;
        return available <= r.safetyStock ? (
          <Badge variant="danger">低庫存</Badge>
        ) : (
          <Badge variant="success">正常</Badge>
        );
      },
    },
    {
      key: 'actions',
      title: '',
      render: (r: InventoryItem) => (
        <Button size="sm" variant="secondary" onClick={() => openAdjustModal(r)}>
          調整庫存
        </Button>
      ),
    },
  ];

  /* ---------- Error state ---------- */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-600 text-lg mb-4">載入失敗：{error}</p>
        <Button onClick={refetch}>重新載入</Button>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">庫存管理</h2>
          <p className="mt-1 text-sm text-gray-500">管理所有商品庫存數量與調整紀錄</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>新增入庫</Button>
      </div>

      {/* Summary + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            共 <span className="font-semibold text-gray-900">{total}</span> 項商品
          </span>
          <span>
            低庫存 <span className="font-semibold text-red-600">{lowStockCount}</span> 項
          </span>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          僅顯示低庫存
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table<InventoryItem> columns={columns} data={displayItems} loading={loading} rowKey="id" />
        <Pagination current={page} total={total} pageSize={20} onChange={setPage} />
      </div>

      {/* Adjustment Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="調整庫存"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button loading={submitting} onClick={handleSubmitAdjust}>
              確認調整
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            <FormField label="商品名稱" name="productName">
              <input
                id="productName"
                type="text"
                className={`${inputClass} bg-gray-50`}
                value={selectedItem.product.name}
                readOnly
              />
            </FormField>

            <FormField label="調整類型" name="adjustType" required>
              <select
                id="adjustType"
                className={inputClass}
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as 'in' | 'out')}
              >
                <option value="in">入庫</option>
                <option value="out">出庫</option>
              </select>
            </FormField>

            <FormField label="數量" name="adjustQty" required>
              <input
                id="adjustQty"
                type="number"
                min="1"
                className={inputClass}
                placeholder="請輸入調整數量"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </FormField>

            <FormField label="備註" name="adjustRef">
              <input
                id="adjustRef"
                type="text"
                className={inputClass}
                placeholder="調整原因或參考編號"
                value={adjustRef}
                onChange={(e) => setAdjustRef(e.target.value)}
              />
            </FormField>
          </div>
        )}
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="新增入庫"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              取消
            </Button>
            <Button loading={submitting} onClick={handleAddStock}>
              確認入庫
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="選擇商品" name="addProduct" required>
            <select
              id="addProduct"
              className={inputClass}
              value={addProductId}
              onChange={(e) => setAddProductId(e.target.value)}
            >
              <option value="">請選擇商品</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="數量" name="addQty" required>
            <input
              id="addQty"
              type="number"
              min="1"
              className={inputClass}
              placeholder="入庫數量"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
            />
          </FormField>

          <FormField label="倉庫" name="addWarehouse">
            <input
              id="addWarehouse"
              type="text"
              className={inputClass}
              value={addWarehouse}
              onChange={(e) => setAddWarehouse(e.target.value)}
              placeholder="main"
            />
          </FormField>

          <FormField label="備註" name="addNote">
            <input
              id="addNote"
              type="text"
              className={inputClass}
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="初始入庫 / 採購到貨..."
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
