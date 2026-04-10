import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FormField, inputClass, selectClass, Button } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { useRole, ASSIGNABLE_ROLES, ROLE_LABELS } from '@/hooks/useRole';

interface UserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const EMPTY_FORM: UserPayload = {
  name: '',
  email: '',
  password: '',
  role: 'viewer',
};

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { isSuperAdmin } = useRole();

  const [form, setForm] = useState<UserPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof UserPayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: existing, loading: loadingUser } = useFetch<UserData>(
    isEdit ? `/users/${id}` : '',
    [id],
  );

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name,
        email: existing.email,
        password: '',
        role: existing.role,
      });
    }
  }, [isEdit, existing]);

  function setField<K extends keyof UserPayload>(key: K, value: UserPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof UserPayload, string>> = {};
    if (!form.name.trim()) newErrors.name = '姓名為必填';
    if (!form.email.trim()) newErrors.email = 'Email 為必填';
    if (!isEdit && !form.password) newErrors.password = '密碼為必填';
    if (!isEdit && form.password && form.password.length < 6)
      newErrors.password = '密碼至少 6 個字元';
    if (!form.role) newErrors.role = '請選擇角色';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      role: form.role,
    };

    if (isEdit) {
      if (form.password) body.password = form.password;
    } else {
      body.email = form.email.trim();
      body.password = form.password;
    }

    try {
      if (isEdit) {
        await apiRequest(`/users/${id}`, 'PATCH', body);
      } else {
        await apiRequest('/users', 'POST', body);
      }
      navigate('/users');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  if (isEdit && loadingUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">載入中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-flex items-center gap-1 transition-colors"
        >
          &larr; 返回使用者列表
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? '編輯使用者' : '新增使用者'}
        </h2>
      </div>

      {submitError && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="姓名" error={errors.name} required>
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="輸入姓名"
          />
        </FormField>

        <FormField label="Email" error={errors.email} required>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="user@example.com"
            disabled={isEdit}
          />
          {isEdit && (
            <p className="text-xs text-gray-400 mt-1">Email 建立後無法修改</p>
          )}
        </FormField>

        <FormField
          label={isEdit ? '新密碼' : '密碼'}
          error={errors.password}
          required={!isEdit}
          helper={isEdit ? '留空表示不修改密碼' : '至少 6 個字元'}
        >
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            placeholder={isEdit ? '不修改請留空' : '輸入密碼'}
          />
        </FormField>

        <FormField label="角色" error={errors.role} required>
          <select
            className={selectClass}
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]} ({r})
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            <p><strong>超級管理員</strong> — 完整權限，可管理使用者</p>
            <p><strong>管理員</strong> — 日常營運管理</p>
            <p><strong>倉管人員</strong> — 庫存管理、出貨</p>
            <p><strong>業務人員</strong> — 訂單、客戶、商品</p>
            <p><strong>財務人員</strong> — 報表、金流、交易</p>
            <p><strong>檢視者</strong> — 僅能檢視，無法操作</p>
          </div>
        </FormField>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" loading={submitting}>
            {isEdit ? '儲存變更' : '建立使用者'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/users')}
          >
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
