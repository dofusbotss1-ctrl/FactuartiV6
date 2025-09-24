// src/components/auth/EmailActionPage.tsx
import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { CheckCircle, AlertTriangle, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

type Mode = 'verifyEmail' | 'resetPassword' | string | null;

export default function EmailActionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const mode: Mode = params.get('mode');
  const oobCode = params.get('oobCode');

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');
  const [emailForReset, setEmailForReset] = React.useState<string>('');
  const [step, setStep] = React.useState<'idle' | 'verify-success' | 'reset-form' | 'reset-success' | 'invalid'>('idle');

  // Reset form state
  const [pwd1, setPwd1] = React.useState('');
  const [pwd2, setPwd2] = React.useState('');
  const [show1, setShow1] = React.useState(false);
  const [show2, setShow2] = React.useState(false);
  const [formErr, setFormErr] = React.useState<string>('');

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      if (!oobCode || !mode) {
        setStep('invalid');
        setLoading(false);
        return;
      }

      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          if (!active) return;
          setStep('verify-success');
        } else if (mode === 'resetPassword') {
          // Vérifier que le lien est valide et récupérer l'email cible
          const email = await verifyPasswordResetCode(auth, oobCode);
          if (!active) return;
          setEmailForReset(email);
          setStep('reset-form');
        } else {
          setStep('invalid');
        }
      } catch (e: any) {
        console.error('EmailActionPage error:', e);
        if (mode === 'verifyEmail') {
          setError("Lien invalide ou déjà utilisé. Si votre email n'est pas encore vérifié, renvoyez l'email.");
        } else if (mode === 'resetPassword') {
          setError('Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien.');
        } else {
          setError("Lien d'action invalide.");
        }
        setStep('invalid');
      } finally {
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [mode, oobCode]);

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');

    if (pwd1.length < 6) {
      setFormErr('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (pwd1 !== pwd2) {
      setFormErr('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      await confirmPasswordReset(auth, oobCode || '', pwd1);
      setStep('reset-success');
    } catch (e: any) {
      console.error('confirmPasswordReset error:', e);
      setFormErr('Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-xl bg-white shadow-lg grid place-items-center">
            <img
              src="https://i.ibb.co/kgVKRM9z/20250915-1327-Conception-Logo-Color-remix-01k56ne0szey2vndspbkzvezyp-1.png"
              alt="Facturati"
              className="w-12 h-12 object-contain"
            />
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
        >
          {/* Loading */}
          {loading && (
            <div className="text-center py-10">
              <div className="animate-pulse text-lg font-semibold text-gray-700">Traitement en cours…</div>
              <p className="text-gray-500 text-sm mt-1">Merci de patienter quelques secondes</p>
            </div>
          )}

          {/* Verify success */}
          {!loading && step === 'verify-success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Votre email a été vérifié 🎉</h2>
              <p className="text-gray-600 mt-2">Vous pouvez maintenant vous connecter à votre compte.</p>

              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Se connecter <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Reset form */}
          {!loading && step === 'reset-form' && (
            <div>
              <div className="text-center mb-4">
                <div className="mx-auto w-12 h-12 rounded-xl bg-teal-100 grid place-items-center">
                  <Lock className="w-6 h-6 text-teal-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-3">Réinitialiser le mot de passe</h2>
                <p className="text-gray-600 mt-1">
                  {emailForReset ? <>Compte : <strong>{emailForReset}</strong></> : 'Entrez un nouveau mot de passe.'}
                </p>
              </div>

              <form className="space-y-4" onSubmit={submitNewPassword} noValidate>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type={show1 ? 'text' : 'password'}
                    value={pwd1}
                    onChange={(e) => setPwd1(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow1((v) => !v)}
                    className="absolute right-2 bottom-2.5 p-1 text-gray-500 hover:text-gray-700"
                    aria-label={show1 ? 'Masquer' : 'Afficher'}
                  >
                    {show1 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                  <input
                    type={show2 ? 'text' : 'password'}
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow2((v) => !v)}
                    className="absolute right-2 bottom-2.5 p-1 text-gray-500 hover:text-gray-700"
                    aria-label={show2 ? 'Masquer' : 'Afficher'}
                  >
                    {show2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {formErr && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {formErr}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-semibold transition"
                >
                  Mettre à jour le mot de passe
                </button>
              </form>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">
                  Retourner à la connexion
                </Link>
              </div>
            </div>
          )}

          {/* Reset success */}
          {!loading && step === 'reset-success' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Mot de passe réinitialisé ✅</h2>
              <p className="text-gray-600 mt-2">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>

              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Se connecter <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Invalid */}
          {!loading && step === 'invalid' && (
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Lien invalide ou déjà utilisé</h2>
              <p className="text-gray-600 mt-2">
                {error ||
                  "Le lien semble expiré ou a déjà été consommé. Demandez un nouveau lien depuis la page de connexion."}
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Revenir à la connexion
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
