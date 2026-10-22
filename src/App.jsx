// App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './components/context/AuthContext.jsx';
import { ChatProvider } from './components/context/ChatContext';
import { CartProvider } from './components/context/CartContext';
import { ThemeProvider } from './components/context/ThemeContext.jsx';
import OrderHistoryPage from './components/pages/OrderHistoryPage';


import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import AIChat from './components/common/AIChat';
import ActiveOrderBar from './components/common/ActiveOrderBar';
import NotificationListener from './components/common/NotificationListener';
import ZumoGuide from './components/common/ZumoGuide.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ScrollToTop from './components/common/ScrollToTop';
import RequireRole from './components/RequireRole';
import BusinessDirectionsPage from './components/pages/BusinessDirectionsPage.jsx';
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
import RequestDetailPage from './components/pages/RequestDetailPage';
import ProviderRequestsPage from './components/pages/ProviderRequestsPage';
import RequestPage from './components/pages/RequestPage';
import MyServiceRequestsPage from './components/pages/MyServiceRequestsPage';
import PostDetailPage from './components/pages/PostDetailPage';
import NotFoundPage from './components/pages/NotFoundPage';
import ComingSoonPage from './components/pages/ComingSoonPage';
import { Compass, Landmark } from 'lucide-react';

import AddListingChoice from './components/pages/AddListingChoice.jsx';
import AddLocationForm from './components/forms/AddLocationForm.jsx';
import AddEquipmentForm from './components/forms/AddEquipmentForm.jsx';
import AddServiceForm from './components/forms/AddServiceForm.jsx';
import EditLocationForm from './components/forms/EditLocationForm.jsx';
import EditEquipmentForm from './components/forms/EditEquipmentForm.jsx';
import EditServiceForm from './components/forms/EditServiceForm.jsx';

import BankServiceDetail from './components/marketplace/BankServiceDetail.jsx';

/* ============================================================
   MARKETPLACE
   ============================================================ */

import MarketplaceLayout from './components/marketplace/MarketplaceLayout';
import MarketplaceHome from './components/marketplace/MarketplaceHome';
import MarketplacePage from './components/marketplace/MarketplacePage';
import SavedListingsPage from './components/pages/SavedListingsPage.jsx';

import GamePage from './components/game/GamePage.jsx';
import BusinessSystemPage from './components/business/BusinessSystemPage.jsx';

import MarketplaceLocations from './components/pages/MarketplaceLocations';
import MarketplaceProductTypes from './components/pages/MarketplaceProductTypes';
import MarketplaceProductList from './components/pages/MarketplaceProductList';
import MarketplaceCatalogItems from './components/pages/MarketplaceCatalogItems';
import MarketplaceServiceCats from './components/pages/MarketplaceServiceCats';
import MarketplaceServiceList from './components/pages/MarketplaceServiceList';
import MarketplaceBank from './components/pages/MarketplaceBank';

import './styles/toast.css';

/* ============================================================
   CONSTANTS
   ============================================================ */

/* Auth sahifalar — navbar/footer yashiriladi */
const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/* Global navbar ko‘rsatilmaydigan sahifalar */
const HIDE_CHROME_PATHS = [
  '/home',
  '/chat',
  '/notifications',
  '/profile',
  '/add-video',
];

/* Hali ishga tushmagan bo'limlar — "Tez kunda" sahifasi ko'rsatiladi.
   Bo'lim tayyor bo'lganda shu yerda false qiling, asl sahifa qaytadi. */
const COMING_SOON = {
  businessDirections: true,
  bank: true,
};

const bankSoon = (
  <ComingSoonPage
    section="bank"
    icon={Landmark}
    title="Bank mahsulotlari"
    description="Kredit, QR to‘lov, kartalar va boshqa bank xizmatlariga onlayn ariza berish tez orada ishga tushadi."
  />
);

const directionsSoon = (
  <ComingSoonPage
    section="directions"
    icon={Compass}
    title="150+ biznes yo‘nalishi"
    description="Yo‘nalishingizni tanlang — kerakli joy, uskuna va xizmatlarni bitta joyda topasiz. Tez orada ishga tushadi."
  />
);

