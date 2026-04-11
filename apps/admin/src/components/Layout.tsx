import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { useLogout, useGetIdentity } from '@refinedev/core';
import { Link, useLocation } from 'react-router';
import { ROLE_LABELS } from '@/hooks/useRole';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  to: string;
  label: string;
  /** 哪些角色可以看到這個項目，undefined = 所有登入使用者 */
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * 角色權限對照：
 * - super_admin / admin：看到所有功能
 * - warehouse：庫存、訂單（出貨相關）
 * - sales：商品、訂單、客戶、物流
 * - finance：儀表板、交易記錄、金流設定、報表
 * - viewer：僅儀表板
 * - platform_owner：同 super_admin
 */
const ALL_NAV_SECTIONS: NavSection[] = [
  {
    title: '總覽',
    items: [{ to: '/', label: '儀表板' }],
  },
  {
    title: '商品與庫存',
    items: [
      { to: '/products', label: '商品管理', roles: ['super_admin', 'admin', 'sales'] },
      { to: '/inventory', label: '庫存管理', roles: ['super_admin', 'admin', 'warehouse'] },
    ],
  },
  {
    title: '銷售',
    items: [
      { to: '/orders', label: '訂單管理', roles: ['super_admin', 'admin', 'sales', 'warehouse'] },
      { to: '/customers', label: '客戶管理', roles: ['super_admin', 'admin', 'sales'] },
    ],
  },
  {
    title: '採購管理',
    items: [
      { to: '/procurement/suppliers', label: '供應商管理', roles: ['super_admin', 'admin', 'procurement'] },
      { to: '/procurement/rfq', label: '詢價/報價', roles: ['super_admin', 'admin', 'procurement'] },
      { to: '/procurement/purchase-orders', label: '採購訂單', roles: ['super_admin', 'admin', 'procurement'] },
      { to: '/procurement/goods-receipts', label: '收貨管理', roles: ['super_admin', 'admin', 'procurement', 'warehouse'] },
      { to: '/procurement/returns', label: '退貨/索賠', roles: ['super_admin', 'admin', 'procurement', 'finance'] },
    ],
  },
  {
    title: '專案管理',
    items: [
      { to: '/project', label: '專案總覽', roles: ['super_admin', 'admin', 'project_manager'] },
    ],
  },
  {
    title: '物流與金流',
    items: [
      { to: '/logistics', label: '物流報價', roles: ['super_admin', 'admin', 'sales'] },
      { to: '/payments/transactions', label: '交易記錄', roles: ['super_admin', 'admin', 'finance'] },
      { to: '/payments/config', label: '金流設定', roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: '系統',
    items: [
      { to: '/users', label: '使用者管理', roles: ['super_admin', 'admin'] },
    ],
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<{ name: string; role: string }>();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = identity?.role ?? '';

  /** 根據角色過濾導航項目 */
  const navSections = useMemo(() => {
    return ALL_NAV_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.roles) return true; // 沒限制 = 全部可見
          if (role === 'platform_owner') return true; // 平台擁有者看全部
          return item.roles.includes(role);
        }),
      }))
      .filter((section) => section.items.length > 0); // 移除空 section
  }, [role]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 側邊欄 */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-primary-600">LAYERFRAME</h1>
              <p className="text-[10px] text-gray-400 tracking-wider">ENTERPRISE OPS</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label={collapsed ? '展開側邊欄' : '收合側邊欄'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className={collapsed ? 'mx-auto' : ''}>
                        {collapsed ? item.label.charAt(0) : item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-200">
          {!collapsed && (
            <div className="flex items-center justify-between mb-2">
              <NotificationBell />
            </div>
          )}
          {!collapsed ? (
            <>
              <div className="text-sm text-gray-600 mb-2 truncate">
                {identity?.name ?? '使用者'}
                <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                  {ROLE_LABELS[role] ?? role}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
              >
                登出
              </button>
            </>
          ) : (
            <button
              onClick={() => logout()}
              title="登出"
              className="w-full p-2 text-red-500 hover:text-red-700 transition-colors cursor-pointer text-center text-sm"
            >
              ⏻
            </button>
          )}
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
