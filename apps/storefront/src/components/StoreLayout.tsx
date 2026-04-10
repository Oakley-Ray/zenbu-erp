import { Outlet, Link } from 'react-router';

/**
 * 商店 Layout — 頂部導覽 + 頁尾。
 * 品牌色和 Logo 之後從租戶 theme API 動態載入。
 */
export function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-800">
            LAYERFRAME Store
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link to="/products" className="hover:text-primary-600 transition-colors">
              商品
            </Link>
            <Link to="/cart" className="hover:text-primary-600 transition-colors">
              購物車
            </Link>
            <Link to="/login" className="hover:text-primary-600 transition-colors">
              登入
            </Link>
          </nav>
        </div>
      </header>

      {/* 主內容 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
          Powered by LAYERFRAME
        </div>
      </footer>
    </div>
  );
}
