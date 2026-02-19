import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, DollarSign, ChevronRight, Sparkles, X, Zap, TrendingUp } from 'lucide-react'

interface Event {
  id: number
  name: string
  attendance: number
  revenue: number
  feedback_count: number
  has_score: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState('')
  const [revenue, setRevenue] = useState('')
  const [loading, setLoading] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const res = await fetch('/api/events')
      if (!res.ok) {
        console.error('Failed to fetch events:', res.status)
        return
      }
      const data = await res.json()
      console.log('Fetched events:', data)
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  async function seedDemo() {
    await fetch('/api/seed-demo', { method: 'POST' })
    fetchEvents()
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          attendance: parseInt(attendance),
          revenue: parseFloat(revenue)
        })
      })
      console.log('Create event response:', res.status)
      if (res.ok) {
        setName('')
        setAttendance('')
        setRevenue('')
        setShowForm(false)
        await fetchEvents()
      } else {
        console.error('Failed to create event:', res.status)
      }
    } catch (error) {
      console.error('Error creating event:', error)
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Header Section */}
      <motion.div 
        className="flex items-center justify-between mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <motion.h2 
            className="font-display text-4xl font-bold gradient-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Event Dashboard
          </motion.h2>
          <motion.p 
            className="text-white/50 mt-2 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-4 h-4 text-psa-gold-500" />
            Create and manage PSA events
          </motion.p>
        </div>
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <motion.button
            onClick={seedDemo}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 glass-card rounded-xl text-psa-gold-500 hover:bg-white/10 transition-all border border-psa-gold-500/30 hover:border-psa-gold-500/60 hover:shadow-glow-gold"
          >
            <Sparkles className="w-4 h-4" />
            Load Demo
          </motion.button>
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-xl shadow-glow-green hover:shadow-glow-lg transition-all btn-glow"
          >
            <Plus className="w-5 h-5" />
            New Event
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Create Event Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-psa-green-500 via-psa-gold-500 to-psa-green-500" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl font-semibold text-white flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-psa-green-500 to-psa-green-700 flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Plus className="w-5 h-5 text-white" />
                </motion.div>
                Create New Event
              </h3>
              <motion.button
                onClick={() => setShowForm(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Event Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., PSA Cultural Night 2024"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Attendance</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="number"
                    value={attendance}
                    onChange={e => setAttendance(e.target.value)}
                    placeholder="Number of attendees"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 transition-all"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">Revenue ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="number"
                    value={revenue}
                    onChange={e => setRevenue(e.target.value)}
                    placeholder="Total revenue"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:bg-white/10 transition-all"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                <motion.button
                  type="button"
                  onClick={() => setShowForm(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-xl font-medium shadow-glow-green hover:shadow-glow-lg transition-all disabled:opacity-50 btn-glow"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div 
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Creating...
                    </span>
                  ) : 'Create Event'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      {events.length === 0 ? (
        <motion.div 
          className="text-center py-20 glass-card rounded-3xl border-2 border-dashed border-white/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Plus className="w-10 h-10 text-psa-green-500" />
          </motion.div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">No events yet</h3>
          <p className="text-white/40 mb-6">Create your first event or load the demo data</p>
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-xl shadow-glow-green"
          >
            Get Started
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          className="grid gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
              onMouseEnter={() => setHoveredCard(event.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="glass-card rounded-2xl p-6 card-hover relative overflow-hidden group"
            >
              {/* Hover gradient effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-psa-green-500/5 to-psa-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              
              {/* Progress bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-psa-green-500 to-psa-gold-500 progress-shine"
                  initial={{ width: 0 }}
                  animate={{ width: `${(event.feedback_count / 30) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 flex items-center justify-center"
                      animate={hoveredCard === event.id ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    >
                      <TrendingUp className="w-6 h-6 text-psa-green-500" />
                    </motion.div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white group-hover:text-psa-green-400 transition-colors">
                        {event.name}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-white/40">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {event.attendance.toLocaleString()} attendees
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          ${event.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Feedback counter */}
                  <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                    <motion.span 
                      className="text-2xl font-bold text-white"
                      key={event.feedback_count}
                      initial={{ scale: 1.2, color: '#D4AF37' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                    >
                      {event.feedback_count}
                    </motion.span>
                    <span className="text-white/40">/30</span>
                    <p className="text-xs text-white/30 mt-0.5">feedbacks</p>
                  </div>

                  {/* Action button */}
                  {event.has_score ? (
                    <motion.button
                      onClick={() => navigate(`/event/${event.id}/results`)}
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-psa-gold-500 to-psa-gold-600 text-white rounded-xl font-medium shadow-glow-gold btn-glow btn-glow-gold"
                    >
                      View Results
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : event.feedback_count >= 30 ? (
                    <motion.button
                      onClick={() => navigate(`/event/${event.id}/results`)}
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-xl font-medium shadow-glow-green btn-glow"
                    >
                      <Sparkles className="w-4 h-4" />
                      Compute Score
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => navigate(`/event/${event.id}/feedback`)}
                      whileHover={{ scale: 1.05, x: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-5 py-3 glass-card text-psa-green-400 rounded-xl font-medium border border-psa-green-500/30 hover:border-psa-green-500/60 hover:bg-psa-green-500/10 transition-all"
                    >
                      Collect Feedback
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
