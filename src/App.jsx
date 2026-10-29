import { lazy, Suspense, useLayoutEffect } from 'react';
// App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
// 15 ta sahifa (login, sharhlar, ...) react-hot-toast ishlatadi — uning Toaster'i ham kerak
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './components/context/AuthContext.jsx';
import { ChatProvider } from './components/context/ChatContext';
import { CartProvider } from './components/context/CartContext';
import { ThemeProvider } from './components/context/ThemeContext.jsx';
const OrderHistoryPage = lazy(() => import('./components/pages/OrderHistoryPage'));


import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import AIChat from './components/common/AIChat';
import ActiveOrderBar from './components/common/ActiveOrderBar';
import NotificationListener from './components/common/NotificationListener';
import ZumoGuide from './components/common/ZumoGuide.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ScrollToTop from './components/common/ScrollToTop';
import RequireRole from './components/RequireRole';
const BusinessDirectionsPage = lazy(() => import('./components/pages/BusinessDirectionsPage.jsx'));
import LandingPage from './components/pages/LandingPage.jsx';
const AIAssistantPage = lazy(() => import('./components/pages/AIAssistantPage'));
import HomePage from './components/pages/HomePage.jsx';
// CategoryPage / SubcategoryPage — 150+ biznes yo'nalishi uchun, u "Tez kunda" bo'lguncha ulanmagan
import CategoryRedirect from './components/pages/CategoryRedirect';
const CartPage = lazy(() => import('./components/pages/CartPage'));
const LoginPage = lazy(() => import('./components/pages/LoginPage'));
const RegisterPage = lazy(() => import('./components/pages/RegisterPage'));
const AdminDashboard = lazy(() => import('./components/pages/AdminDashboard'));
const BankDashboard = lazy(() => import('./components/pages/BankDashboard'));
const ChatPage = lazy(() => import('./components/pages/ChatPage'));
const ForgotPasswordPage = lazy(() => import('./components/pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./components/pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./components/pages/ProfilePage'));
const LocationPage = lazy(() => import('./components/pages/LocationDetailPage'));
const EquipmentDetailPage = lazy(() => import('./components/pages/EquipmentDetailPage'));
const ServicePage = lazy(() => import('./components/pages/ServicePage'));
const ServiceProviderDetailPage = lazy(() => import('./components/pages/ServiceProviderDetailPage'));
const ReviewsPage = lazy(() => import('./components/pages/ReviewsPage'));
const NotificationsPage = lazy(() => import('./components/pages/NotificationsPage.jsx'));
const PremiumPage = lazy(() => import('./components/pages/PremiumPage'));
const LessonsPage = lazy(() => import('./components/pages/LessonsPage'));
const BusinessDashboard = lazy(() => import('./components/pages/BusinessDashboard'));
const BankServicesListPage = lazy(() => import('./components/pages/BankServicesListPage'));
const AddVideoPostForm = lazy(() => import('./components/pages/AddVideoPostForm'));
const BranchesPage = lazy(() => import('./components/pages/BranchesPage'));
const SupplierStatsPage = lazy(() => import('./components/pages/SupplierStatsPage'));
const MyOrdersPage = lazy(() => import('./components/pages/MyOrdersPage'));
const ReceivedOrdersPage = lazy(() => import('./components/pages/ReceivedOrdersPage'));
const PhysicPage = lazy(() => import('./components/pages/PhysicPage'));
const PhysicCategoryPage = lazy(() => import('./components/pages/PhysicCategoryPage'));
const BroadcastAdPage = lazy(() => import('./components/pages/BroadcastAdPage'));
const BecomeProviderPage = lazy(() => import('./components/pages/BecomeProviderPage.jsx'));
const RequestDetailPage = lazy(() => import('./components/pages/RequestDetailPage'));
const ProviderRequestsPage = lazy(() => import('./components/pages/ProviderRequestsPage'));
const RequestPage = lazy(() => import('./components/pages/RequestPage'));
const MyServiceRequestsPage = lazy(() => import('./components/pages/MyServiceRequestsPage'));
const PostDetailPage = lazy(() => import('./components/pages/PostDetailPage'));
const NotFoundPage = lazy(() => import('./components/pages/NotFoundPage'));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage'));
const RequestDonePage = lazy(() => import('./components/pages/RequestDonePage'));
const ComingSoonPage = lazy(() => import('./components/pages/ComingSoonPage'));
import { Compass, Landmark } from 'lucide-react';

