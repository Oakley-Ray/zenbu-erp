import { useState } from 'react';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField, inputClass } from '@/components/ui/FormField';

interface ProviderConfig {
  provider: string;
  isActive: boolean;
  isSandbox: boolean;
  updatedAt: string;
}

type ProviderName = 'ecpay' | 'linepay' | 'shopline' | 'unipay';

const providerLabels: Record<string, string> = {
  ecpay: 'ECPay',
  linepay: 'LinePay',
  shopline: 'Shopline',
  unipay: '統一金',
};

/** 各金流商設定欄位定義 */
const providerFields: Record<ProviderName, { key: string; label: string }[]> = {
  ecpay: [
    { key: 'merchantId', label: '商店代號 (MerchantID)' },
    { key: 'hashKey', label: 'HashKey' },
    { key: 'hashIv', label: 'HashIV' },
  ],
  linepay: [
    { key: 'channelId', label: 'Channel ID' },
    { key: 'channelSecret', label: 'Channel Secret' },
  ],
  shopline: [
    { key: 'merchantId', label: '商店代號 (MerchantID)' },
    { key: 'apiKey', label: 'API Key' },
    { key: 'secretKey', label: 'Secret Key' },
  ],
  unipay: [
    { key: 'merchantId', label: '商店代號 (MerchantID)' },
    { key: 'hashKey', label: 'HashKey' },
    { key: 'hashIv', label: 'HashIV' },
  ],
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaymentConfigPage() {
  const { data, loading, refetch } = useFetch<ProviderConfig[]>('/payments/config');

  const [editProvider, setEditProvider] = useState<ProviderName | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSandbox, setIsSandbox] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openEdit = (provider: ProviderName) => {
    setEditProvider(provider);
    setFormValues({});
    const existing = data?.find((p) => p.provider === provider);
    setIsSandbox(existing?.isSandbox ?? true);
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditProvider(null);
    setFormValues({});
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editProvider) return;
    setSaving(true);
    setSaveError(null);

    try {
      await apiRequest('/payments/config', 'POST', {
        provider: editProvider,
        config: { ...formValues },
        isSandbox,
      });
      closeEdit();
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const fields = editProvider ? providerFields[editProvider] : [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">金流設定</h2>
        <p className="mt-1 text-sm text-gray-500">設定各金流服務商的串接參數</p>
      </div>

      {loading ? (
        <p className="text-gray-400">載入中...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['ecpay', 'linepay', 'shopline', 'unipay'] as ProviderName[]).map((providerKey) => {
            const config = data?.find((p) => p.provider === providerKey);
            return (
              <Card
                key={providerKey}
                title={providerLabels[providerKey]}
                action={
                  <Button variant="secondary" size="sm" onClick={() => openEdit(providerKey)}>
                    設定
                  </Button>
                }
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">狀態：</span>
                    {config?.isActive ? (
                      <Badge variant="success">啟用中</Badge>
                    ) : (
                      <Badge variant="neutral">未啟用</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">模式：</span>
                    {config?.isSandbox ? (
                      <Badge variant="warning">測試環境</Badge>
                    ) : (
                      <Badge variant="info">正式環境</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    最後更新：{config?.updatedAt ? formatDate(config.updatedAt) : '-'}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 設定 Modal */}
      <Modal
        open={!!editProvider}
        onClose={closeEdit}
        title={`${editProvider ? providerLabels[editProvider] : ''} 設定`}
        footer={
          <>
            <Button variant="secondary" onClick={closeEdit}>
              取消
            </Button>
            <Button loading={saving} onClick={handleSave}>
              儲存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {fields.map((field) => (
            <FormField key={field.key} label={field.label} name={field.key} required>
              <input
                id={field.key}
                className={inputClass}
                value={formValues[field.key] ?? ''}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                required
              />
            </FormField>
          ))}

          {/* Sandbox 切換 */}
          <div className="flex items-center gap-3 pt-2">
            <label htmlFor="sandbox-toggle" className="text-sm font-medium text-gray-700">
              測試環境 (Sandbox)
            </label>
            <button
              id="sandbox-toggle"
              type="button"
              role="switch"
              aria-checked={isSandbox}
              onClick={() => setIsSandbox((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isSandbox ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isSandbox ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        </div>
      </Modal>
    </div>
  );
}
