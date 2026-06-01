// Main App component with all routes
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import TrackOrder from './pages/TrackOrder';
import FAQ from './pages/FAQ';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';

import AdminCustomers from './pages/admin/Customers';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminReviews from './pages/admin/Reviews';
import AdminExpenses from './pages/admin/Expenses';
import AdminBills from './pages/admin/Bills';
import AdminSettings from './pages/admin/Settings';
import AdminFeedback from './pages/admin/Feedback';
import AdminOrders from './pages/admin/Orders';
import AdminEnquiries from './pages/admin/Enquiries';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import BulkInquiry from './pages/BulkInquiry';
import PartnerProgram from './pages/PartnerProgram';
import PayOrder from './pages/PayOrder';
import MyPayments from './pages/MyPayments';

// Protected route wrapper
function ProtectedRoute({ children, adminRequired }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminRequired && user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/track-order" element={<TrackOrder />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/cart" element={<Navigate to="/" replace />} />
      <Route path="/checkout" element={<Navigate to="/" replace />} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
      <Route path="/my-orders" element={<Navigate to="/" replace />} />
      <Route path="/bulk-inquiry" element={<BulkInquiry />} />
      <Route path="/partner-program" element={<PartnerProgram />} />
      <Route path="/pay-order/:token" element={<PayOrder />} />
      <Route path="/my-payments" element={<ProtectedRoute><MyPayments /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute adminRequired><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute adminRequired><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute adminRequired><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/enquiries" element={<ProtectedRoute adminRequired><AdminEnquiries /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute adminRequired><AdminCustomers /></ProtectedRoute>} />
      <Route path="/admin/suppliers" element={<ProtectedRoute adminRequired><AdminSuppliers /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute adminRequired><AdminReviews /></ProtectedRoute>} />
      <Route path="/admin/expenses" element={<ProtectedRoute adminRequired><AdminExpenses /></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute adminRequired><AdminFeedback /></ProtectedRoute>} />
      <Route path="/admin/bills" element={<ProtectedRoute adminRequired><AdminBills /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminRequired><AdminSettings /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