const AddListingChoice = lazy(() => import('./components/pages/AddListingChoice.jsx'));
const AddLocationForm = lazy(() => import('./components/forms/AddLocationForm.jsx'));
const AddEquipmentForm = lazy(() => import('./components/forms/AddEquipmentForm.jsx'));
const EditLocationForm = lazy(() => import('./components/forms/EditLocationForm.jsx'));
const EditEquipmentForm = lazy(() => import('./components/forms/EditEquipmentForm.jsx'));
const EditServiceForm = lazy(() => import('./components/forms/EditServiceForm.jsx'));

const BankServiceDetail = lazy(() => import('./components/marketplace/BankServiceDetail.jsx'));

/* ============================================================
   MARKETPLACE
   ============================================================ */

import MarketplaceLayout from './components/marketplace/MarketplaceLayout';
const MarketplaceHome = lazy(() => import('./components/marketplace/MarketplaceHome'));
const MarketplacePage = lazy(() => import('./components/marketplace/MarketplacePage'));
const MarketplaceCatalogPage = lazy(() => import('./components/pages/MarketplaceCatalogPage.jsx'));
const SavedListingsPage = lazy(() => import('./components/pages/SavedListingsPage.jsx'));

const GamePage = lazy(() => import('./components/game/GamePage.jsx'));
const BusinessSystemPage = lazy(() => import('./components/business/BusinessSystemPage.jsx'));

const MarketplaceLocations = lazy(() => import('./components/pages/MarketplaceLocations'));
const MarketplaceProductTypes = lazy(() => import('./components/pages/MarketplaceProductTypes'));
const MarketplaceProductList = lazy(() => import('./components/pages/MarketplaceProductList'));
const MarketplaceCatalogItems = lazy(() => import('./components/pages/MarketplaceCatalogItems'));
const MarketplaceServiceCats = lazy(() => import('./components/pages/MarketplaceServiceCats'));
const MarketplaceServiceList = lazy(() => import('./components/pages/MarketplaceServiceList'));
const MarketplaceBank = lazy(() => import('./components/pages/MarketplaceBank'));

import './styles/toast.css';

import { T } from './components/utils/T';
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
  '/admin-dashboard',
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
    title={T('Bank mahsulotlari')}
    description={T('Kredit, QR to‘lov, kartalar va boshqa bank xizmatlariga onlayn ariza berish tez orada ishga tushadi.')}
  />
);

const directionsSoon = (
  <ComingSoonPage
    section="directions"
    icon={Compass}
    title={T('150+ biznes yo‘nalishi')}
    description={T('Yo‘nalishingizni tanlang — kerakli joy, uskuna va xizmatlarni bitta joyda topasiz. Tez orada ishga tushadi.')}
  />
);

/* AIChat YASHIRILADIGAN sahifalar — bu yerda floating chat kerak emas */
const HIDE_AI_CHAT_PATHS = [
  '/login',
  '/admin-dashboard',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/ai-assistant', // to'liq sahifa AI allaqachon bor
  '/request',
  '/become-provider',
];

/* Pastida asosiy amal tugmasi bor oqimlar — AI tugmasi uni to'sib qo'ymasin */
const HIDE_AI_CHAT_PREFIXES = ['/requests/', '/provider-requests/'];

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
    HIDE_CHROME_PATHS.includes(location.pathname) ||
    location.pathname.startsWith('/profile/');

  useLayoutEffect(() => {
    document.body.classList.toggle('no-global-navbar-offset', hideNavbar);
    return () => document.body.classList.remove('no-global-navbar-offset');
  }, [hideNavbar]);

  return (
    <>
      {!hideNavbar && <Navbar />}

      {/* Faol buyurtma — Yandex Go kabi faqat bosh sahifada, pastda suzib turadi */}
      {location.pathname === '/home' && <ActiveOrderBar floating />}

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

  if (
    HIDE_AI_CHAT_PATHS.includes(location.pathname) ||
    HIDE_AI_CHAT_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))
  ) {
    return null;
  }

  return <AIChat />;
}

/* ============================================================
   MAIN ROUTES
   ============================================================ */

// Sahifa bo'lagi yuklanayotgandagi yengil ko'rsatkich
function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label={T('Yuklanmoqda...')}>
      <span className="page-loader__dot" />
    </div>
  );
}

