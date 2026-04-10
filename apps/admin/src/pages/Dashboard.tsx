import { useFetch } from '@/hooks/useApi';
import { KpiCard } from '@/components/ui';

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  activeCustomers: number;
  pendingOrders: number;
  lowStockItems: number;
  monthRevenue: number;
  monthOrders: number;
}

function formatNTD(value: number): string {
  return `NT$ ${value.toLocaleString('zh-TW')}`;
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y} 年 ${m} 月 ${d} 日`;
}

export function DashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardData>('/analytics/dashboard');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-600 text-lg mb-4">載入失敗：{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          重新載入
        </button>
      </div>
    );
  }

  const loadingPlaceholder = '載入中...';
  const isReady = !loading && data != null;

  return (
    <div>
      {/* 頁面標題 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">儀表板</h2>
        <p className="mt-1 text-sm text-gray-500">{getTodayString()}</p>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          label="本月營收"
          value={isReady ? formatNTD(data.monthRevenue) : loadingPlaceholder}
        />
        <KpiCard
          label="本月訂單"
          value={isReady ? `${data.monthOrders.toLocaleString('zh-TW')} 筆` : loadingPlaceholder}
        />
        <KpiCard
          label="平均客單價"
          value={isReady ? formatNTD(data.averageOrderValue) : loadingPlaceholder}
        />
        <KpiCard
          label="活躍客戶"
          value={isReady ? `${data.activeCustomers.toLocaleString('zh-TW')} 人` : loadingPlaceholder}
        />
        <KpiCard
          label="待處理訂單"
          value={isReady ? `${data.pendingOrders.toLocaleString('zh-TW')} 筆` : loadingPlaceholder}
        />
        <KpiCard
          label="低庫存品項"
          value={isReady ? `${data.lowStockItems.toLocaleString('zh-TW')} 項` : loadingPlaceholder}
        />
      </div>

      {/* 營收趨勢圖表（佔位） */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">營收趨勢</h3>
        </div>
        <div className="px-5 py-12 flex items-center justify-center">
          <p className="text-gray-400 text-sm">營收趨勢圖表 — 連接後端後顯示</p>
        </div>
      </div>

      {/* 最近訂單（佔位） */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">最近訂單</h3>
        </div>
        <div className="px-5 py-12 flex items-center justify-center">
          <p className="text-gray-400 text-sm">連接後端後將顯示最近訂單列表</p>
        </div>
      </div>
    </div>
  );
}
