import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Clock, Settings, Star, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/admin', icon: Settings, label: 'Calibrate' },
]

// Floating particles component
function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? '#D4AF37' : '#22c55e',
            left: `${Math.random() * 100}%`,
            top: '100%',
          }}
          animate={{
            y: [0, -window.innerHeight * 1.2],
            x: [0, (Math.random() - 0.5) * 200],
            opacity: [0, 0.6, 0.6, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// Animated background orbs
function BackgroundOrbs() {
  return (
    <>
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
    </>
  )
}

export default function Layout() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen pattern-bg text-white">
      <BackgroundOrbs />
      <FloatingParticles />
      
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-dark-950/90 backdrop-blur-xl shadow-2xl border-b border-white/5' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div 
                className="relative w-12 h-12 bg-gradient-to-br from-psa-green-500 to-psa-green-700 rounded-xl flex items-center justify-center shadow-glow-green"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Star className="w-6 h-6 text-psa-gold-500" />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-psa-gold-500/20 to-transparent"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <motion.h1 
                  className="font-display text-xl font-bold gradient-text"
                  whileHover={{ scale: 1.02 }}
                >
                  PSA ValueLens
                </motion.h1>
                <p className="text-white/40 text-xs tracking-wide">
                  UWaterloo Pakistani Students Association
                </p>
              </div>
            </Link>

            <nav className="flex gap-1 bg-white/5 backdrop-blur-lg p-1.5 rounded-2xl border border-white/10">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-psa-green-600 to-psa-green-500 rounded-xl shadow-glow-green"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ 
              type: 'spring',
              stiffness: 100,
              damping: 20,
              duration: 0.4 
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 border-t border-white/5 py-8"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <Sparkles className="w-4 h-4 text-psa-gold-500" />
              <p>PSA ValueLens • Balancing Revenue & Experience</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-2 h-2 rounded-full bg-psa-green-500"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white/30 text-xs">System Active</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
