interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-gray-500">
        共 {total} 筆，第 {current} / {totalPages} 頁
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          上一頁
        </button>
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                page === current
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current >= totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          下一頁
        </button>
      </div>
    </div>
  );
}
