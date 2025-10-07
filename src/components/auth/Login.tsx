// src/components/auth/Login.tsx
import React, { useState } from 'react';
import { Link, useLocation,useNavigate  } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Lock,
  Mail,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  // --- Lire le query param
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const openRegister = params.get('mode') === 'register'; // true si ?mode=register

  // --- Login form state
  const [email, setEmail] = useState(''); // email de connexion
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // views — initialisé selon l’URL
  const [showRegister, setShowRegister] = useState(openRegister);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const validateLogin = () => {
    const fe: typeof fieldErrors = {};
    if (!email.trim()) fe.email = 'Adresse email obligatoire.';
    else if (!emailRegex.test(email.trim())) fe.email = 'Adresse email invalide.';

    if (!password) fe.password = 'Mot de passe obligatoire.';
    else if (password.length < 6) fe.password = 'Au moins 6 caractères.';

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError('');

    if (!validateLogin()) {
      setBannerError('Veuillez corriger les champs en rouge.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(email.trim(), password);

      if (!ok) {
        setBannerError('Email ou mot de passe incorrect.');
      } else {
        // ✅ Vérifier la vérification email après la connexion
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
          // on évite de laisser l’utilisateur connecté
          await signOut(auth);
          setBannerError(
            "Votre email n'est pas encore vérifié. Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification."
          );
          return;
        }
        // Si vérifié, tout est bon : pas de bannière d’erreur
      }
    } catch (err: any) {
      if (err?.message === 'ACCOUNT_BLOCKED_EXPIRED') {
        setBannerError(
          "Compte bloqué : l'abonnement Pro de votre entreprise a expiré. Contactez votre administrateur."
        );
      } else {
        setBannerError('Erreur de connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegister) return <RegisterForm onBack={() => setShowRegister(false)} />;
  if (showForgotPassword) return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Bouton retour */}
      <Link
        to="/"
        className="fixed top-6 left-6 inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Retour</span>
      </Link>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-black-200 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <img
                src="https://i.ibb.co/kgVKRM9z/20250915-1327-Conception-Logo-Color-remix-01k56ne0szey2vndspbkzvezyp-1.png"
                alt="Factourati Logo"
                className="w-15 h-15 object-contain"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('Bienvenue sur Factourati')}
          </h2>
          <p className="text-gray-600">{t('loginSubtitle')}</p>

          {/* Sélecteur langue */}
          <div className="flex justify-center mt-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === 'fr'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                FR
              </button>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Banner global */}
          {bannerError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {bannerError}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((s) => ({ ...s, email: undefined }));
                }}
                aria-invalid={!!fieldErrors.email}
                className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent
                  ${
                    fieldErrors.email
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-teal-500'
                  }`}
                placeholder="votre@email.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>

              <input
                id="password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((s) => ({ ...s, password: undefined }));
                }}
                aria-invalid={!!fieldErrors.password}
                className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent
                  ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-teal-500'
                  }`}
                placeholder="••••••••"
              />

              {/* Toggle show/hide */}
              <button
                type="button"
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? t('loading') : t('login')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="inline-flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un compte</span>
            </button>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================== Register ================== */

