interface Column<T> {
  key: string;
  title: string;
  render?: (record: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: string;
  loading?: boolean;
  onRowClick?: (record: T) => void;
  emptyText?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getField(obj: any, key: string): unknown {
  return obj?.[key];
}

export function Table<T>({
  columns,
  data,
  rowKey = 'id',
  loading,
  onRowClick,
  emptyText = '暫無資料',
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                載入中...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, idx) => (
              <tr
                key={String(getField(record, rowKey) ?? idx)}
                onClick={() => onRowClick?.(record)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm text-gray-700 ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(record)
                      : (getField(record, col.key) as React.ReactNode) ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
