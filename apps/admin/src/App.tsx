import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/react-router';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router';
import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ProductListPage } from './pages/products/ProductList';
import { ProductFormPage } from './pages/products/ProductForm';
import { OrderListPage } from './pages/orders/OrderList';
import { OrderFormPage } from './pages/orders/OrderForm';
import { OrderDetailPage } from './pages/orders/OrderDetail';
import { InventoryListPage } from './pages/inventory/InventoryList';
import { CustomerListPage } from './pages/customers/CustomerList';
import { QuoteListPage } from './pages/logistics/QuoteList';
import { CreateQuotePage } from './pages/logistics/CreateQuote';
import { TransactionListPage } from './pages/payments/TransactionList';
import { PaymentConfigPage } from './pages/payments/PaymentConfig';
import { UserListPage } from './pages/users/UserList';
import { UserFormPage } from './pages/users/UserForm';

// Project Pages
import { ProjectListPage } from './pages/project/ProjectList';
import { ProjectFormPage } from './pages/project/ProjectForm';
import { ProjectDetailPage } from './pages/project/ProjectDetail';

// Procurement Pages
import { SupplierListPage } from './pages/procurement/suppliers/SupplierList';
import { SupplierFormPage } from './pages/procurement/suppliers/SupplierForm';
import { SupplierDetailPage } from './pages/procurement/suppliers/SupplierDetail';
import { PurchaseOrderListPage } from './pages/procurement/purchase-orders/PurchaseOrderList';
import { PurchaseOrderFormPage } from './pages/procurement/purchase-orders/PurchaseOrderForm';
import { PurchaseOrderDetailPage } from './pages/procurement/purchase-orders/PurchaseOrderDetail';
import { GoodsReceiptListPage } from './pages/procurement/goods-receipts/GoodsReceiptList';
import { GoodsReceiptFormPage } from './pages/procurement/goods-receipts/GoodsReceiptForm';
import { ReturnListPage } from './pages/procurement/returns/ReturnList';
import { RfqListPage } from './pages/procurement/rfq/RfqList';
import { RfqFormPage } from './pages/procurement/rfq/RfqForm';
import { RfqDetailPage } from './pages/procurement/rfq/RfqDetail';

function App() {
  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider}
        authProvider={authProvider}
        resources={[
          { name: 'dashboard', list: '/' },
          { name: 'products', list: '/products', create: '/products/create', edit: '/products/edit/:id' },
          { name: 'orders', list: '/orders', create: '/orders/create', show: '/orders/:id' },
          { name: 'inventory', list: '/inventory' },
          { name: 'customers', list: '/customers' },
          // 採購管理
          { name: 'suppliers', list: '/procurement/suppliers', create: '/procurement/suppliers/create', show: '/procurement/suppliers/:id', edit: '/procurement/suppliers/edit/:id' },
          { name: 'purchase-orders', list: '/procurement/purchase-orders', create: '/procurement/purchase-orders/create', show: '/procurement/purchase-orders/:id' },
          { name: 'goods-receipts', list: '/procurement/goods-receipts', create: '/procurement/goods-receipts/create' },
          { name: 'rfq', list: '/procurement/rfq', create: '/procurement/rfq/create', show: '/procurement/rfq/:id' },
          { name: 'returns', list: '/procurement/returns' },
          // 專案管理
          { name: 'projects', list: '/project', create: '/project/create', show: '/project/:id', edit: '/project/edit/:id' },
          // 物流與金流
          { name: 'logistics', list: '/logistics', create: '/logistics/create' },
          { name: 'transactions', list: '/payments/transactions' },
          { name: 'payment-config', list: '/payments/config' },
          { name: 'users', list: '/users', create: '/users/create', edit: '/users/edit/:id' },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <Layout>
                <Outlet />
              </Layout>
            }
          >
            {/* 儀表板 */}
            <Route index element={<DashboardPage />} />

            {/* 商品管理 */}
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/create" element={<ProductFormPage />} />
            <Route path="products/edit/:id" element={<ProductFormPage />} />

            {/* 訂單管理 */}
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/create" element={<OrderFormPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />

            {/* 庫存管理 */}
            <Route path="inventory" element={<InventoryListPage />} />

            {/* 客戶管理 */}
            <Route path="customers" element={<CustomerListPage />} />

            {/* 採購管理 */}
            <Route path="procurement/suppliers" element={<SupplierListPage />} />
            <Route path="procurement/suppliers/create" element={<SupplierFormPage />} />
            <Route path="procurement/suppliers/edit/:id" element={<SupplierFormPage />} />
            <Route path="procurement/suppliers/:id" element={<SupplierDetailPage />} />
            <Route path="procurement/purchase-orders" element={<PurchaseOrderListPage />} />
            <Route path="procurement/purchase-orders/create" element={<PurchaseOrderFormPage />} />
            <Route path="procurement/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="procurement/goods-receipts" element={<GoodsReceiptListPage />} />
            <Route path="procurement/goods-receipts/create" element={<GoodsReceiptFormPage />} />
            <Route path="procurement/returns" element={<ReturnListPage />} />
            <Route path="procurement/rfq" element={<RfqListPage />} />
            <Route path="procurement/rfq/create" element={<RfqFormPage />} />
            <Route path="procurement/rfq/:id" element={<RfqDetailPage />} />

            {/* 專案管理 */}
            <Route path="project" element={<ProjectListPage />} />
            <Route path="project/create" element={<ProjectFormPage />} />
            <Route path="project/edit/:id" element={<ProjectFormPage />} />
            <Route path="project/:id" element={<ProjectDetailPage />} />

            {/* 物流報價 */}
            <Route path="logistics" element={<QuoteListPage />} />
            <Route path="logistics/create" element={<CreateQuotePage />} />

            {/* 金流 */}
            <Route path="payments/transactions" element={<TransactionListPage />} />
            <Route path="payments/config" element={<PaymentConfigPage />} />

            {/* 使用者管理 */}
            <Route path="users" element={<UserListPage />} />
            <Route path="users/create" element={<UserFormPage />} />
            <Route path="users/edit/:id" element={<UserFormPage />} />
          </Route>
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}

export default App;