function MainRoutes() {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">{T('Yuklanmoqda...')}</div>;
  }

  // Sahifalar alohida bo'lak bo'lib yuklanadi (lazy) — yuklanayotganda navbar/layout joyida qoladi
  const lazyPage = (page) => <Suspense fallback={<PageLoader />}>{page}</Suspense>;

  const browse = (page) => <BrowseRoute>{lazyPage(page)}</BrowseRoute>;

  const priv = (page) => <PrivateRoute>{lazyPage(page)}</PrivateRoute>;
  const full = (page) => <FullScreenRoute>{lazyPage(page)}</FullScreenRoute>;
  const open = (page) => <Layout>{lazyPage(page)}</Layout>;

  /* Marketplace uchun yordamchi */
  // Each marketplace URL owns a fresh shell so its entrance animation/state
  // cannot stay attached to the previous page after client-side navigation.
  const mkt = (page) => (
    <MarketplaceLayout key={location.pathname}>{lazyPage(page)}</MarketplaceLayout>
  );
  const marketplaceBrowse = mkt;
  // E'lon qo'shish sahifalari — marketplace navbar'i bilan, faqat tizimga kirganlar uchun
  const mktPriv = (page) => <ProtectedRoute>{mkt(page)}</ProtectedRoute>;

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ===== LANDING ===== */}
      <Route path="/" element={<LandingPage />} />

      {/* ===== BROWSE ===== */}
      <Route path="/home" element={browse(<HomePage />)} />
      <Route path="/saved" element={marketplaceBrowse(<SavedListingsPage />)} />
      {/* Kategoriyalar — marketplace tovar kategoriyalari (eski havolalar yo'naltiriladi) */}
      <Route path="/category/:level1" element={<CategoryRedirect />} />
      <Route path="/subcategory/:level1/:level2" element={<CategoryRedirect />} />
      <Route path="/location/:id" element={marketplaceBrowse(<LocationPage />)} />
      <Route path="/equipment/:id" element={marketplaceBrowse(<EquipmentDetailPage />)} />
      <Route path="/reviews/:type/:id" element={lazyPage(<ReviewsPage />)} />
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
      <Route path="/premium" element={marketplaceBrowse(<PremiumPage />)} />
      <Route path="/dashboard" element={priv(<BusinessDashboard />)} />
      <Route path="/profile" element={priv(<ProfilePage />)} />
      {/* Sozlamalar mehmonlarga ham ochiq (mavzu, til) — hisob qismlari faqat kirganlarga */}
      <Route path="/settings" element={lazyPage(<SettingsPage />)} />
      <Route path="/chat" element={priv(<ChatPage />)} />
      <Route path="/notifications" element={priv(<NotificationsPage />)} />

      {/* ===== REQUEST ===== */}
      <Route path="/request" element={full(<RequestPage />)} />
      <Route path="/my-requests" element={mktPriv(<MyServiceRequestsPage />)} />
      <Route path="/requests/:id" element={full(<RequestDetailPage />)} />
      <Route path="/requests/:id/done" element={full(<RequestDonePage />)} />
      <Route path="/provider-requests/:id/done" element={full(<RequestDonePage />)} />
      <Route
        path="/provider-requests"
        element={mktPriv(<ProviderRequestsPage />)}
      />
      <Route
        path="/provider-requests/:id"
        element={full(<RequestDetailPage />)}
      />

      {/* ===== E'LON QO'SHISH ===== */}
      <Route path="/add-listing" element={mktPriv(<AddListingChoice />)} />
      <Route path="/add-location" element={mktPriv(<AddLocationForm />)} />
      <Route path="/add-equipment" element={mktPriv(<AddEquipmentForm />)} />
      {/* Xizmat e'loni = usta/xizmat ko'rsatuvchi profili (backend taksonomiyasi bilan) */}
      <Route path="/add-service" element={mktPriv(<BecomeProviderPage />)} />
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
      <Route path="/my-orders" element={mktPriv(<MyOrdersPage />)} />
      <Route path="/received-orders" element={mktPriv(<ReceivedOrdersPage />)} />
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
      <Route path="/catalog" element={mkt(<MarketplaceCatalogPage />)} />
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

      <Route path="/history" element={mktPriv(<OrderHistoryPage />)} />

      {/* ===== 404 ===== */}
      <Route path="*" element={open(<NotFoundPage />)} />
    </Routes>
    </Suspense>
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

            <Toaster position="top-center" toastOptions={{ duration: 3500, style: { borderRadius: 14, fontWeight: 600 } }} containerStyle={{ top: 'calc(12px + env(safe-area-inset-top))' }} />
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
