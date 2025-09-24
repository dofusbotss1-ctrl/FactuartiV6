import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
// (Optionnel) si tu veux appliquer le code d'action Firebase ici :
// import { applyActionCode } from 'firebase/auth';
// import { auth } from '../../config/firebase';

const LOGO =
  'https://i.ibb.co/kgVKRM9z/20250915-1327-Conception-Logo-Color-remix-01k56ne0szey2vndspbkzvezyp-1.png';

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#a855f7', '#22c55e'];
function ConfettiBurst({ pieces = 110 }: { pieces?: number }) {
  const items = React.useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.8;
        const distance = 140 + Math.random() * 120;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * -distance,
          rotate: Math.random() * 360,
          size: 5 + Math.random() * 6,
          delay: Math.random() * 0.15,
          color: COLORS[i % COLORS.length],
          key: i,
        };
      }),
    [pieces]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p) => (
        <motion.span
          key={p.key}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.9, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: 1, opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size * 1.6,
            borderRadius: 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

export default function EmailVerificationSuccessPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode');     // ex: "verifyEmail"
  const oobCode = params.get('oobCode'); // le code Firebase si présent

  // Si tu veux appliquer l'action ici (facultatif — Firebase peut déjà l'avoir fait) :
  // const [applyError, setApplyError] = React.useState<string>('');
  // React.useEffect(() => {
  //   const run = async () => {
  //     try {
  //       if (mode === 'verifyEmail' && oobCode) {
  //         await applyActionCode(auth, oobCode);
  //       }
  //     } catch (e: any) {
  //       setApplyError(e?.message || "Lien invalide ou expiré.");
  //     }
  //   };
  //   run();
  // }, [mode, oobCode]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 overflow-hidden px-4">
      {/* halos de fond */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-teal-300/30 to-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-gradient-to-tr from-amber-300/30 to-red-300/30 blur-3xl" />

      {/* confettis */}
      <AnimatePresence>
        <ConfettiBurst />
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* header/logo */}
          <div className="px-6 sm:px-8 py-6 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 grid place-items-center shadow-inner">
                <img src={LOGO} alt="Facturati" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Email vérifié</h1>
                <p className="text-xs text-white/85">Bienvenue chez Facturati 🎉</p>
              </div>
            </div>
          </div>

          {/* contenu */}
          <div className="px-6 sm:px-8 py-10 text-center">
            {/* icône check animée */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="mx-auto mb-5 w-20 h-20 rounded-2xl bg-emerald-50 grid place-items-center border border-emerald-100 shadow-sm"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 2.2, duration: 0.9 }}
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
              className="text-2xl sm:text-3xl font-extrabold text-gray-900"
            >
              Votre email a été vérifié avec succès !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="mt-2 text-gray-600"
            >
              {mode && oobCode ? (
                <>Code traité : <span className="font-semibold text-gray-800">{mode}</span></>
              ) : (
                <>Vous pouvez maintenant vous connecter à votre compte.</>
              )}
            </motion.p>

            {/* Affichage d’erreur si tu actives applyActionCode ci-dessus */}
            {/* {applyError && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{applyError}</span>
              </div>
            )} */}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="mt-8"
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 transition shadow"
              >
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="mt-4 text-xs text-gray-500">
                Vous serez redirigé vers la page de connexion Facturati.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
