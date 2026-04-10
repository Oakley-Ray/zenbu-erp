import { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField, inputClass } from '@/components/ui/FormField';

interface QuoteItem {
  name: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  actualWeightKg: string;
}

const emptyItem = (): QuoteItem => ({
  name: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  actualWeightKg: '',
});

export function CreateQuotePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [originCountry, setOriginCountry] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);

  const updateItem = (index: number, field: keyof QuoteItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest('/logistics/quotes', 'POST', {
        origin: { country: originCountry, city: originCity },
        destination: { country: destinationCountry, city: destinationCity },
        items: items.map((item) => ({
          name: item.name,
          lengthCm: Number(item.lengthCm),
          widthCm: Number(item.widthCm),
          heightCm: Number(item.heightCm),
          actualWeightKg: Number(item.actualWeightKg),
        })),
      });
      navigate('/logistics');
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立報價失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">建立報價</h2>
        <p className="mt-1 text-sm text-gray-500">輸入寄件與收件資訊，新增貨物明細</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 寄件地 */}
        <Card title="寄件地">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="國家" name="originCountry" required>
              <input
                id="originCountry"
                className={inputClass}
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                placeholder="例：台灣"
                required
              />
            </FormField>
            <FormField label="城市" name="originCity" required>
              <input
                id="originCity"
                className={inputClass}
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="例：台北"
                required
              />
            </FormField>
          </div>
        </Card>

        {/* 目的地 */}
        <Card title="目的地">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="國家" name="destinationCountry" required>
              <input
                id="destinationCountry"
                className={inputClass}
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                placeholder="例：日本"
                required
              />
            </FormField>
            <FormField label="城市" name="destinationCity" required>
              <input
                id="destinationCity"
                className={inputClass}
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="例：東京"
                required
              />
            </FormField>
          </div>
        </Card>

        {/* 貨物明細 */}
        <Card
          title="貨物明細"
          action={
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              新增品項
            </Button>
          }
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-md border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    品項 {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      移除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <FormField label="品名" name={`item-${index}-name`} required>
                    <input
                      id={`item-${index}-name`}
                      className={inputClass}
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="品名"
                      required
                    />
                  </FormField>
                  <FormField label="長 (cm)" name={`item-${index}-length`} required>
                    <input
                      id={`item-${index}-length`}
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={item.lengthCm}
                      onChange={(e) => updateItem(index, 'lengthCm', e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="寬 (cm)" name={`item-${index}-width`} required>
                    <input
                      id={`item-${index}-width`}
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={item.widthCm}
                      onChange={(e) => updateItem(index, 'widthCm', e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="高 (cm)" name={`item-${index}-height`} required>
                    <input
                      id={`item-${index}-height`}
                      type="number"
                      min="0"
                      step="0.1"
                      className={inputClass}
                      value={item.heightCm}
                      onChange={(e) => updateItem(index, 'heightCm', e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="實重 (kg)" name={`item-${index}-weight`} required>
                    <input
                      id={`item-${index}-weight`}
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={item.actualWeightKg}
                      onChange={(e) => updateItem(index, 'actualWeightKg', e.target.value)}
                      required
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={submitting}>
            送出報價
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/logistics')}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
