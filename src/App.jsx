import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './components/context/AuthContext.jsx';
import { ChatProvider } from './components/context/ChatContext';
import { CartProvider } from './components/context/CartContext';
import { useGuestMode, setReturnPath } from './hooks/useGuestMode';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AIChat from './components/common/AIChat';
import NotificationListener from './components/common/NotificationListener';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import RequireRole from './components/RequireRole';
import LandingPage from './components/pages/LandingPage.jsx';
import AIAssistantPage from './components/pages/AIAssistantPage';
import HomePage from './components/pages/HomePage.jsx';
import CategoryPage from './components/pages/CategoryPage';
import SubcategoryPage from './components/pages/SubcategoryPage';
import CartPage from './components/pages/CartPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import AdminDashboard from './components/pages/AdminDashboard';
import BankDashboard from './components/pages/BankDashboard';
import ChatPage from './components/pages/ChatPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import ProfilePage from './components/pages/ProfilePage';
import LocationPage from './components/pages/LocationDetailPage';
import EquipmentDetailPage from './components/pages/EquipmentDetailPage';
import ServicePage from './components/pages/ServicePage';
import AddListingChoice from './components/pages/AddListingChoice.jsx';
import AddLocationForm from './components/forms/AddLocationForm.jsx';
import AddEquipmentForm from './components/forms/AddEquipmentForm.jsx';
import AddServiceForm from './components/forms/AddServiceForm.jsx';
import EditLocationForm from './components/forms/EditLocationForm.jsx';
import EditEquipmentForm from './components/forms/EditEquipmentForm.jsx';
import EditServiceForm from './components/forms/EditServiceForm.jsx';
import MarketplacePage from './components/marketplace/MarketplacePage';
import BankServiceDetail from './components/marketplace/BankServiceDetail.jsx';  // 🔥 yangi import
import { ThemeProvider } from './components/context/ThemeContext.jsx';
import PremiumPage from './components/pages/PremiumPage';
import GamePage from './components/game/GamePage.jsx';
import LessonsPage from './components/pages/LessonsPage';
import ServiceProviderDetailPage from './components/pages/ServiceProviderDetailPage';
import NotificationsPage from './components/pages/NotificationsPage.jsx';
import BusinessSystemPage from './components/business/BusinessSystemPage.jsx';
import BusinessDashboard from './components/pages/BusinessDashboard';
import BankServicesListPage from './components/pages/BankServicesListPage';
import AddVideoPostForm from './components/pages/AddVideoPostForm'
import BranchesPage from './components/pages/BranchesPage';
import SupplierStatsPage from './components/pages/SupplierStatsPage';
import MyOrdersPage from './components/pages/MyOrdersPage';
import ReceivedOrdersPage from './components/pages/ReceivedOrdersPage';
import PhysicPage from './components/pages/PhysicPage';
import PhysicCategoryPage from './components/pages/PhysicCategoryPage';

let appHasMounted = false;
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

function EntryGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const didCheck = useRef(false);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;
    if (!appHasMounted) {
      appHasMounted = true;
      const isAuthPage = AUTH_PATHS.includes(location.pathname);
      if (location.pathname !== '/' && !isAuthPage) {
        setReturnPath(location.pathname + location.search);
        navigate('/', { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}

// ============ LAYOUT ============
function Layout({ children }) {
  const location = useLocation();
  const noNavFooterPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const hideNavFooter = noNavFooterPaths.includes(location.pathname);

  return (
    <>
      {!hideNavFooter && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!hideNavFooter && <Footer />}
      <AIChat />
    </>
  );
}

// ============ MAIN ROUTES ============
function MainRoutes() {
  const { user, loading } = useAuth();
  const { isGuest } = useGuestMode();
  const canBrowse = Boolean(user) || isGuest;

  if (loading) {
    return <div className="loading-spinner">⏳ Yuklanmoqda...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={canBrowse ? <Layout><HomePage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/category/:level1" element={canBrowse ? <Layout><CategoryPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/subcategory/:level1/:level2" element={canBrowse ? <Layout><SubcategoryPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/location/:id" element={canBrowse ? <Layout><LocationPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/equipment/:id" element={canBrowse ? <Layout><EquipmentDetailPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/services/:slug" element={canBrowse ? <Layout><ServicePage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/cart" element={canBrowse ? <Layout><CartPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/marketplace" element={canBrowse ? <Layout><MarketplacePage /></Layout> : <Navigate to="/" replace />} />
      {/* 🔥 Yangi marshrut: bank xizmati tafsilotlari */}
      <Route path="/bank-service/:id" element={canBrowse ? <Layout><BankServiceDetail /></Layout> : <Navigate to="/" replace />} />
      <Route path="/ai-assistant" element={<AIAssistantPage />} />
      <Route path="/premium" element={<ProtectedRoute><Layout><PremiumPage /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><BusinessDashboard /></Layout></ProtectedRoute>} />
      <Route
        path="/bank-dashboard"
        element={
          <RequireRole allowedRoles={['bank_employee', 'admin']}>
            <Layout>
              <BankDashboard />
            </Layout>
          </RequireRole>
        }
      />
      <Route path="/bank-services" element={canBrowse ? <Layout><BankServicesListPage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/profile/:userId" element={canBrowse ? <Layout><ProfilePage /></Layout> : <Navigate to="/" replace />} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Layout><ChatPage /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout><NotificationsPage /></Layout></ProtectedRoute>} />
      <Route
        path="/admin-dashboard"
        element={
          <RequireRole allowedRoles={['admin']}>
            <Layout><AdminDashboard /></Layout>
          </RequireRole>
        }
      />
      <Route path="/add-listing" element={<ProtectedRoute><Layout><AddListingChoice /></Layout></ProtectedRoute>} />
      <Route path="/add-location" element={<ProtectedRoute><Layout><AddLocationForm /></Layout></ProtectedRoute>} />
      <Route path="/add-equipment" element={<ProtectedRoute><Layout><AddEquipmentForm /></Layout></ProtectedRoute>} />
      <Route path="/add-service" element={<ProtectedRoute><Layout><AddServiceForm /></Layout></ProtectedRoute>} />
      <Route path="/edit/location/:id" element={<ProtectedRoute><Layout><EditLocationForm /></Layout></ProtectedRoute>} />
      <Route path="/edit/equipment/:id" element={<ProtectedRoute><Layout><EditEquipmentForm /></Layout></ProtectedRoute>} />
      <Route path="/edit/service/:id" element={<ProtectedRoute><Layout><EditServiceForm /></Layout></ProtectedRoute>} />
      <Route path="/game" element={<ProtectedRoute><Layout><GamePage /></Layout></ProtectedRoute>} />
      <Route path="/lessons" element={<ProtectedRoute><Layout><LessonsPage /></Layout></ProtectedRoute>} />
      <Route path="/business" element={<ProtectedRoute><Layout><BusinessSystemPage /></Layout></ProtectedRoute>} />
      <Route path="/service-provider/:id" element={<ServiceProviderDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/add-video" element={<ProtectedRoute><Layout><AddVideoPostForm /></Layout></ProtectedRoute>} />
      <Route path="/my-branches" element={<ProtectedRoute><Layout><BranchesPage /></Layout></ProtectedRoute>} />
      <Route path="/supplier-stats" element={<ProtectedRoute><Layout><SupplierStatsPage /></Layout></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><Layout><MyOrdersPage /></Layout></ProtectedRoute>} />
      <Route path="/received-orders" element={<ProtectedRoute><Layout><ReceivedOrdersPage /></Layout></ProtectedRoute>} />
      <Route path="/physic" element={<Layout><PhysicPage /></Layout>} />
      <Route path="/physic/:categoryKey" element={<PhysicCategoryPage />} />
    </Routes>
  );
}

// ============ APP ============
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <BrowserRouter>
              <EntryGate>
                <NotificationListener />
                <MainRoutes />
              </EntryGate>
            </BrowserRouter>
            <ToastContainer position="top-right" autoClose={5000} theme="dark" />
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;