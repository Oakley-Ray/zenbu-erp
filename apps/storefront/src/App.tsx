import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './pages/Home';
import { StoreLayout } from './components/StoreLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

/**
 * Storefront — 消費者前台商店。
 * 不用 Refine（那是給管理後台的），用 TanStack Query 搭配自訂 hooks。
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<HomePage />} />
            {/* 之後擴充：/products, /products/:id, /cart, /checkout */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
