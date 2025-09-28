import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { DataProvider } from './contexts/DataContext';
import { LicenseProvider, useLicense } from './contexts/LicenseContext';
import { UserManagementProvider } from './contexts/UserManagementContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { StockProvider } from './contexts/StockContext';
import { OrderProvider } from './contexts/OrderContext';
import { SupplierProvider } from './contexts/SupplierContext';

import ExpirationNotification from './components/auth/ExpirationNotification';
import ExpiredAccountModal from './components/auth/ExpiredAccountModal';
import EmailVerificationBanner from './components/auth/EmailVerificationBanner';
import HomePage from './components/home/HomePage';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import GlobalSearch from './components/layout/GlobalSearch';
import NotificationCenter from './components/layout/NotificationCenter';
import InvoicesList from './components/invoices/InvoicesList';
import CreateInvoice from './components/invoices/CreateInvoice';
import QuotesList from './components/quotes/QuotesList';
import CreateQuote from './components/quotes/CreateQuote';
import ClientsList from './components/clients/ClientsList';
import ProductsList from './components/products/ProductsList';
import Settings from './components/settings/Settings';
import Reports from './components/reports/Reports';
import LicenseAlert from './components/license/LicenseAlert';
import UpgradePage from './components/license/UpgradePage';
import ExpiryAlert from './components/license/ExpiryAlert';
import ProUpgradeSuccess from './components/license/ProUpgradeSuccess';
import AdminDashboard from './components/admin/AdminDashboard';
import StockManagement from './components/stock/StockManagement';
import HRManagement from './components/hr/HRManagement';
import SupplierManagement from './components/suppliers/SupplierManagement';
import SuppliersSection from './components/suppliers/SuppliersSection';
import AccountManagement from './components/account/AccountManagement';
import ProjectManagement from './components/projects/ProjectManagement';
import OrdersList from './components/orders/OrdersList';
import CreateOrder from './components/orders/CreateOrder';
import OrderDetail from './components/orders/OrderDetail';
import EditOrder from './components/orders/EditOrder';
import EmailVerificationPage from './components/auth/EmailVerificationPage';
import EmailActionPage from './components/auth/EmailActionPage';

