// ==============================
// src/contexts/AuthContext.tsx
// ==============================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ManagedUser } from './UserManagementContext';

interface Company {
  name: string;
  ice: string;
  if: string;
  rc: string;
  cnss: string;
  address: string;
  phone: string;
  email: string;
  patente: string;
  website: string;
  logo?: string;
  signature?: string;
  invoiceNumberingFormat?: string;
  invoicePrefix?: string;
  invoiceCounter?: number;
  lastInvoiceYear?: number;
  defaultTemplate?: string;
  subscription?: 'free' | 'pro';
  subscriptionDate?: string;
  expiryDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
  entrepriseId?: string;
  permissions?: {
    dashboard: boolean;
    invoices: boolean;
    quotes: boolean;
    clients: boolean;
    products: boolean;
    orders: boolean;
    suppliers: boolean;
    stockManagement: boolean;
    supplierManagement: boolean;
    hrManagement: boolean;
    reports: boolean;
    settings: boolean;
    projectManagement: boolean;
  };
  company: Company;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, companyData: Company) => Promise<boolean>;
  sendEmailVerification: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeSubscription: () => Promise<void>;
  updateCompanySettings: (settings: Partial<Company>) => Promise<void>;
  checkSubscriptionExpiry: () => Promise<void>;
  isLoading: boolean;
  showExpiryAlert: boolean;
  setShowExpiryAlert: (show: boolean) => void;
  expiredDate: string | null;
  subscriptionStatus: {
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysRemaining: number;
    shouldBlockUsers: boolean;
    shouldShowNotification: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpiryAlert, setShowExpiryAlert] = useState(false);
  const [expiredDate, setExpiredDate] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining: 0,
    shouldBlockUsers: false,
    shouldShowNotification: false
  });

  const calculateSubscriptionStatus = (userData: any) => {
    if (userData.subscription !== 'pro' || !userData.expiryDate) {
      return {
        isExpired: false,
        isExpiringSoon: false,
        daysRemaining: 0,
        shouldBlockUsers: false,
        shouldShowNotification: false
      };
    }
    const currentDate = new Date();
    const expiry = new Date(userData.expiryDate);
    const timeDiff = expiry.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 5;
    const shouldBlockUsers = isExpired;
    const shouldShowNotification = isExpiringSoon && !isExpired;
    return {
      isExpired,
      isExpiringSoon,
      daysRemaining: Math.max(0, daysRemaining),
      shouldBlockUsers,
      shouldShowNotification
    };
  };

  const checkManagedUser = async (email: string, password: string): Promise<ManagedUser | null> => {
    try {
      const managedUsersQuery = query(
        collection(db, 'managedUsers'),
        where('email', '==', email),
        where('password', '==', password),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(managedUsersQuery);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as ManagedUser;
        return { id: snapshot.docs[0].id, ...userData };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la vérification de l’utilisateur géré:', error);
      return null;
    }
  };

  const checkSubscriptionExpiry = async (userId: string, userData: any) => {
    if (userData.subscription === 'pro' && userData.expiryDate) {
      const currentDate = new Date();
      const expiryDate = new Date(userData.expiryDate);
      if (currentDate > expiryDate) {
        try {
          await updateDoc(doc(db, 'entreprises', userId), {
            subscription: 'free',
            subscriptionDate: new Date().toISOString(),
            expiryDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setUser(prev => prev ? {
            ...prev,
            company: { ...prev.company, subscription: 'free', subscriptionDate: new Date().toISOString(), expiryDate: new Date().toISOString() }
          } : prev);
          setExpiredDate(userData.expiryDate);
          setShowExpiryAlert(true);
        } catch (error) {
          console.error('Erreur lors de la mise à jour de l’expiration:', error);
        }
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const userDoc = await getDoc(doc(db, 'entreprises', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: fbUser.uid,
              name: userData.ownerName || fbUser.email?.split('@')[0] || 'Utilisateur',
              email: fbUser.email || '',
              role: 'admin',
              isAdmin: true,
              entrepriseId: fbUser.uid,
              company: {
                name: userData.name,
                ice: userData.ice,
                if: userData.if,
                rc: userData.rc,
                cnss: userData.cnss,
                address: userData.address,
                phone: userData.phone,
                logo: userData.logo,
                email: userData.email,
                signature: userData.signature || '',
                patente: userData.patente,
                website: userData.website,
                invoiceNumberingFormat: userData.invoiceNumberingFormat,
                invoicePrefix: userData.invoicePrefix,
                invoiceCounter: userData.invoiceCounter,
                lastInvoiceYear: userData.lastInvoiceYear,
                defaultTemplate: userData.defaultTemplate || 'template1',
                subscription: userData.subscription || 'free',
                subscriptionDate: userData.subscriptionDate,
                expiryDate: userData.expiryDate
              }
            });
            setSubscriptionStatus(calculateSubscriptionStatus(userData));
            await checkSubscriptionExpiry(fbUser.uid, userData);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (email === 'admin@facturati.ma' && password === 'Rahma1211?') {
        setUser({
          id: 'facture-admin',
          name: 'Administrateur Facturati',
          email: 'admin@facturati.ma',
          role: 'admin',
          isAdmin: true,
          entrepriseId: 'facture-admin',
          company: {
            name: 'Facturati Administration',
            ice: 'ADMIN',
            if: 'ADMIN',
            rc: 'ADMIN',
            cnss: 'ADMIN',
            address: 'Casablanca, Maroc',
            phone: '+212 522 123 456',
            email: 'admin@facturati.ma',
            patente: 'ADMIN',
            website: 'https://facturati.ma',
            subscription: 'pro',
            subscriptionDate: new Date().toISOString(),
            expiryDate: new Date(2030, 11, 31).toISOString()
          }
        });
        return true;
      }

      const managedUser = await checkManagedUser(email, password);
      if (managedUser) {
        const companyDoc = await getDoc(doc(db, 'entreprises', managedUser.entrepriseId));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          const status = calculateSubscriptionStatus(companyData);
          if (status.shouldBlockUsers || (companyData.subscription !== 'pro')) {
            throw new Error('ACCOUNT_BLOCKED_EXPIRED');
          }
          await updateDoc(doc(db, 'managedUsers', managedUser.id), { lastLogin: new Date().toISOString() });
          setUser({
            id: managedUser.id,
            name: managedUser.name,
            email: managedUser.email,
            role: 'user',
            isAdmin: false,
            permissions: managedUser.permissions,
            entrepriseId: managedUser.entrepriseId,
            company: {
              name: companyData.name,
              ice: companyData.ice,
              if: companyData.if,
              rc: companyData.rc,
              cnss: companyData.cnss,
              address: companyData.address,
              phone: companyData.phone,
              logo: companyData.logo,
              email: companyData.email,
              signature: companyData.signature || '',
              patente: companyData.patente,
              website: companyData.website,
              invoiceNumberingFormat: companyData.invoiceNumberingFormat,
              invoicePrefix: companyData.invoicePrefix,
              invoiceCounter: companyData.invoiceCounter,
              lastInvoiceYear: companyData.lastInvoiceYear,
              defaultTemplate: companyData.defaultTemplate || 'template1',
              subscription: companyData.subscription || 'free',
              subscriptionDate: companyData.subscriptionDate,
              expiryDate: companyData.expiryDate
            }
          });
          setSubscriptionStatus(status);
          return true;
        }
        return false;
      }

      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, companyData: Company): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await sendEmailVerification(userCredential.user);

      // why: donner 1 MOIS Pro dès l’inscription + déclencher la Welcome modal
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + 1); // 1 mois calendaires

      await setDoc(doc(db, 'entreprises', userId), {
        ...companyData,
        ownerEmail: email,
        ownerName: email.split('@')[0],
        emailVerified: false,
        subscription: 'pro',
        subscriptionDate: now.toISOString(),
        expiryDate: expiry.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });

      // Flag pour afficher la modal de bienvenue après redirection/connexion
      try { localStorage.setItem('welcomeProPending', '1'); } catch {}

      return true;
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      return false;
    }
  };

  const sendEmailVerificationManual = async (): Promise<void> => {
    if (!firebaseUser) throw new Error('Aucun utilisateur connecté');
    try { await sendEmailVerification(firebaseUser); } catch (error) { console.error('Erreur envoi email vérification:', error); throw error; }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try { await sendPasswordResetEmail(auth, email); } catch (error) { console.error('Erreur reset password:', error); throw error; }
  };

  const upgradeSubscription = async (): Promise<void> => {
    if (!user) return;
    try {
      const currentDate = new Date();
      const expiryDate = new Date(currentDate);
      expiryDate.setDate(currentDate.getDate() + 30); // ici on garde 30j
      await updateDoc(doc(db, 'entreprises', user.id), {
        subscription: 'pro',
        subscriptionDate: currentDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
      setUser(prev => prev ? {
        ...prev,
        company: { ...prev.company, subscription: 'pro', subscriptionDate: currentDate.toISOString(), expiryDate: expiryDate.toISOString() }
      } : prev);
    } catch (error) {
      console.error('Erreur lors de la mise à niveau:', error);
      throw error;
    }
  };

  const updateCompanySettings = async (settings: Partial<Company>): Promise<void> => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'entreprises', user.id), { ...settings, updatedAt: new Date().toISOString() });
      setUser(prev => prev ? { ...prev, company: { ...prev.company, ...settings } } : prev);
    } catch (error) {
      console.error('Erreur update paramètres:', error);
      throw error;
    }
  };

  const checkSubscriptionExpiryManual = async (): Promise<void> => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'entreprises', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await checkSubscriptionExpiry(user.id, userData);
      }
    } catch (error) {
      console.error("Erreur check expiration:", error);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (user && !user.isAdmin) {
        setUser(null);
        setFirebaseUser(null);
      } else {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!user,
    login,
    register,
    sendEmailVerification: sendEmailVerificationManual,
    sendPasswordReset,
    logout,
    upgradeSubscription,
    updateCompanySettings,
    checkSubscriptionExpiry: checkSubscriptionExpiryManual,
    isLoading,
    showExpiryAlert,
    setShowExpiryAlert,
    expiredDate,
    subscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}


// =========================================
// src/components/auth/WelcomeProModal.tsx
// =========================================
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, CheckCircle, X } from 'lucide-react';

