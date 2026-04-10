import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Table, Pagination, Badge, Button } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { useRole, ROLE_LABELS, ROLE_VARIANTS } from '@/hooks/useRole';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function UserListPage() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useRole();
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const { data: users, loading, error, refetch } = useFetch<User[]>('/users');

  async function handleDeactivate(user: User) {
    const action = user.isActive ? '停用' : '啟用';
    if (!window.confirm(`確定要${action}「${user.name}」嗎？`)) return;

    setDeactivating(user.id);
    try {
      if (user.isActive) {
        await apiRequest(`/users/${user.id}`, 'DELETE');
      } else {
        await apiRequest(`/users/${user.id}`, 'PATCH', { isActive: true });
      }
      refetch();
    } catch (err) {
      alert(`${action}失敗：${(err as Error).message}`);
    } finally {
      setDeactivating(null);
    }
  }

  const columns = [
    {
      key: 'name',
      title: '姓名',
      render: (record: User) => (
        <div>
          <span className="font-medium text-gray-900">{record.name}</span>
          {!record.isActive && (
            <span className="ml-2 text-xs text-gray-400">（已停用）</span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (record: User) => (
        <span className="text-gray-600">{record.email}</span>
      ),
    },
    {
      key: 'role',
      title: '角色',
      render: (record: User) => (
        <Badge variant={ROLE_VARIANTS[record.role] ?? 'neutral'}>
          {ROLE_LABELS[record.role] ?? record.role}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      title: '狀態',
      render: (record: User) => (
        <Badge variant={record.isActive ? 'success' : 'neutral'}>
          {record.isActive ? '啟用' : '停用'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: '建立時間',
      render: (record: User) => (
        <span className="text-gray-500 text-sm">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (record: User) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/users/edit/${record.id}`)}
          >
            編輯
          </Button>
          {isSuperAdmin && (
            <Button
              variant={record.isActive ? 'danger' : 'secondary'}
              size="sm"
              loading={deactivating === record.id}
              onClick={() => handleDeactivate(record)}
            >
              {record.isActive ? '停用' : '啟用'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-600 text-lg mb-4">載入失敗：{error}</p>
        <Button onClick={refetch}>重新載入</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">使用者管理</h2>
          <p className="mt-1 text-sm text-gray-500">
            管理系統使用者帳號與角色權限
          </p>
        </div>
        <Button onClick={() => navigate('/users/create')}>新增使用者</Button>
      </div>

      <Table
        data={users ?? []}
        columns={columns}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
}