/* AIChat YASHIRILADIGAN sahifalar — bu yerda floating chat kerak emas */
const HIDE_AI_CHAT_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/ai-assistant', // to'liq sahifa AI allaqachon bor
];

/* ============================================================
   ENTRY GATE
   ============================================================ */

function EntryGate({ children }) {
  return children;
}

/* ============================================================
   LAYOUT
   ============================================================ */

function Layout({ children }) {
  const location = useLocation();

  /* Navbar/Footer yashiriladigan sahifalar:
     - Auth sahifalar (login, register, ...)
     - /home, /chat, /notifications, /profile, /add-video */
  const hideNavbar =
    AUTH_PATHS.includes(location.pathname) ||
    HIDE_CHROME_PATHS.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}

      {!hideNavbar && <ActiveOrderBar />}

      <main className="flex-grow">{children}</main>

      {!AUTH_PATHS.includes(location.pathname) &&
        (!hideNavbar || location.pathname === '/home') && <Footer />}
    </>
  );
}

/* ============================================================
   ROUTE HELPERS
   ============================================================ */

/* Ko'rish sahifalari hamma uchun ochiq — buyurtma, chat kabi amallar
   o'z sahifasida login so'raydi. */
function BrowseRoute({ children }) {
  return <Layout>{children}</Layout>;
}