/* --- Hook utilitaire: savoir si on est en ≥ lg (1024px) --- */
function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined') && window.matchMedia(query).matches;
  const [matches, setMatches] = useState<boolean>(get());
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function AppContent() {
  const { user, isAuthenticated, showExpiryAlert, setShowExpiryAlert, expiredDate, subscriptionStatus } = useAuth();
  const { showSuccessModal, setShowSuccessModal, upgradeExpiryDate } = useLicense();

  const isLg = useMediaQuery('(min-width:1024px)');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => (typeof window !== 'undefined') ? window.matchMedia('(min-width:1024px)').matches : true);
  const [showUpgradePage, setShowUpgradePage] = useState(false);
  const [showExpirationNotification, setShowExpirationNotification] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [isRenewalFlow, setIsRenewalFlow] = useState(false);
  const [showBlockedUserModal, setShowBlockedUserModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  /* Pourquoi: synchroniser l'état par défaut avec le breakpoint */
  useEffect(() => { setSidebarOpen(isLg); }, [isLg]);

  /* Pourquoi: éviter que la page scrolle sous le drawer mobile */
  useEffect(() => {
    const html = document.documentElement;
    if (!isLg && sidebarOpen) html.style.overflow = 'hidden';
    else html.style.overflow = '';
  }, [isLg, sidebarOpen]);

  useEffect(() => {
    if (subscriptionStatus.shouldShowNotification) setShowExpirationNotification(true);
    if (subscriptionStatus.isExpired && user?.isAdmin) setShowExpiredModal(true);
    if (user && !user.isAdmin && user.email !== 'admin@facturati.ma') {
      const isCompanyProExpired = user.company.subscription !== 'pro' ||
        (user.company.expiryDate && new Date(user.company.expiryDate) < new Date());
      if (isCompanyProExpired) setShowBlockedUserModal(true);
    }
  }, [subscriptionStatus, user]);

  const handleRenewSubscription = () => {
    setShowExpirationNotification(false);
    setIsRenewalFlow(true);
    setShowUpgradePage(true);
  };

  const handleDismissNotification = () => {
    setShowExpirationNotification(false);
    localStorage.setItem('dismissedExpirationNotification', new Date().toISOString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedExpirationNotification');
    if (dismissed) {
      const hoursDiff = (Date.now() - new Date(dismissed).getTime()) / 36e5;
      if (hoursDiff < 24) setShowExpirationNotification(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
        setShowNotifications(false);
        if (!isLg) setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLg]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/verify-email-success" element={<EmailActionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  if (user?.email === 'admin@facturati.ma') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <>
      <EmailVerificationBanner />

      {/* Layout global */}
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 lg:flex overflow-x-hidden">
        <LicenseAlert onUpgrade={() => setShowUpgradePage(true)} />

        {/* --- SIDEBAR: drawer mobile + colonne desktop --- */}
        <div
          className={
            // Pourquoi: drawer mobile (fixed + translate), colonne en ≥lg avec largeur 64/16
            `fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
             transition-transform duration-200 ease-out
             ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
             lg:static lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}`
          }
        >
          <Sidebar
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            onUpgrade={() => setShowUpgradePage(true)}
          />
        </div>

        {/* Overlay mobile pour fermer le drawer */}
        {!isLg && sidebarOpen && (
          <button
            aria-label="Fermer le menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* --- CONTENU --- */}
        <div
          className={
            // Pourquoi: marge gauche seulement en desktop pour laisser la place à la sidebar
            `flex-1 w-full transition-[margin] duration-200
             ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`
          }
        >
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onOpenSearch={() => setShowGlobalSearch(true)}
            onOpenNotifications={() => setShowNotifications(true)}
          />

          <main className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen max-w-screen-xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/invoices" element={<InvoicesList />} />
              <Route path="/invoices/create" element={<CreateInvoice />} />
              <Route path="/quotes" element={<QuotesList />} />
              <Route path="/quotes/create" element={<CreateQuote />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/products" element={<ProductsList />} />
              <Route path="/suppliers" element={<SuppliersSection />} />
              <Route path="/stock-management" element={<StockManagement />} />
              <Route path="/supplier-management" element={<SupplierManagement />} />
              <Route path="/hr-management" element={<HRManagement />} />
              <Route path="/project-management" element={<ProjectManagement />} />
              <Route path="/account-management" element={<AccountManagement />} />
              <Route path="/commandes" element={<OrdersList />} />
              <Route path="/commandes/nouveau" element={<CreateOrder />} />
              <Route path="/commandes/:id" element={<OrderDetail />} />
              <Route path="/commandes/:id/modifier" element={<EditOrder />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>

        {/* UI annexes */}
        {showExpirationNotification && subscriptionStatus.shouldShowNotification && (
          <ExpirationNotification
            daysRemaining={subscriptionStatus.daysRemaining}
            onRenew={handleRenewSubscription}
            onDismiss={handleDismissNotification}
          />
        )}

        <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
        <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        {showUpgradePage && (
          <UpgradePage
            onClose={() => { setShowUpgradePage(false); setIsRenewalFlow(false); }}
            isRenewal={isRenewalFlow}
          />
        )}

        {showExpiryAlert && expiredDate && (
          <ExpiryAlert
            isOpen={showExpiryAlert}
            onRenew={() => { setShowExpiryAlert(false); setIsRenewalFlow(true); setShowUpgradePage(true); }}
            onLater={() => setShowExpiryAlert(false)}
            expiryDate={expiredDate}
          />
        )}

        {showSuccessModal && upgradeExpiryDate && (
          <ProUpgradeSuccess
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            expiryDate={upgradeExpiryDate}
          />
        )}

        {subscriptionStatus.isExpired && user?.isAdmin && (
          <ExpiredAccountModal
            isOpen={!!subscriptionStatus.isExpired}
            onClose={() => {}}
            isAdmin={true}
            expiryDate={subscriptionStatus.expiryDate || ''}
          />
        )}

        {showBlockedUserModal && user && !user.isAdmin && (
          <ExpiredAccountModal
            isOpen={showBlockedUserModal}
            onClose={() => setShowBlockedUserModal(false)}
            isAdmin={false}
            expiryDate={user.company.expiryDate || ''}
          />
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <UserManagementProvider>
              <OrderProvider>
                <StockProvider>
                  <SupplierProvider>
                    <DataProvider>
                      <LicenseProvider>
                        <AppContent />
                      </LicenseProvider>
                    </DataProvider>
                  </SupplierProvider>
                </StockProvider>
              </OrderProvider>
            </UserManagementProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;