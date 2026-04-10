/**
 * Storefront 首頁 — 之後會接 products API 顯示商品列表。
 */
export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          歡迎光臨
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          探索我們精心挑選的商品，享受最佳購物體驗。
        </p>
      </section>

      {/* 商品佔位 */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">熱門商品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl aspect-square flex items-center justify-center text-gray-400"
            >
              商品 {i}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