function RegisterForm({ onBack }: { onBack: () => void }) {
  const { register } = useAuth();
    const navigate = useNavigate(); // ⬅️ ajouté


  const [isLoading, setIsLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // erreurs par champ
  type FE = Partial<Record<
    | 'email'
    | 'password'
    | 'confirmPassword'
    | 'companyName'
    | 'ice'
    | 'if'
    | 'rc'
    | 'cnss'
    | 'phone'
    | 'address'
    | 'logo'
    | 'companyEmail'
    | 'patente'
    | 'website',
    string
  >>;
  const [fieldErrors, setFieldErrors] = useState<FE>({});

  // toggles mdp
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);

  const [formData, setFormData] = useState({
    email: '', // email de connexion
    password: '',
    confirmPassword: '',
    companyName: '',
    ice: '',
    if: '',
    rc: '',
    cnss: '',
    phone: '',
    address: '',
    logo: '',
    companyEmail: '', // email de l’entreprise
    patente: '',
    website: '',
  });

  const onField = (name: keyof typeof formData, v: string) => {
    setFormData((s) => ({ ...s, [name]: v }));
    if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: undefined }));
  };

  // Vérifier si le nom de société existe déjà
  const checkCompanyNameExists = async (companyName: string): Promise<boolean> => {
    try {
      const companiesQuery = query(
        collection(db, 'entreprises'),
        where('name', '==', companyName.trim())
      );
      const snapshot = await getDocs(companiesQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification du nom de société:', error);
      return false;
    }
  };

  const validateRegister = () => {
    const fe: FE = {};

    // connexion
    if (!formData.email.trim()) fe.email = 'Email obligatoire.';
    else if (!emailRegex.test(formData.email.trim())) fe.email = 'Email invalide.';

    if (!formData.password) fe.password = 'Mot de passe obligatoire.';
    else if (formData.password.length < 6) fe.password = 'Au moins 6 caractères.';

    if (!formData.confirmPassword) fe.confirmPassword = 'Confirmation obligatoire.';
    else if (formData.confirmPassword !== formData.password)
      fe.confirmPassword = 'Les mots de passe ne correspondent pas.';

    // société
    if (!formData.companyName.trim()) fe.companyName = 'Nom de la société obligatoire.';
    if (!formData.address.trim()) fe.address = 'Adresse obligatoire.';
    if (!formData.companyEmail.trim()) fe.companyEmail = "Email de l'entreprise obligatoire.";
    else if (!emailRegex.test(formData.companyEmail.trim())) fe.companyEmail = 'Email invalide.';

    if (!formData.ice) fe.ice = 'ICE obligatoire.';
    if (!formData.if) fe.if = 'IF obligatoire.';
    if (!formData.rc) fe.rc = 'RC obligatoire.';
    if (!formData.cnss) fe.cnss = 'CNSS obligatoire.';
    if (!formData.patente) fe.patente = 'Patente obligatoire.';

    if (!formData.phone) fe.phone = 'Téléphone obligatoire.';
    else if (!/^(\+212|0)[5-7]\d{8}$/.test(formData.phone.replace(/\s/g, '')))
      fe.phone = 'Numéro marocain invalide (ex: +212 6 12 34 56 78).';

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const validateCompanyName = async () => {
    if (!formData.companyName.trim()) {
      setFieldErrors((e) => ({ ...e, companyName: 'Nom de la société obligatoire.' }));
      return false;
    }

    setIsCheckingCompany(true);
    try {
      const exists = await checkCompanyNameExists(formData.companyName);
      if (exists) {
        setFieldErrors((e) => ({ 
          ...e, 
          companyName: 'Ce nom de société est déjà utilisé. Veuillez choisir un autre nom.' 
        }));
        return false;
      }
      return true;
    } finally {
      setIsCheckingCompany(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError('');

    if (!validateRegister()) {
      setBannerError('Veuillez corriger les champs en rouge.');
      return;
    }

    // Vérification spéciale du nom de société
    const companyNameValid = await validateCompanyName();
    if (!companyNameValid) {
      setBannerError('Le nom de société est déjà utilisé ou invalide.');
      return;
    }

    setIsLoading(true);
    try {
      const companyData = {
        name: formData.companyName.trim(),
        ice: formData.ice.trim(),
        if: formData.if.trim(),
        rc: formData.rc.trim(),
        cnss: formData.cnss.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        logo: formData.logo.trim(),
        email: formData.companyEmail.trim(), // important
        patente: formData.patente.trim(),
        website: formData.website.trim(),
      };

      const ok = await register(formData.email.trim(), formData.password, companyData);
      if (ok) {
  navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`, { replace: true });
      } else {
        setBannerError('Erreur lors de la création du compte.');
      }
    } catch {
      setBannerError("Erreur lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">📧 Vérifiez votre email</h2>
            <p className="text-gray-600 mb-6">
              Un email de vérification a été envoyé à <strong>{formData.email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">📋 Étapes suivantes :</h3>
              <ol className="text-sm text-blue-800 space-y-1 text-left">
                <li>1. Ouvrez votre boîte email</li>
                <li>2. Cliquez sur le lien de vérification</li>
                <li>3. Revenez sur Factourati pour vous connecter</li>
              </ol>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Register form UI
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Link
        to="/"
        className="fixed top-6 left-6 inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Retour</span>
      </Link>

      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-black-200 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <img
                src="https://i.ibb.co/kgVKRM9z/20250915-1327-Conception-Logo-Color-remix-01k56ne0szey2vndspbkzvezyp-1.png"
                alt="Factourati Logo"
                className="w-15 h-15 object-contain"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Créer votre compte</h2>
          <p className="text-gray-600">Rejoignez Factourati et simplifiez votre gestion</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Banner global */}
          {bannerError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {bannerError}
            </div>
          )}

          {/* Connexion */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de connexion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email de connexion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => onField('email', e.target.value)}
                  required
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.email
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="votre@email.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                <input
                  type={showPwd1 ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={(e) => onField('password', e.target.value)}
                  required
                  minLength={6}
                  aria-invalid={!!fieldErrors.password}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.password
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd1((v) => !v)}
                  aria-label={showPwd1 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2 bottom-2.5 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPwd1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm */}
              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  type={showPwd2 ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => onField('confirmPassword', e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.confirmPassword}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.confirmPassword
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd2((v) => !v)}
                  aria-label={showPwd2 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-2 bottom-2.5 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPwd2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Société */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations société</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la société *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => onField('companyName', e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.companyName}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.companyName
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="Nom de votre entreprise"
                  onBlur={async () => {
                    if (formData.companyName.trim()) {
                      await validateCompanyName();
                    }
                  }}
                />
                {isCheckingCompany && (
                  <div className="mt-1 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
                    <span className="text-xs text-teal-600">Vérification de la disponibilité...</span>
                  </div>
                )}
                {fieldErrors.companyName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>
                )}
                {!fieldErrors.companyName && formData.companyName.trim() && !isCheckingCompany && (
                  <p className="mt-1 text-xs text-green-600">✓ Nom de société disponible</p>
                )}
              </div>

              {/* ICE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ICE *</label>
                <input
                  type="text"
                  name="ice"
                  value={formData.ice}
                  onChange={(e) => onField('ice', e.target.value)}
                  required
                  maxLength={15}
                  pattern="\d{15}"
                  inputMode="numeric"
                  aria-invalid={!!fieldErrors.ice}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.ice
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="001234567000012"
                />
                <p className="text-xs text-gray-500 mt-1">15 chiffres exactement</p>
                {fieldErrors.ice && <p className="mt-1 text-xs text-red-600">{fieldErrors.ice}</p>}
              </div>

              {/* IF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IF (Identifiant Fiscal) *</label>
                <input
                  type="text"
                  name="if"
                  value={formData.if}
                  onChange={(e) => onField('if', e.target.value)}
                  required
                  maxLength={8}
                  pattern="\d{8}"
                  inputMode="numeric"
                  aria-invalid={!!fieldErrors.if}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.if
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="12345678"
                />
                <p className="text-xs text-gray-500 mt-1">8 chiffres exactement</p>
                {fieldErrors.if && <p className="mt-1 text-xs text-red-600">{fieldErrors.if}</p>}
              </div>

              {/* RC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RC (Registre de Commerce) *</label>
                <input
                  type="text"
                  name="rc"
                  value={formData.rc}
                  onChange={(e) => onField('rc', e.target.value)}
                  required
                  pattern="\d{5,}"
                  inputMode="numeric"
                  maxLength={20}
                  aria-invalid={!!fieldErrors.rc}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.rc
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="98765"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 5 chiffres</p>
                {fieldErrors.rc && <p className="mt-1 text-xs text-red-600">{fieldErrors.rc}</p>}
              </div>

              {/* CNSS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNSS *</label>
                <input
                  type="text"
                  name="cnss"
                  value={formData.cnss}
                  onChange={(e) => onField('cnss', e.target.value)}
                  required
                  maxLength={7}
                  pattern="\d{7}"
                  inputMode="numeric"
                  aria-invalid={!!fieldErrors.cnss}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.cnss
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="1234567"
                />
                <p className="text-xs text-gray-500 mt-1">7 chiffres exactement</p>
                {fieldErrors.cnss && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.cnss}</p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => onField('phone', e.target.value)}
                  required
                  inputMode="numeric"
                  pattern="(\+212|0)[5-7]\d{8}"
                  aria-invalid={!!fieldErrors.phone}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.phone
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="+212 6 12 34 56 78"
                />
                <p className="text-xs text-gray-500 mt-1">Format : +212 6 12 34 56 78</p>
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo (URL)</label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={(e) => onField('logo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="https://exemple.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">Optionnel</p>
              </div>

              {/* Email société */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de l'entreprise *</label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={(e) => onField('companyEmail', e.target.value)}
                  required
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.companyEmail}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.companyEmail
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="contact@entreprise.com"
                />
                {fieldErrors.companyEmail && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.companyEmail}</p>
                )}
              </div>

              {/* Patente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patente *</label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={(e) => onField('patente', e.target.value)}
                  required
                  maxLength={8}
                  pattern="\d{8}"
                  inputMode="numeric"
                  aria-invalid={!!fieldErrors.patente}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.patente
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="12345678"
                />
                <p className="text-xs text-gray-500 mt-1">8 chiffres exactement</p>
                {fieldErrors.patente && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.patente}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={(e) => onField('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="https://www.entreprise.com"
                />
                <p className="text-xs text-gray-500 mt-1">Optionnel</p>
              </div>

              {/* Adresse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={(e) => onField('address', e.target.value)}
                  rows={3}
                  required
                  aria-invalid={!!fieldErrors.address}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent
                    ${
                      fieldErrors.address
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-300 focus:ring-teal-500'
                    }`}
                  placeholder="Adresse complète de votre entreprise"
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Banner d’erreur si besoin */}
          {bannerError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {bannerError}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour à la connexion
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================== Forgot Password ================== */

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setError('Aucun compte trouvé avec cette adresse email');
      else if (err.code === 'auth/invalid-email') setError('Adresse email invalide');
      else setError("Erreur lors de l'envoi de l'email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">✅ Email envoyé !</h2>
            <p className="text-gray-600 mb-6">
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">📋 Instructions :</h3>
              <ol className="text-sm text-blue-800 space-y-1 text-left">
                <li>1. Vérifiez votre boîte email (et les spams)</li>
                <li>2. Cliquez sur le lien de réinitialisation</li>
                <li>3. Créez un nouveau mot de passe</li>
                <li>4. Revenez ici pour vous connecter</li>
              </ol>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Renvoyer l'email
              </button>
              <button
                onClick={onBack}
                className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Link
        to="/"
        className="fixed top-6 left-6 inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 px-3 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Retour</span>
      </Link>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🔑 Mot de passe oublié</h2>
          <p className="text-gray-600">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
