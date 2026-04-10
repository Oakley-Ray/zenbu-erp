import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FormField, inputClass, selectClass, textareaClass, Button } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface ProductPayload {
  name: string;
  sku: string;
  description: string;
  price: string;
  costPrice: string;
  status: string;
  categoryId: string;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  costPrice: number;
  status: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

const EMPTY_FORM: ProductPayload = {
  name: '',
  sku: '',
  description: '',
  price: '',
  costPrice: '',
  status: 'draft',
  categoryId: '',
};

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ProductPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductPayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 取得分類列表
  const { data: categories } = useFetch<Category[]>('/products/categories');

  // 編輯模式：取得現有商品
  const { data: existing, loading: loadingProduct } = useFetch<ProductData>(
    isEdit ? `/products/${id}` : '',
    [id],
  );

  // 當取得現有商品資料後填入表單
  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name,
        sku: existing.sku,
        description: existing.description ?? '',
        price: String(existing.price),
        costPrice: String(existing.costPrice ?? ''),
        status: existing.status,
        categoryId: existing.categoryId ?? '',
      });
    }
  }, [isEdit, existing]);

  function setField<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 清除該欄位錯誤
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ProductPayload, string>> = {};
    if (!form.name.trim()) newErrors.name = '商品名稱為必填';
    if (!form.sku.trim()) newErrors.sku = 'SKU 為必填';
    if (!form.price || Number(form.price) < 0) newErrors.price = '請輸入有效售價';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const body = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      status: form.status,
      categoryId: form.categoryId || undefined,
    };

    try {
      if (isEdit) {
        await apiRequest(`/products/${id}`, 'PATCH', body);
      } else {
        await apiRequest('/products', 'POST', body);
      }
      navigate('/products');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  if (isEdit && loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">載入商品資料中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 頁面標題 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? '編輯商品' : '新增商品'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {submitError && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{submitError}</div>
        )}

        <FormField label="商品名稱" name="name" required error={errors.name}>
          <input
            id="name"
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="例：LAYERFRAME 模組化收納架 M"
          />
        </FormField>

        <FormField label="SKU" name="sku" required error={errors.sku}>
          <input
            id="sku"
            type="text"
            className={inputClass}
            value={form.sku}
            onChange={(e) => setField('sku', e.target.value)}
            placeholder="例：LF-RACK-M-001"
          />
        </FormField>

        <FormField label="商品描述" name="description">
          <textarea
            id="description"
            className={textareaClass}
            rows={4}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="商品描述（選填）"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="售價（NT$）" name="price" required error={errors.price}>
            <input
              id="price"
              type="number"
              min="0"
              step="1"
              className={inputClass}
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              placeholder="0"
            />
          </FormField>

          <FormField label="成本（NT$）" name="costPrice" error={errors.costPrice}>
            <input
              id="costPrice"
              type="number"
              min="0"
              step="1"
              className={inputClass}
              value={form.costPrice}
              onChange={(e) => setField('costPrice', e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="狀態" name="status">
            <select
              id="status"
              className={selectClass}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="draft">草稿</option>
              <option value="active">上架中</option>
              <option value="archived">已下架</option>
            </select>
          </FormField>

          <FormField label="分類" name="categoryId">
            <select
              id="categoryId"
              className={selectClass}
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
            >
              <option value="">未分類</option>
              {(categories ?? []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" loading={submitting}>
            {isEdit ? '儲存變更' : '建立商品'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
