// src/components/auth/EmailVerificationSuccessPage.tsx
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function EmailVerificationSuccessPage() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode'); // "verifyEmail" normalement

  const [status, setStatus] = React.useState<
    'loading' | 'success' | 'invalid' | 'error'
  >('loading');

  React.useEffect(() => {
    const verify = async () => {
      if (!oobCode || mode !== 'verifyEmail') {
        setStatus('invalid');
        return;
      }
      try {
        // ⬇️ Étape CRUCIALE : consommer le code de vérification
        await applyActionCode(auth, oobCode);
        setStatus('success');
      } catch (err: any) {
        // invalid/expired/already-used -> on affiche un message clair
        if (
          err?.code === 'auth/invalid-action-code' ||
          err?.code === 'auth/expired-action-code'
        ) {
          setStatus('invalid');
        } else {
          setStatus('error');
        }
      }
    };
    verify();
  }, [oobCode, mode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl shadow-lg bg-white grid place-items-center">
            <img
              src="https://i.ibb.co/kgVKRM9z/20250915-1327-Conception-Logo-Color-remix-01k56ne0szey2vndspbkzvezyp-1.png"
              alt="Factourati"
              className="w-16 h-16 object-contain"
            />
          </div>
        </motion.div>

        {/* Carte */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-teal-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900">
                Vérification en cours…
              </h1>
              <p className="text-gray-600 mt-2">
                Merci de patienter pendant que nous validons votre adresse email.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                className="mb-4 inline-flex"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900">
                Votre email a été vérifié avec succès !
              </h1>
              <p className="text-gray-600 mt-2">
                Vous pouvez maintenant vous connecter à votre espace.
              </p>

              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-lg font-semibold bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg transition"
              >
                Se connecter
              </Link>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Lien invalide ou déjà utilisé
              </h1>
              <p className="text-gray-600 mt-2">
                Le lien de vérification semble expiré ou déjà consommé.
                Si votre email n’est pas encore vérifié, renvoyez un nouveau
                email depuis la page de connexion.
              </p>
              <Link
                to="/login?mode=register"
                className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white transition"
              >
                Revenir à la connexion
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Oups, une erreur est survenue
              </h1>
              <p className="text-gray-600 mt-2">
                Impossible de finaliser la vérification. Réessayez plus tard ou
                renvoyez un nouvel email de vérification.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white transition"
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
