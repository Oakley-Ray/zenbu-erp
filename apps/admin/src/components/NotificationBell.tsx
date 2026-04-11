import { useState, useEffect, useRef } from 'react';
import { useFetch, apiRequest } from '@/hooks/useApi';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData, refetch: refetchCount } = useFetch<number>(
    '/notifications/unread-count',
    [],
  );

  const { data: notifData, refetch: refetchList } = useFetch<any>(
    open ? '/notifications?limit=10' : null,
    [open],
  );

  const unreadCount = typeof countData === 'number' ? countData : 0;
  const notifications: Notification[] = notifData?.data ?? [];

  // 每 30 秒刷新未讀數
  useEffect(() => {
    const interval = setInterval(refetchCount, 30000);
    return () => clearInterval(interval);
  }, [refetchCount]);

  // 點外部關閉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    await apiRequest(`/notifications/${id}/read`, 'PATCH');
    refetchCount();
    refetchList();
  };

  const handleMarkAllRead = async () => {
    await apiRequest('/notifications/read-all', 'PATCH');
    refetchCount();
    refetchList();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        aria-label="通知"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer"
              >
                全部已讀
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">沒有通知</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !n.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
