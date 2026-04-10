interface CardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
}

export function KpiCard({ label, value, change, trend }: KpiCardProps) {
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${trendColor}`}>
          {trendIcon} {change}
        </p>
      )}
    </div>
  );
}
