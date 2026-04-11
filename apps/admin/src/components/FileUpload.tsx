import { useState, useRef } from 'react';
import { useFetch } from '@/hooks/useApi';
import { Button } from '@/components/ui';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

interface FileAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('access_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  return headers;
}

export function FileUpload({ entityType, entityId }: { entityType: string; entityId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files, refetch } = useFetch<FileAttachment[]>(
    `/uploads?entityType=${entityType}&entityId=${entityId}`,
    [entityType, entityId],
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${API_URL}/uploads?entityType=${entityType}&entityId=${entityId}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: formData,
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message ?? '上傳失敗');
      }

      refetch();
    } catch (err: any) {
      alert(err.message || '上傳失敗');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此檔案？')) return;
    try {
      await fetch(`${API_URL}/uploads/${id}`, {
        method: 'DELETE',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      });
      refetch();
    } catch (err: any) {
      alert(err.message || '刪除失敗');
    }
  };

  const handleDownload = (id: string, name: string) => {
    const link = document.createElement('a');
    link.href = `${API_URL}/uploads/${id}/download`;
    link.download = name;
    // 需要帶 auth header，改用 fetch
    fetch(`${API_URL}/uploads/${id}/download`, { headers: getHeaders() })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h4 className="text-sm font-medium text-gray-700">附件</h4>
        <input
          ref={inputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '上傳中...' : '上傳檔案'}
        </Button>
      </div>

      {(!files || files.length === 0) ? (
        <p className="text-xs text-gray-400">尚無附件</p>
      ) : (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-sm text-gray-700 truncate">{f.originalName}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatSize(f.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(f.id, f.originalName)}
                  className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer"
                >
                  下載
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
