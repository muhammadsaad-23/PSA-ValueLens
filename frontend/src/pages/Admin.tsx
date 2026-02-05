import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sliders, Brain, CheckCircle, AlertCircle, Sparkles, Zap, Target, Info } from 'lucide-react'

interface Event {
  id: number
  name: string
  value_score: number
}

interface ModelStatus {
  status: string
  version?: number
  trained_on: number
  total_labels: number
  needs_more: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Admin() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchModelStatus()
  }, [])

  async function fetchEvents() {
    const res = await fetch('/api/history')
    const data = await res.json()
    setEvents(data.map((e: any) => ({ id: e.id, name: e.name, value_score: e.value_score })))
  }

  async function fetchModelStatus() {
    const res = await fetch('/api/model-status')
    const data = await res.json()
    setModelStatus(data)
  }

  async function submitLabel(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEvent || !label) return
    
    setSubmitting(true)
    const res = await fetch(`/api/events/${selectedEvent}/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_label: parseFloat(label) })
    })
    
    if (res.ok) {
      const data = await res.json()
      setMessage(data.message)
      setLabel('')
      setSelectedEvent(null)
      fetchModelStatus()
    }
    setSubmitting(false)
  }

  const progressPercent = modelStatus ? Math.min(100, (modelStatus.total_labels / 5) * 100) : 0

  return (
    <motion.div 
      className="max-w-3xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-10" variants={itemVariants}>
        <h2 className="font-display text-4xl font-bold gradient-text">Score Calibration</h2>
        <p className="text-white/50 mt-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-psa-gold-500" />
          Help the system learn from your expertise
        </p>
      </motion.div>

      {/* Model Status Card */}
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden"
      >
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-psa-green-500 via-psa-gold-500 to-psa-green-500" />
        
        <div className="flex items-start gap-5">
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 flex items-center justify-center flex-shrink-0"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Brain className="w-8 h-8 text-psa-green-500" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-semibold text-white mb-3">Learning Status</h3>
            {modelStatus && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {modelStatus.status === 'learned' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-psa-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-psa-green-500" />
                      </div>
                      <span className="text-white/80">
                        Model trained on <span className="font-bold text-psa-green-400">{modelStatus.trained_on}</span> events 
                        <span className="text-white/40 ml-1">(v{modelStatus.version})</span>
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-psa-gold-500/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-psa-gold-500" />
                      </div>
                      <span className="text-white/80">Using rubric-based scoring</span>
                    </motion.div>
                  )}
                </div>
                
                <p className="text-white/50 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-psa-gold-500" />
                  {modelStatus.needs_more > 0 
                    ? `Need ${modelStatus.needs_more} more labeled events to enable learning`
                    : 'Learning is active! Labels improve accuracy'}
                </p>
                
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-psa-green-500 to-psa-gold-500 rounded-full progress-shine"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>{modelStatus.total_labels} labeled</span>
                    <span>5 minimum</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Calibration Form Card */}
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="flex items-center gap-4 mb-8">
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-psa-gold-500/20 to-psa-gold-700/20 flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Sliders className="w-7 h-7 text-psa-gold-500" />
          </motion.div>
          <div>
            <h3 className="font-display text-xl font-semibold text-white">Submit Calibration Label</h3>
            <p className="text-white/40 text-sm">Provide your overall satisfaction rating</p>
          </div>
        </div>

        {events.length === 0 ? (
          <motion.div 
            className="text-center py-12 glass-card rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-8 h-8 text-white/30" />
            </motion.div>
            <p className="text-white/40">No scored events available for calibration</p>
            <p className="text-white/30 text-sm mt-2">Complete feedback collection first</p>
          </motion.div>
        ) : (
          <form onSubmit={submitLabel} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">Select Event</label>
              <div className="relative">
                <select
                  value={selectedEvent || ''}
                  onChange={e => setSelectedEvent(parseInt(e.target.value) || null)}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none cursor-pointer focus:bg-white/10 focus:border-psa-green-500/50 transition-all"
                >
                  <option value="" className="bg-dark-950">Choose an event...</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id} className="bg-dark-950">
                      {e.name} (Computed: {e.value_score})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">
                Your Overall Satisfaction (0-100)
              </label>
              <p className="text-xs text-white/40 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Based on your knowledge, what score would you give this event overall?
              </p>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g., 75"
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-lg placeholder-white/30 focus:bg-white/10 focus:border-psa-green-500/50 transition-all"
              />
              
              {/* Visual score indicator */}
              {label && (
                <motion.div 
                  className="flex items-center gap-4 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${
                        parseInt(label) >= 80 ? 'bg-psa-green-500' :
                        parseInt(label) >= 60 ? 'bg-psa-gold-500' :
                        parseInt(label) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, parseInt(label) || 0)}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold ${
                    parseInt(label) >= 80 ? 'text-psa-green-400' :
                    parseInt(label) >= 60 ? 'text-psa-gold-500' :
                    parseInt(label) >= 40 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {label}
                  </span>
                </motion.div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={!selectedEvent || !label || submitting}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-2xl font-medium text-lg shadow-glow-green hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <motion.div 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Submit Calibration
                </span>
              )}
            </motion.button>
          </form>
        )}

        {/* Success Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-5 glass-card rounded-2xl border border-psa-green-500/30 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-psa-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-psa-green-500" />
              </div>
              <p className="text-psa-green-400">{message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* How It Works Card */}
      <motion.div
        variants={itemVariants}
        className="mt-8 glass-card rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-psa-green-500 to-psa-gold-500" />
        
        <h4 className="font-display text-lg font-semibold text-white mb-6 flex items-center gap-3">
          <Brain className="w-5 h-5 text-psa-gold-500" />
          How Calibration Works
        </h4>
        <ul className="space-y-4">
          {[
            'After viewing computed scores, submit what YOU think the true satisfaction should be',
            'Once 5+ events are labeled, the system trains a regression model',
            'The model learns which feedback features correlate with your ratings',
            'Future events use learned weights instead of fixed rubrics',
            'This is simple linear regression, not "AI magic"'
          ].map((item, i) => (
            <motion.li 
              key={i}
              className="flex items-start gap-3 text-white/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <motion.span 
                className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-xs text-white/40 mt-0.5"
                whileHover={{ scale: 1.2, backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
              >
                {i + 1}
              </motion.span>
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  )
}