type WelcomeProModalProps = {
  isOpen: boolean;
  onClose: () => void;
  expiryDate?: string | null;
};

export default function WelcomeProModal({ isOpen, onClose, expiryDate }: WelcomeProModalProps) {
  if (!isOpen) return null;

  const expiryLabel = expiryDate
    ? new Date(expiryDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      />
      <motion.div
        key="welcome-modal"
        className="fixed inset-0 z-[71] grid place-items-center px-4"
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      >
        <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-emerald-200/70 dark:border-emerald-800/40 bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <motion.div
                className="w-32 h-32 rounded-full bg-white/20 absolute -top-8 -left-8"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-7 h-7" />
                <h3 className="text-xl font-bold">Bienvenue en Pro 🎉</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <p className="text-gray-800 dark:text-gray-100 font-medium">
                Félicitations ! Votre compte a un <span className="text-emerald-600 dark:text-emerald-400">mois gratuit</span> en version Pro.
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {expiryLabel
                ? <>Votre période d’essai Pro se termine le <b>{expiryLabel}</b>.</>
                : <>Votre période d’essai Pro vient de commencer.</>}
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Facturation & devis illimités</li>
              <li>• Tableaux de bord avancés</li>
              <li>• Support prioritaire</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 flex justify-end">
            <motion.button
              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              Commencer
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


// ============================================
// src/components/dashboard/Dashboard.tsx
// ============================================
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, MessageCircle, Send, X, Mail } from 'lucide-react';
import StatsCards from './StatsCards';
import RecentInvoices from './RecentInvoices';
import TopProducts from './TopProducts';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import WelcomeProModal from '../auth/WelcomeProModal';

export default function Dashboard() {
  const { user, checkSubscriptionExpiry } = useAuth();
  const { t } = useLanguage();
  const { invoices, clients, products } = useData();

  React.useEffect(() => { if (user) checkSubscriptionExpiry(); }, [user, checkSubscriptionExpiry]);

  const hasAnyData = invoices.length > 0 || clients.length > 0 || products.length > 0;

  // === Welcome Pro modal (pourquoi: on ne l’affiche qu’une fois après inscription) ===
  const [showWelcomePro, setShowWelcomePro] = React.useState(false);
  React.useEffect(() => {
    try {
      const pending = localStorage.getItem('welcomeProPending');
      if (pending === '1' && user?.company?.subscription === 'pro') {
        setShowWelcomePro(true);
        localStorage.removeItem('welcomeProPending');
        localStorage.setItem('welcomeProSeen', '1');
      }
    } catch {}
  }, [user]);

  // === Config support ===
  const SUPPORT_ICON: 'message' | 'support' = 'message';
  const Glyph = SUPPORT_ICON === 'message' ? MessageCircle : LifeBuoy;
  const SUPPORT_PHONE_E164 = '212666736446';
  const SUPPORT_EMAIL = 'support@facturati.ma';

  const [supportOpen, setSupportOpen] = React.useState(false);
  const [supportName, setSupportName] = React.useState<string>(user?.name || '');
  const [supportMsg, setSupportMsg] = React.useState<string>('');
  const [supportError, setSupportError] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<'whatsapp' | 'email'>('whatsapp');

  const [toast, setToast] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'ok' | 'warn' | 'err'>('ok');
  React.useEffect(() => { if (user?.name) setSupportName(user.name); }, [user]);
  React.useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  const tryOpen = (url: string) => {
    try { const w = window.open(url, '_blank'); return !!w; } catch { return false; }
  };

  const buildContextText = () => [
    '👋 Support Facturati',
    `Nom: ${supportName || '—'}`,
    `Email: ${user?.email || '—'}`,
    `Société: ${user?.company?.name || '—'}`,
    '---',
    supportMsg.trim(),
    '',
  ].join('\n');

  const sendEmail = () => {
    const subject = encodeURIComponent('Support Facturati');
    const body = encodeURIComponent(buildContextText());
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    const ok = tryOpen(mailto);
    if (!ok) { setToastType('err'); setToast('Impossible d’ouvrir votre client mail.'); }
    else { setToastType('ok'); setToast('Email prêt à être envoyé.'); }
  };

  const sendWhatsAppWithFallback = () => {
    const text = encodeURIComponent(buildContextText());
    const wa = `https://wa.me/${SUPPORT_PHONE_E164}?text=${text}`;
    const ok = tryOpen(wa);
    if (!ok) { setToastType('warn'); setToast("WhatsApp indisponible, bascule sur l'email."); sendEmail(); }
    else { setToastType('ok'); setToast('WhatsApp ouvert.'); }
  };

  const handleSupportSend = () => {
    if (!supportMsg.trim()) { setSupportError('Veuillez saisir votre message.'); return; }
    setSupportError(null);
    if (channel === 'whatsapp') sendWhatsAppWithFallback(); else sendEmail();
    setSupportOpen(false);
    setSupportMsg('');
  };

  const getWelcomeMessage = () => {
    if (user?.email === 'admin@facturati.ma') return `Bienvenue Administrateur Facturati ! Vous gérez la plateforme.`;
    if (user?.isAdmin) return `Bienvenue ${user.name} ! Vous êtes connecté en tant qu'administrateur.`;
    const permissionCount = user?.permissions ? Object.values(user.permissions).filter(Boolean).length : 0;
    return `Bienvenue ${user?.name} ! Vous avez accès à ${permissionCount} section${permissionCount > 1 ? 's' : ''} de l'entreprise ${user?.company?.name}.`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard')}
        </motion.h1>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-gray-500 dark:text-gray-400">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className={`rounded-xl border p-4 ${
          user?.isAdmin
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700'
        }`}
      >
        <p className={`text-sm font-medium ${user?.isAdmin ? 'text-indigo-800' : 'text-blue-800'} dark:text-white transition-colors duration-300`}>
          {getWelcomeMessage()}
        </p>
      </motion.div>

      <StatsCards />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <QuickActions />
      </motion.div>

      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl border border-teal-200 dark:border-teal-700 p-8 text-center"
        >
          <div className="max-w-md mx-auto">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">🚀</span>
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bienvenue sur Facture.ma !</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Commencez par ajouter vos premiers clients et produits pour voir vos données apparaître ici.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl">
                Ajouter un client
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl">
                Ajouter un produit
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <RecentActivity />
      </motion.div>

      <TopProducts />
      <RecentInvoices />

      {/* Bouton Support */}
      <motion.button
        aria-label="Ouvrir le support"
        onClick={() => setSupportOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full p-4 sm:p-5 shadow-2xl focus:outline-none focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-700
                   bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-600 text-white"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative">
          <Glyph className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow" />
          <span className="absolute -inset-3 rounded-full bg-pink-500/20 blur-lg -z-10" />
        </div>
      </motion.button>

      {/* Carte Support */}
      <AnimatePresence>
        {supportOpen && (
          <motion.div
            key="support-card"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-md"
          >
            <div className="rounded-2xl shadow-2xl border border-pink-200/70 dark:border-pink-800/50 overflow-hidden bg-white dark:bg-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <Glyph className="w-5 h-5" />
                  <h3 className="font-semibold">Besoin d’aide ?</h3>
                </div>
                <button aria-label="Fermer le support" onClick={() => setSupportOpen(false)} className="p-1.5 rounded-md hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5">
                {/* Sélecteur de canal */}
                <div className="mb-4">
                  <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setChannel('whatsapp')}
                      className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition
                        ${channel === 'whatsapp'
                          ? 'bg-green-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      aria-pressed={channel === 'whatsapp'}
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition border-l border-gray-200 dark:border-gray-700
                        ${channel === 'email'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      aria-pressed={channel === 'email'}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    WhatsApp recommandé. Si indisponible, bascule auto vers Email.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="support-name" className="block text-xs font-medium text-gray-700 dark:text-gray-200">Votre nom</label>
                    <input
                      id="support-name"
                      type="text"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Ex: Fatima El Alami"
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                                 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="support-message" className="block text-xs font-medium text-gray-700 dark:text-gray-200">Message</label>
                    <textarea
                      id="support-message"
                      rows={4}
                      value={supportMsg}
                      onChange={(e) => { setSupportMsg(e.target.value); if (supportError) setSupportError(null); }}
                      placeholder="Expliquez votre besoin…"
                      className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                                 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-y"
                    />
                    {supportError && <p className="mt-1 text-xs text-pink-600 dark:text-pink-300">{supportError}</p>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/60">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Support en ligne
                </div>
                <motion.button
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSupportSend}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white focus:outline-none focus:ring-2 
                    ${channel === 'whatsapp'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-green-400'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:ring-indigo-400'}`}
                >
                  <Send className="w-4 h-4" />
                  {channel === 'whatsapp' ? 'Envoyer via WhatsApp' : 'Envoyer par Email'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-lg text-sm
              ${toastType === 'ok' ? 'bg-emerald-600 text-white' : toastType === 'warn' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'}`}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Pro Modal */}
      <WelcomeProModal
        isOpen={showWelcomePro}
        onClose={() => setShowWelcomePro(false)}
        expiryDate={user?.company?.expiryDate || null}
      />
    </motion.div>
  );
}