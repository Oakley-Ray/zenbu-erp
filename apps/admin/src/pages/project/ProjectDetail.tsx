import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, Badge } from '@/components/ui';
import { useFetch, apiRequest } from '@/hooks/useApi';
import { WbsTree } from './WbsTree';
import { MilestoneTimeline } from './MilestoneTimeline';
import { CostDashboard } from './CostDashboard';
import { ResourceAllocation } from './ResourceAllocation';
import { FileUpload } from '@/components/FileUpload';

const STATUS_LABEL: Record<string, string> = {
  planning: '規劃中',
  active: '進行中',
  on_hold: '暫停',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  planning: 'info',
  active: 'success',
  on_hold: 'warning',
  completed: 'default',
  cancelled: 'error',
};

const TABS = [
  { key: 'wbs', label: 'WBS 分解' },
  { key: 'milestones', label: '里程碑' },
  { key: 'resources', label: '資源分配' },
  { key: 'costs', label: '成本控制' },
  { key: 'files', label: '附件' },
] as const;

type TabKey = typeof TABS[number]['key'];

function formatNTD(v: number) { return `NT$ ${Number(v).toLocaleString('zh-TW')}`; }
function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('wbs');

  const { data: project, loading, refetch } = useFetch<any>(
    `/project/projects/${id}`,
    [id],
  );

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiRequest(`/project/projects/${id}/status`, 'PATCH', { status: newStatus });
      refetch();
    } catch (err: any) {
      alert(err.message || '狀態更新失敗');
    }
  };

  if (loading || !project) {
    return <div className="flex justify-center py-20 text-gray-400">載入中...</div>;
  }

  const budgetUsage = Number(project.budget) > 0
    ? Math.round((Number(project.actualCost) / Number(project.budget)) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <Badge variant={STATUS_VARIANT[project.status] ?? 'default'}>
              {STATUS_LABEL[project.status] ?? project.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">{project.projectCode}</p>
          {project.description && (
            <p className="mt-2 text-sm text-gray-600">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {project.status === 'planning' && (
            <Button onClick={() => handleStatusChange('active')}>啟動專案</Button>
          )}
          {project.status === 'active' && (
            <>
              <Button variant="ghost" onClick={() => handleStatusChange('on_hold')}>暫停</Button>
              <Button onClick={() => handleStatusChange('completed')}>完成</Button>
            </>
          )}
          {project.status === 'on_hold' && (
            <Button onClick={() => handleStatusChange('active')}>恢復</Button>
          )}
          <Button variant="ghost" onClick={() => navigate(`/project/edit/${id}`)}>編輯</Button>
          <Button variant="ghost" onClick={() => navigate('/project')}>返回</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-xs text-gray-500 mb-1">整體進度</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">預算</p>
          <p className="text-lg font-semibold">{formatNTD(project.budget)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">實際成本</p>
          <p className={`text-lg font-semibold ${budgetUsage > 100 ? 'text-red-600' : ''}`}>
            {formatNTD(project.actualCost)}
            <span className="text-xs text-gray-400 ml-1">({budgetUsage}%)</span>
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">時程</p>
          <p className="text-sm">{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'wbs' && <WbsTree projectId={id!} />}
      {activeTab === 'milestones' && <MilestoneTimeline projectId={id!} />}
      {activeTab === 'resources' && <ResourceAllocation projectId={id!} />}
      {activeTab === 'costs' && <CostDashboard projectId={id!} />}
      {activeTab === 'files' && <FileUpload entityType="project" entityId={id!} />}
    </div>
  );
}
