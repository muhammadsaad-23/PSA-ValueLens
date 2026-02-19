import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, TrendingUp, Users, DollarSign, ArrowLeft, Sparkles, Zap, Award } from 'lucide-react'
import ScoreRing from '../components/ScoreRing'

interface ScoreData {
  event_id: number
  event_name: string
  revenue_score: number
  feedback_score: number
  value_score: number
  explanation: {
    feedback: {
      method: string
      positive_themes: string[]
      negative_themes: string[]
      category_breakdown: Record<string, number>
      sentiment_avg: number
      rating_avg: number | null
    }
    revenue: {
      revenue_per_attendee: number
      min_benchmark: number
      max_benchmark: number
      normalization: string
    }
    weights: { feedback: number; revenue: number }
  }
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

export default function Results() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [score, setScore] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    fetchScore()
  }, [eventId])

  async function fetchScore() {
    const res = await fetch(`/api/events/${eventId}/score`)
    if (res.ok) {
      const data = await res.json()
      setScore(data)
    }
    setLoading(false)
  }

  async function computeScore() {
    setComputing(true)
    const res = await fetch(`/api/events/${eventId}/compute-score`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setScore(data)
    }
    setComputing(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <motion.div 
          className="w-20 h-20 border-4 border-psa-green-500/20 border-t-psa-green-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.p 
          className="mt-6 text-white/50"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading results...
        </motion.p>
      </div>
    )
  }

  if (!score && !computing) {
    return (
      <motion.div 
        className="max-w-xl mx-auto text-center py-20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div 
          className="w-28 h-28 bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 rounded-full flex items-center justify-center mx-auto mb-8"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <TrendingUp className="w-14 h-14 text-psa-green-500" />
        </motion.div>
        <h2 className="font-display text-4xl font-bold gradient-text mb-4">Ready to Analyze</h2>
        <p className="text-white/50 mb-10 text-lg">Click below to compute the Value Score based on revenue data and participant feedback.</p>
        <motion.button
          onClick={computeScore}
          disabled={computing}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="px-10 py-4 bg-gradient-to-r from-psa-green-600 to-psa-green-500 text-white rounded-2xl font-medium text-lg shadow-glow-green hover:shadow-glow-lg transition-all disabled:opacity-50 btn-glow"
        >
          {computing ? (
            <span className="flex items-center gap-3">
              <motion.div 
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Computing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Compute Value Score
            </span>
          )}
        </motion.button>
      </motion.div>
    )
  }

  if (!score) return null

  const categories = Object.entries(score.explanation.feedback.category_breakdown)
    .sort((a, b) => b[1] - a[1])

  const getScoreLabel = (s: number) => {
    if (s >= 80) return { text: 'Excellent', color: 'text-psa-green-400' }
    if (s >= 60) return { text: 'Good', color: 'text-psa-gold-500' }
    if (s >= 40) return { text: 'Fair', color: 'text-orange-400' }
    return { text: 'Needs Work', color: 'text-red-400' }
  }

  const scoreLabel = getScoreLabel(score.value_score)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/')}
        variants={itemVariants}
        whileHover={{ x: -5 }}
        className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </motion.button>

      {/* Header */}
      <motion.div className="mb-10" variants={itemVariants}>
        <h2 className="font-display text-4xl font-bold gradient-text">{score.event_name}</h2>
        <p className="text-white/50 mt-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-psa-gold-500" />
          Andaza Analysis
        </p>
      </motion.div>

      {/* Main Score Card */}
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-3xl p-10 mb-8 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-psa-green-500 via-psa-gold-500 to-psa-green-500" />
        
        <div className="flex flex-col lg:flex-row items-center justify-around gap-10">
          <div className="text-center">
            <ScoreRing score={score.value_score} label="Value Score" size="lg" color="green" />
            <motion.div 
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card ${scoreLabel.color}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >
              <Award className="w-4 h-4" />
              <span className="font-medium">{scoreLabel.text}</span>
            </motion.div>
          </div>
          
          <div className="w-px h-40 bg-white/10 hidden lg:block" />
          
          <div className="flex gap-12">
            <ScoreRing score={score.feedback_score} label="Feedback" size="md" color="gold" />
            <ScoreRing score={score.revenue_score} label="Revenue" size="md" color="blue" />
          </div>
        </div>

        <motion.div 
          className="mt-10 pt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          <p className="text-center text-white/60">
            Value Score = <span className="font-semibold text-psa-gold-500">50% Feedback</span> + <span className="font-semibold text-blue-400">50% Revenue</span>
          </p>
          <p className="text-center text-xs text-white/30 mt-2 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            Scoring method: {score.explanation.feedback.method === 'learned' ? 'AI-learned weights' : 'Rubric-based'}
          </p>
        </motion.div>
      </motion.div>

      {/* Themes Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-psa-green-500 to-psa-green-700" />
          <h3 className="font-display text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-psa-green-500/20 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <ThumbsUp className="w-5 h-5 text-psa-green-500" />
            </motion.div>
            Positive Themes
          </h3>
          {score.explanation.feedback.positive_themes.length > 0 ? (
            <ul className="space-y-3">
              {score.explanation.feedback.positive_themes.map((theme, i) => (
                <motion.li 
                  key={i} 
                  className="flex items-center gap-3 text-white/70 group-hover:text-white/90 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <motion.span 
                    className="w-2 h-2 bg-psa-green-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                  {theme}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-white/30">No strong positive themes detected</p>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="glass-card rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-700" />
          <h3 className="font-display text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <ThumbsDown className="w-5 h-5 text-red-400" />
            </motion.div>
            Areas for Improvement
          </h3>
          {score.explanation.feedback.negative_themes.length > 0 ? (
            <ul className="space-y-3">
              {score.explanation.feedback.negative_themes.map((theme, i) => (
                <motion.li 
                  key={i} 
                  className="flex items-center gap-3 text-white/70 group-hover:text-white/90 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <motion.span 
                    className="w-2 h-2 bg-red-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                  {theme}
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-white/30">No major issues detected</p>
          )}
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-3xl p-8 mb-6"
      >
        <h3 className="font-display text-xl font-semibold text-white mb-6">Category Breakdown</h3>
        <div className="space-y-4">
          {categories.map(([cat, val], i) => (
            <motion.div 
              key={cat} 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="w-28 text-sm text-white/60 capitalize font-medium">{cat}</span>
              <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-psa-green-500 to-psa-gold-500 rounded-full progress-shine"
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                />
              </div>
              <motion.span 
                className="w-16 text-sm font-bold text-white text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {val}%
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Revenue Analysis */}
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-3xl p-8 mb-8"
      >
        <h3 className="font-display text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
          >
            <DollarSign className="w-5 h-5 text-blue-400" />
          </motion.div>
          Revenue Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Per Attendee', value: score.explanation.revenue.revenue_per_attendee, icon: Users },
            { label: 'Min Benchmark', value: score.explanation.revenue.min_benchmark, icon: TrendingUp },
            { label: 'Max Benchmark', value: score.explanation.revenue.max_benchmark, icon: Award },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              className="text-center p-6 glass-card rounded-2xl group hover:bg-white/5 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="flex items-center justify-center gap-2 text-white/40 mb-2">
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </div>
              <motion.p 
                className="text-3xl font-bold text-white"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
              >
                ${item.value.toFixed(2)}
              </motion.p>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-white/30 mt-6 text-center flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" />
          Normalization: {score.explanation.revenue.normalization === 'rolling' ? 'Based on past events' : 'Using default benchmarks'}
        </p>
      </motion.div>

      {/* Calibrate Button */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-center"
      >
        <motion.button
          onClick={() => navigate('/admin')}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 glass-card text-psa-green-400 rounded-2xl font-medium border border-psa-green-500/30 hover:border-psa-green-500/60 hover:bg-psa-green-500/10 transition-all"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Calibrate This Score
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
