const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  neutral: 'bg-gray-50 text-gray-700 ring-gray-600/20',
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

/** 訂單狀態 → Badge 對應 */
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    pending: { variant: 'warning', label: '待確認' },
    confirmed: { variant: 'info', label: '已確認' },
    processing: { variant: 'info', label: '處理中' },
    shipped: { variant: 'info', label: '已出貨' },
    delivered: { variant: 'success', label: '已送達' },
    completed: { variant: 'success', label: '已完成' },
    cancelled: { variant: 'danger', label: '已取消' },
    refunded: { variant: 'danger', label: '已退款' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/** 付款狀態 → Badge 對應 */
export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    pending: { variant: 'warning', label: '待付款' },
    success: { variant: 'success', label: '已付款' },
    failed: { variant: 'danger', label: '付款失敗' },
    refunded: { variant: 'danger', label: '已退款' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/** 採購訂單狀態 → Badge 對應 */
export function PoStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    draft: { variant: 'neutral', label: '草稿' },
    pending_approval: { variant: 'warning', label: '待審核' },
    approved: { variant: 'info', label: '已核准' },
    rejected: { variant: 'danger', label: '已退回' },
    ordered: { variant: 'info', label: '已下單' },
    partial_received: { variant: 'warning', label: '部分到貨' },
    received: { variant: 'success', label: '已到貨' },
    closed: { variant: 'success', label: '已結案' },
    cancelled: { variant: 'danger', label: '已取消' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/** 供應商狀態 → Badge 對應 */
export function SupplierStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    active: { variant: 'success', label: '有效' },
    inactive: { variant: 'neutral', label: '停用' },
    blacklisted: { variant: 'danger', label: '黑名單' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/** 收貨單狀態 → Badge 對應 */
export function GrStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    draft: { variant: 'neutral', label: '草稿' },
    inspecting: { variant: 'warning', label: '檢驗中' },
    completed: { variant: 'success', label: '已完成' },
    rejected: { variant: 'danger', label: '已退回' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/** RFQ 狀態 → Badge 對應 */
export function RfqStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    draft: { variant: 'neutral', label: '草稿' },
    sent: { variant: 'info', label: '已發送' },
    quoted: { variant: 'warning', label: '已報價' },
    closed: { variant: 'success', label: '已結案' },
    cancelled: { variant: 'danger', label: '已取消' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/** 索賠狀態 → Badge 對應 */
export function ClaimStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: keyof typeof variants; label: string }> = {
    pending: { variant: 'warning', label: '待處理' },
    negotiating: { variant: 'info', label: '協商中' },
    agreed: { variant: 'success', label: '已同意' },
    offset: { variant: 'success', label: '已沖帳' },
    disputed: { variant: 'danger', label: '爭議中' },
  };
  const item = map[status] ?? { variant: 'neutral' as const, label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
