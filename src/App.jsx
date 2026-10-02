// App.jsx
import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './components/context/AuthContext.jsx';
import { ChatProvider } from './components/context/ChatContext';
import { CartProvider } from './components/context/CartContext';
import { ThemeProvider } from './components/context/ThemeContext.jsx';

import { useGuestMode, setReturnPath } from './hooks/useGuestMode';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import AIChat from './components/common/AIChat';
import NotificationListener from './components/common/NotificationListener';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ScrollToTop from './components/common/ScrollToTop';
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
import ServiceProviderDetailPage from './components/pages/ServiceProviderDetailPage';
import NotificationsPage from './components/pages/NotificationsPage.jsx';
import PremiumPage from './components/pages/PremiumPage';
import LessonsPage from './components/pages/LessonsPage';
import BusinessDashboard from './components/pages/BusinessDashboard';
import BankServicesListPage from './components/pages/BankServicesListPage';
import AddVideoPostForm from './components/pages/AddVideoPostForm';
import BranchesPage from './components/pages/BranchesPage';
import SupplierStatsPage from './components/pages/SupplierStatsPage';
import MyOrdersPage from './components/pages/MyOrdersPage';
import ReceivedOrdersPage from './components/pages/ReceivedOrdersPage';
import PhysicPage from './components/pages/PhysicPage';
import PhysicCategoryPage from './components/pages/PhysicCategoryPage';
import BroadcastAdPage from './components/pages/BroadcastAdPage';
import BecomeProviderPage from './components/pages/BecomeProviderPage.jsx';

import AddListingChoice from './components/pages/AddListingChoice.jsx';
import AddLocationForm from './components/forms/AddLocationForm.jsx';
import AddEquipmentForm from './components/forms/AddEquipmentForm.jsx';
import AddServiceForm from './components/forms/AddServiceForm.jsx';
import EditLocationForm from './components/forms/EditLocationForm.jsx';
import EditEquipmentForm from './components/forms/EditEquipmentForm.jsx';
import EditServiceForm from './components/forms/EditServiceForm.jsx';

import MarketplacePage from './components/marketplace/MarketplacePage';
import BankServiceDetail from './components/marketplace/BankServiceDetail.jsx';

import GamePage from './components/game/GamePage.jsx';
import BusinessSystemPage from './components/business/BusinessSystemPage.jsx';

import MarketplaceLocations from './components/pages/MarketplaceLocations';
import MarketplaceProductTypes from './components/pages/MarketplaceProductTypes';
import MarketplaceProductList from './components/pages/MarketplaceProductList';
import MarketplaceCatalogItems from './components/pages/MarketplaceCatalogItems';
import MarketplaceServiceCats from './components/pages/MarketplaceServiceCats';
import MarketplaceServiceList from './components/pages/MarketplaceServiceList';
import MarketplaceBank from './components/pages/MarketplaceBank';

/* ============================================================
   CONSTANTS
   ============================================================ */

let appHasMounted = false;

const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/* ============================================================
   ENTRY GATE
   Birinchi yuklanishda splash ko‘rsatiladi,
   keyin foydalanuvchi o‘zi ochgan sahifaga qaytadi.
   ============================================================ */

function EntryGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const didCheck = useRef(false);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;

    if (appHasMounted) return;
    appHasMounted = true;

    const isAuthPath = AUTH_PATHS.includes(location.pathname);

    if (location.pathname !== '/' && !isAuthPath) {
      const returnTo = location.pathname + location.search;

      setReturnPath(returnTo);

      /* Qaytish manzili LandingPage ga state orqali beriladi */
      navigate('/', {
        replace: true,
        state: { returnTo },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}

/* ============================================================
   LAYOUT
   ============================================================ */

function Layout({ children }) {
  const location = useLocation();
  const hideNavFooter = AUTH_PATHS.includes(location.pathname);

  return (
    <>
      {!hideNavFooter && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!hideNavFooter && <Footer />}
      <AIChat />
    </>
  );
}

/* ============================================================
   ROUTE HELPERS
   ============================================================ */

/* Foydalanuvchi yoki mehmon ko‘ra oladigan sahifa */
function BrowseRoute({ canBrowse, children }) {
  if (!canBrowse) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

/* Faqat tizimga kirgan foydalanuvchi uchun */
function PrivateRoute({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

/* Rol talab qiladigan sahifa */
function RoleRoute({ roles, children }) {
  return (
    <RequireRole allowedRoles={roles}>
      <Layout>{children}</Layout>
    </RequireRole>
  );
}

/* ============================================================
   MAIN ROUTES
   ============================================================ */

function MainRoutes() {
  const { user, loading } = useAuth();
  const { isGuest } = useGuestMode();

  const canBrowse = Boolean(user) || isGuest;

  if (loading) {
    return <div className="loading-spinner">⏳ Yuklanmoqda...</div>;
  }

  const browse = (page) => (
    <BrowseRoute canBrowse={canBrowse}>{page}</BrowseRoute>
  );

  const priv = (page) => <PrivateRoute>{page}</PrivateRoute>;

  const open = (page) => <Layout>{page}</Layout>;

  return (
    <Routes>
      {/* ===== LANDING ===== */}
      <Route path="/" element={<LandingPage />} />

      {/* ===== BROWSE ===== */}
      <Route path="/home" element={browse(<HomePage />)} />
      <Route path="/category/:level1" element={browse(<CategoryPage />)} />
      <Route path="/subcategory/:level1/:level2" element={browse(<SubcategoryPage />)} />
      <Route path="/location/:id" element={browse(<LocationPage />)} />
      <Route path="/equipment/:id" element={browse(<EquipmentDetailPage />)} />
      <Route path="/services/:slug" element={browse(<ServicePage />)} />
      <Route path="/service-provider/:id" element={open(<ServiceProviderDetailPage />)} />
      <Route path="/cart" element={browse(<CartPage />)} />
      <Route path="/profile/:userId" element={browse(<ProfilePage />)} />
      <Route path="/bank-services" element={browse(<BankServicesListPage />)} />
      <Route path="/bank-service/:id" element={browse(<BankServiceDetail />)} />

      {/* ===== AI ===== */}
      <Route path="/ai-assistant" element={<AIAssistantPage />} />

      {/* ===== PROTECTED ===== */}
      <Route path="/premium" element={priv(<PremiumPage />)} />
      <Route path="/dashboard" element={priv(<BusinessDashboard />)} />
      <Route path="/profile" element={priv(<ProfilePage />)} />
      <Route path="/chat" element={priv(<ChatPage />)} />
      <Route path="/notifications" element={priv(<NotificationsPage />)} />

      {/* ===== E’LON QO‘SHISH ===== */}
      <Route path="/add-listing" element={priv(<AddListingChoice />)} />
      <Route path="/add-location" element={priv(<AddLocationForm />)} />
      <Route path="/add-equipment" element={priv(<AddEquipmentForm />)} />
      <Route path="/add-service" element={priv(<AddServiceForm />)} />
      <Route path="/add-video" element={priv(<AddVideoPostForm />)} />

      {/* ===== XIZMAT KO‘RSATUVCHI BO‘LISH ===== */}
      <Route path="/become-provider" element={priv(<BecomeProviderPage />)} />

      {/* ===== EDIT ===== */}
      <Route path="/edit/location/:id" element={priv(<EditLocationForm />)} />
      <Route path="/edit/equipment/:id" element={priv(<EditEquipmentForm />)} />
      <Route path="/edit/service/:id" element={priv(<EditServiceForm />)} />

      {/* ===== GAME / LESSONS / BUSINESS ===== */}
      <Route path="/game" element={priv(<GamePage />)} />
      <Route path="/lessons" element={priv(<LessonsPage />)} />
      <Route path="/business" element={priv(<BusinessSystemPage />)} />

      {/* ===== BIZNES QO‘SHIMCHA ===== */}
      <Route path="/my-branches" element={priv(<BranchesPage />)} />
      <Route path="/supplier-stats" element={priv(<SupplierStatsPage />)} />
      <Route path="/my-orders" element={priv(<MyOrdersPage />)} />
      <Route path="/received-orders" element={priv(<ReceivedOrdersPage />)} />
      <Route path="/broadcast-ad" element={priv(<BroadcastAdPage />)} />

      {/* ===== BANK / ADMIN ===== */}
      <Route
        path="/bank-dashboard"
        element={
          <RoleRoute roles={['bank_employee', 'admin']}>
            <BankDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <RoleRoute roles={['admin']}>
            <AdminDashboard />
          </RoleRoute>
        }
      />

      {/* ===== AUTH ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ===== PHYSIC ===== */}
      <Route path="/physic" element={open(<PhysicPage />)} />
      <Route path="/physic/:categoryKey" element={open(<PhysicCategoryPage />)} />

      {/* ===== MARKETPLACE ===== */}
      <Route path="/marketplace" element={open(<MarketplacePage />)} />
      <Route path="/marketplace/locations" element={open(<MarketplaceLocations />)} />
      <Route path="/marketplace/products" element={open(<MarketplaceProductTypes />)} />
      <Route
        path="/marketplace/products/oziqovqat/:catalog"
        element={open(<MarketplaceCatalogItems />)}
      />
      <Route path="/marketplace/products/:type" element={open(<MarketplaceProductList />)} />
      <Route path="/marketplace/services" element={open(<MarketplaceServiceCats />)} />
      <Route path="/marketplace/services/:slug" element={open(<MarketplaceServiceList />)} />
      <Route path="/marketplace/bank" element={open(<MarketplaceBank />)} />

      {/* ===== 404 ===== */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

/* ============================================================
   APP
   ============================================================ */

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <BrowserRouter>
              <ScrollToTop />
              <EntryGate>
                <NotificationListener />
                <MainRoutes />
              </EntryGate>
            </BrowserRouter>

            <ToastContainer
              position="top-right"
              autoClose={5000}
              theme="dark"
            />
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;