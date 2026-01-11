import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Clock, Settings, Star } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/admin', icon: Settings, label: 'Calibrate' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen pattern-bg">
      <header className="bg-gradient-to-r from-psa-green-600 to-psa-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-psa-gold-500" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold">PSA Event Analyzer</h1>
                <p className="text-psa-green-200 text-xs">UWaterloo Pakistani Students Association</p>
              </div>
            </Link>
            <nav className="flex gap-2">
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-psa-green-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="border-t border-psa-green-100 mt-12 py-6 text-center text-sm text-gray-500">
        <p>PSA Event Value Analyzer • Balancing Revenue & Experience</p>
      </footer>
    </div>
  )
}
