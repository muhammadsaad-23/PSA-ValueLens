import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Star, ChevronRight, Check, ArrowLeft, Sparkles, Send } from 'lucide-react'

interface Respondent {
  id: string
  submitted: boolean
}

export default function FeedbackEntry() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [eventName, setEventName] = useState('')
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [text, setText] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchEvent()
    fetchRespondents()
  }, [eventId])

  async function fetchEvent() {
    const res = await fetch(`/api/events/${eventId}`)
    const data = await res.json()
    setEventName(data.name)
  }

  async function fetchRespondents() {
    const res = await fetch(`/api/events/${eventId}/respondents`)
    const data = await res.json()
    setRespondents(data.respondents.map((id: string) => ({ id, submitted: false })))
    setSubmitted(data.submitted || 0)
    setCurrentIndex(data.submitted || 0)
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || text.length < 10) return
    
    setSubmitting(true)
    const respondentId = respondents[currentIndex]?.id
    
    const res = await fetch(`/api/events/${eventId}/feedbacks?respondent_id=${respondentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, rating })
    })
    
    if (res.ok) {
      const newSubmitted = submitted + 1
      setSubmitted(newSubmitted)
      setShowSuccess(true)
      
      setTimeout(() => {
        setShowSuccess(false)
        setText('')
        setRating(null)
        
        if (newSubmitted >= 30) {
          navigate(`/event/${eventId}/results`)
        } else {
          setCurrentIndex(prev => prev + 1)
        }
      }, 800)
    }
    setSubmitting(false)
  }

  const progress = (submitted / 30) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
        className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </motion.button>

      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-4xl font-bold gradient-text">{eventName}</h2>
        <p className="text-white/50 mt-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-psa-gold-500" />
          Collecting participant feedback
        </p>
      </motion.div>

      {/* Progress Card */}
      <motion.div 
        className="glass-card rounded-3xl p-6 mb-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/60">Progress</span>
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-2xl font-bold text-white"
              key={submitted}
              initial={{ scale: 1.3, color: '#D4AF37' }}
              animate={{ scale: 1, color: '#ffffff' }}
            >
              {submitted}
            </motion.span>
            <span className="text-white/40">/ 30</span>
          </div>
        </div>
        
        <div className="h-4 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-psa-green-500 via-psa-green-400 to-psa-gold-500 progress-shine rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Milestone markers */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[10, 20, 30].map((milestone) => (
              <div 
                key={milestone}
                className={`w-0.5 h-full ${submitted >= milestone ? 'bg-white/40' : 'bg-white/10'}`}
                style={{ marginLeft: `${(milestone / 30) * 100 - 1}%` }}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-3 text-xs text-white/30">
          <span>Start</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-psa-gold-500" />
            Complete
          </span>
        </div>
      </motion.div>

      {/* Feedback Form */}
      <AnimatePresence mode="wait">
        {submitted < 30 && respondents[currentIndex] && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="glass-card rounded-3xl p-8 relative overflow-hidden"
          >
            {/* Success overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  className="absolute inset-0 bg-psa-green-500/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-20 h-20 bg-psa-green-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Respondent Info */}
            <div className="flex items-center gap-4 mb-8">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <MessageSquare className="w-7 h-7 text-psa-green-500" />
              </motion.div>
              <div>
                <p className="text-white/40 text-sm">Anonymous Respondent</p>
                <p className="font-mono text-lg font-medium text-white tracking-wide">
                  {respondents[currentIndex].id}
                </p>
              </div>
              <div className="ml-auto">
                <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/60 text-sm">
                  #{submitted + 1} of 30
                </span>
              </div>
            </div>

            <form onSubmit={submitFeedback}>
              {/* Feedback Text */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Share your experience <span className="text-psa-gold-500">*</span>
                </label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="What did you think about the event? Share what you liked, what could be improved, and your overall experience..."
                  className="w-full h-36 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:bg-white/10 focus:border-psa-green-500/50 transition-all resize-none"
                  required
                  minLength={10}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-white/30">Minimum 10 characters</p>
                  <p className={`text-xs ${text.length >= 10 ? 'text-psa-green-500' : 'text-white/30'}`}>
                    {text.length} characters
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-10">
                <label className="block text-sm font-medium text-white/70 mb-4">
                  Overall rating <span className="text-white/30">(optional)</span>
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? null : n)}
                      whileHover={{ scale: 1.15, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      className={`star-btn w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        rating !== null && n <= rating
                          ? 'bg-gradient-to-br from-psa-gold-400 to-psa-gold-600 text-white shadow-glow-gold'
                          : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50'
                      }`}
                    >
                      <Star className={`w-7 h-7 ${rating !== null && n <= rating ? 'fill-current' : ''}`} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={submitting || text.length < 10}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-2xl font-medium text-lg shadow-glow-green hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
              >
                {submitting ? (
                  <span className="flex items-center gap-3">
                    <motion.div 
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Submitting...
                  </span>
                ) : submitted === 29 ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Submit & View Results
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit & Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion State */}
      {submitted >= 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-10 text-center relative overflow-hidden"
        >
          {/* Celebration particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#D4AF37' : '#22c55e',
                  left: `${Math.random() * 100}%`,
                  top: '50%',
                }}
                animate={{
                  y: [0, -200 - Math.random() * 200],
                  x: [(Math.random() - 0.5) * 200],
                  opacity: [1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div 
            className="relative z-10"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-psa-green-500 to-psa-green-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-green"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <h3 className="font-display text-3xl font-bold gradient-text mb-3">All Feedback Collected!</h3>
            <p className="text-white/50 mb-8">Ready to compute the Value Score</p>
            <motion.button
              onClick={() => navigate(`/event/${eventId}/results`)}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-2xl font-medium text-lg shadow-glow-green hover:shadow-glow-lg transition-all btn-glow"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                View Results
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
