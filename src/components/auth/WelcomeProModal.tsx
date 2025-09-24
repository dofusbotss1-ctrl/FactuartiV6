// src/components/auth/WelcomeProModal.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Crown,
  Gift,
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
  X
} from 'lucide-react';

/** Fireworks canvas – why: meilleures perfs que 100 divs animés */
function FireworksCanvas({ run }: { run: boolean }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const burstsTimer = React.useRef<number | null>(null);
  const stopAt = React.useRef<number>(0);

  React.useEffect(() => {
    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = ref.current;
    if (!canvas || !run || prefersReduce) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      size: number;
      color: string;
      life: number;
    };
    const particles: P[] = [];

    const colors = [
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#10B981', // emerald-500
      '#3B82F6', // blue-500
      '#A855F7', // violet-500
      '#EC4899', // pink-500
      '#22C55E', // green-500
    ];

    function burst(cx: number, cy: number) {
      const count = 50 + Math.floor(Math.random() * 30);
      const baseSpeed = 2.2 + Math.random() * 1.8;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = baseSpeed * (0.6 + Math.random() * 0.8);
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 1 + Math.random() * 2.5,
          color: colors[(Math.random() * colors.length) | 0],
          life: 60 + Math.random() * 30,
        });
      }
    }

    function loop() {
      // trail
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.vx *= 0.992; // friction
        p.vy *= 0.992;
        p.life -= 1;
        p.alpha = Math.max(0, p.life / 70);

        ctx.beginPath();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        g.addColorStop(0, `${p.color}`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        if (p.life <= 0 || p.alpha <= 0) particles.splice(i, 1);
      }

      if (Date.now() < stopAt.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    }

    // cadence de bursts pendant ~6s
    const scheduleBursts = () => {
      const launch = () => {
        const cx = W * (0.15 + Math.random() * 0.7);
        const cy = H * (0.15 + Math.random() * 0.5);
        burst(cx, cy);
        const delay = 380 + Math.random() * 420;
        burstsTimer.current = window.setTimeout(() => {
          if (Date.now() < stopAt.current) launch();
        }, delay);
      };
      launch();
    };

    stopAt.current = Date.now() + 6000;
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, W, H);
    loop();
    scheduleBursts();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (burstsTimer.current) clearTimeout(burstsTimer.current);
      window.removeEventListener('resize', onResize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [run]);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-[69] pointer-events-none opacity-90 mix-blend-screen"
    />
  );
}

type WelcomeProModalProps = {
  isOpen: boolean;
  onClose: () => void;
  expiryDate?: string | null;
};

export default function WelcomeProModal({ isOpen, onClose, expiryDate }: WelcomeProModalProps) {
  const [fireRun, setFireRun] = React.useState(false);
  const expiryLabel = expiryDate
    ? new Date(expiryDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  React.useEffect(() => {
    if (isOpen) {
      setFireRun(true);
      const end = window.setTimeout(() => setFireRun(false), 6500);
      return () => clearTimeout(end);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fireworks behind everything */}
          <FireworksCanvas run={fireRun} />

          {/* Backdrop */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-[71] grid place-items-center px-4"
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          >
            {/* gradient border */}
            <div className="p-[2px] rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl w-full max-w-2xl">
              <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                {/* aura */}
                <motion.div
                  aria-hidden
                  className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  aria-hidden
                  className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl"
                  animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.55, 0.35, 0.55] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Header */}
                <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-white/20 grid place-items-center"
                        animate={{ rotate: [0, 8, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Crown className="w-7 h-7" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-extrabold leading-tight">Bienvenue en <span className="underline underline-offset-4">PRO</span> 🎉</h3>
                        <p className="text-white/90 text-sm">Votre essai Pro démarre maintenant.</p>
                      </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 sm:px-8 py-7">
                  {/* Bandeau 1 mois gratuit */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold shadow-lg"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.05 }}
                    >
                      <Gift className="w-5 h-5" />
                      <span className="tracking-wide">1 mois gratuit – Version Pro</span>
                    </motion.div>

                    {expiryLabel && (
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Expire le <b>{expiryLabel}</b>
                      </div>
                    )}
                  </div>

                  {/* Texte principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                    <div className="sm:col-span-3">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Accédez à toute la puissance de Facturati
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        Facturation illimitée, analyses avancées, support prioritaire, et plus encore.
                      </p>

                      {/* Liste d’avantages */}
                      <ul className="mt-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Devis & factures illimités
                        </li>
                        <li className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Données sécurisées & sauvegardées
                        </li>
                        <li className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-emerald-500" /> Templates & signatures pro
                        </li>
                      </ul>
                    </div>

                    {/* Carte “Pro badge” */}
                    <motion.div
                      className="sm:col-span-2 rounded-2xl p-5 border bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/10 dark:to-cyan-900/10 border-emerald-200 dark:border-emerald-800 relative overflow-hidden"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.08 }}
                    >
                      <motion.div
                        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-400/30 blur-2xl"
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        PRO
                      </div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        Essai actif
                      </div>

                      <motion.div
                        className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity }}
                      >
                        <motion.div
                          className="h-full w-1/3 bg-gradient-to-r from-emerald-500 to-cyan-500"
                          animate={{ x: ['-10%', '110%'] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.div>
                      <p className="mt-3 text-xs text-gray-500">
                        Astuce : importez vos données et gagnez du temps.
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-5 bg-gray-50 dark:bg-gray-800/60 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow"
                  >
                    Commencer
                  </motion.button>
                  <motion.a
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    href="#modules"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-lg font-semibold border border-emerald-300/60 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20"
                  >
                    Découvrir les modules Pro
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
