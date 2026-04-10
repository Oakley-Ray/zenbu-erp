import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, FormField, inputClass, selectClass, textareaClass } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';

const INSPECTION_TYPES = [
  { value: 'exempt', label: '免檢' },
  { value: 'sampling', label: '抽檢' },
  { value: 'full', label: '全檢' },
];

export function SupplierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: existing } = useFetch<any>(
    isEdit ? `/procurement/suppliers/${id}` : null,
    [id],
  );

  const [form, setForm] = useState({
    supplierCode: '',
    name: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    taxId: '',
    paymentTerms: '',
    defaultInspectionType: 'sampling',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        supplierCode: existing.supplierCode ?? '',
        name: existing.name ?? '',
        contactPerson: existing.contactPerson ?? '',
        contactEmail: existing.contactEmail ?? '',
        contactPhone: existing.contactPhone ?? '',
        address: existing.address ?? '',
        taxId: existing.taxId ?? '',
        paymentTerms: existing.paymentTerms ?? '',
        defaultInspectionType: existing.defaultInspectionType ?? 'sampling',
        note: existing.note ?? '',
      });
    }
  }, [existing]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await apiRequest(`/procurement/suppliers/${id}`, 'PATCH', form);
      } else {
        await apiRequest('/procurement/suppliers', 'POST', form);
      }
      navigate('/procurement/suppliers');
    } catch (err: any) {
      setError(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '編輯供應商' : '新增供應商'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="供應商編號" required>
            <input
              className={inputClass}
              value={form.supplierCode}
              onChange={(e) => handleChange('supplierCode', e.target.value)}
              disabled={isEdit}
              required
            />
          </FormField>
          <FormField label="供應商名稱" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="聯絡人">
            <input className={inputClass} value={form.contactPerson} onChange={(e) => handleChange('contactPerson', e.target.value)} />
          </FormField>
          <FormField label="電話">
            <input className={inputClass} value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email">
            <input className={inputClass} type="email" value={form.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)} />
          </FormField>
          <FormField label="統一編號">
            <input className={inputClass} value={form.taxId} onChange={(e) => handleChange('taxId', e.target.value)} />
          </FormField>
        </div>

        <FormField label="地址">
          <input className={inputClass} value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="付款條件">
            <input className={inputClass} placeholder="如 NET30" value={form.paymentTerms} onChange={(e) => handleChange('paymentTerms', e.target.value)} />
          </FormField>
          <FormField label="預設品檢類型">
            <select className={selectClass} value={form.defaultInspectionType} onChange={(e) => handleChange('defaultInspectionType', e.target.value)}>
              {INSPECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="備註">
          <textarea className={textareaClass} rows={3} value={form.note} onChange={(e) => handleChange('note', e.target.value)} />
        </FormField>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={saving}>
            {isEdit ? '儲存變更' : '建立供應商'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate('/procurement/suppliers')}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