function PrivateRoute({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function FullScreenRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function RoleRoute({ roles, children }) {
  return (
    <RequireRole allowedRoles={roles}>
      <Layout>{children}</Layout>
    </RequireRole>
  );
}

/* ============================================================
   GLOBAL AIChat WRAPPER — hamma joyda ko'rinadi (ba'zilarni hisobga olmaganda)
   ============================================================ */

function GlobalAIChat() {
  const location = useLocation();

  if (HIDE_AI_CHAT_PATHS.includes(location.pathname)) {
    return null;
  }

  return <AIChat />;
}

/* ============================================================
   MAIN ROUTES
   ============================================================ */

function MainRoutes() {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Yuklanmoqda...</div>;
  }

  const browse = (page) => <BrowseRoute>{page}</BrowseRoute>;

  const priv = (page) => <PrivateRoute>{page}</PrivateRoute>;
  const full = (page) => <FullScreenRoute>{page}</FullScreenRoute>;
  const open = (page) => <Layout>{page}</Layout>;

  /* Marketplace uchun yordamchi */
  // Each marketplace URL owns a fresh shell so its entrance animation/state
  // cannot stay attached to the previous page after client-side navigation.
  const mkt = (page) => (
    <MarketplaceLayout key={location.pathname}>{page}</MarketplaceLayout>
  );
  const marketplaceBrowse = mkt;

  return (
    <Routes>
      {/* ===== LANDING ===== */}
      <Route path="/" element={<LandingPage />} />

      {/* ===== BROWSE ===== */}
      <Route path="/home" element={browse(<HomePage />)} />
      <Route path="/saved" element={browse(<SavedListingsPage />)} />
      <Route path="/category/:level1" element={browse(<CategoryPage />)} />
      <Route
        path="/subcategory/:level1/:level2"
        element={browse(<SubcategoryPage />)}
      />
      <Route path="/location/:id" element={marketplaceBrowse(<LocationPage />)} />
      <Route path="/equipment/:id" element={marketplaceBrowse(<EquipmentDetailPage />)} />
      <Route path="/services/:slug" element={marketplaceBrowse(<ServicePage />)} />
      <Route
        path="/service-provider/:id"
        element={mkt(<ServiceProviderDetailPage />)}
      />

      {/* SAVAT — marketplace layout ichida */}
      <Route path="/cart" element={mkt(<CartPage />)} />

      <Route path="/profile/:userId" element={browse(<ProfilePage />)} />

      <Route path="/posts/:id" element={browse(<PostDetailPage />)} />

      <Route
        path="/bank-services"
        element={browse(COMING_SOON.bank ? bankSoon : <BankServicesListPage />)}
      />
      <Route path="/bank-service/:id" element={browse(COMING_SOON.bank ? bankSoon : <BankServiceDetail />)} />

      {/* ===== AI ===== */}
      <Route path="/ai-assistant" element={<AIAssistantPage />} />

      {/* ===== PROTECTED ===== */}
      <Route path="/premium" element={priv(<PremiumPage />)} />
      <Route path="/dashboard" element={priv(<BusinessDashboard />)} />
      <Route path="/profile" element={priv(<ProfilePage />)} />
      <Route path="/chat" element={priv(<ChatPage />)} />
      <Route path="/notifications" element={priv(<NotificationsPage />)} />

      {/* ===== REQUEST ===== */}
      <Route path="/request" element={full(<RequestPage />)} />
      <Route path="/my-requests" element={priv(<MyServiceRequestsPage />)} />
      <Route path="/requests/:id" element={full(<RequestDetailPage />)} />
      <Route
        path="/provider-requests"
        element={priv(<ProviderRequestsPage />)}
      />
      <Route
        path="/provider-requests/:id"
        element={full(<RequestDetailPage />)}
      />

      {/* ===== E'LON QO'SHISH ===== */}
      <Route path="/add-listing" element={priv(<AddListingChoice />)} />
      <Route path="/add-location" element={priv(<AddLocationForm />)} />
      <Route path="/add-equipment" element={priv(<AddEquipmentForm />)} />
      <Route path="/add-service" element={priv(<AddServiceForm />)} />
      <Route path="/add-video" element={priv(<AddVideoPostForm />)} />

      {/* ===== BECOME PROVIDER ===== */}
      <Route
        path="/become-provider"
        element={priv(<BecomeProviderPage />)}
      />

      {/* ===== EDIT ===== */}
      <Route
        path="/edit/location/:id"
        element={priv(<EditLocationForm />)}
      />
      <Route
        path="/edit/equipment/:id"
        element={priv(<EditEquipmentForm />)}
      />
      <Route path="/edit/service/:id" element={priv(<EditServiceForm />)} />

      {/* ===== GAME / LESSONS / BUSINESS ===== */}
      <Route path="/game" element={priv(<GamePage />)} />
      <Route path="/lessons" element={priv(<LessonsPage />)} />
      <Route path="/business" element={priv(<BusinessSystemPage />)} />

      {/* ===== 150+ BIZNES YO'NALISH — tanlash sahifasi ===== */}
      <Route
        path="/business-directions"
        element={COMING_SOON.businessDirections ? open(directionsSoon) : <BusinessDirectionsPage />}
      />

      {/* ===== BIZNES ===== */}
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
      <Route
        path="/physic/:categoryKey"
        element={open(<PhysicCategoryPage />)}
      />

      {/* ========================================================
          ===== MARKETPLACE (Yandex Go uslubi) =====
          ======================================================== */}

      <Route path="/marketplace" element={mkt(<MarketplaceHome />)} />
      <Route path="/marketplace/all" element={mkt(<MarketplacePage />)} />

      <Route
        path="/marketplace/profile"
        element={mkt(<ProfilePage />)}
      />

      <Route
        path="/marketplace/locations"
        element={mkt(<MarketplaceLocations />)}
      />
      <Route
        path="/marketplace/products"
        element={mkt(<MarketplaceProductTypes />)}
      />
      <Route
        path="/marketplace/products/oziqovqat/:catalog"
        element={mkt(<MarketplaceCatalogItems />)}
      />
      <Route
        path="/marketplace/products/:type"
        element={mkt(<MarketplaceProductList />)}
      />
      <Route
        path="/marketplace/services"
        element={mkt(<MarketplaceServiceCats />)}
      />
      <Route
        path="/marketplace/services/:slug"
        element={mkt(<MarketplaceServiceList />)}
      />
      <Route path="/marketplace/bank" element={mkt(COMING_SOON.bank ? bankSoon : <MarketplaceBank />)} />

      <Route path="/history" element={priv(<OrderHistoryPage />)} />

      {/* ===== 404 ===== */}
      <Route path="*" element={open(<NotFoundPage />)} />
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

              {/* ✅ GLOBAL AI CHAT — hamma sahifada ko'rinadi */}
              <ZumoGuide />
              <GlobalAIChat />
            </BrowserRouter>

            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss={false}
              draggable
              pauseOnHover
              theme="dark"
              limit={3}
              toastClassName="gru-toast"
            />
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
