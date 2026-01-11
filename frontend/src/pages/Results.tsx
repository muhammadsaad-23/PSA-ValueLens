import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, TrendingUp, Users, DollarSign, ArrowLeft } from 'lucide-react'
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
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-psa-green-200 border-t-psa-green-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!score && !computing) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-psa-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-psa-green-600" />
        </div>
        <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">Ready to Analyze</h2>
        <p className="text-gray-600 mb-8">Click below to compute the Value Score based on revenue data and participant feedback.</p>
        <button
          onClick={computeScore}
          disabled={computing}
          className="px-8 py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {computing ? 'Computing...' : 'Compute Value Score'}
        </button>
      </div>
    )
  }

  if (!score) return null

  const categories = Object.entries(score.explanation.feedback.category_breakdown)
    .sort((a, b) => b[1] - a[1])

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-psa-green-600 mb-6 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold gradient-text">{score.event_name}</h2>
        <p className="text-gray-600 mt-1">Event Value Analysis</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
      >
        <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
          <ScoreRing score={score.value_score} label="Value Score" size="lg" color="green" />
          <div className="w-px h-32 bg-gray-200 hidden lg:block" />
          <div className="flex gap-12">
            <ScoreRing score={score.feedback_score} label="Feedback" size="md" color="gold" />
            <ScoreRing score={score.revenue_score} label="Revenue" size="md" color="blue" />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-center text-gray-600">
            Value Score = <span className="font-semibold">50% Feedback</span> + <span className="font-semibold">50% Revenue</span>
          </p>
          <p className="text-center text-sm text-gray-400 mt-1">
            Scoring method: {score.explanation.feedback.method === 'learned' ? 'AI-learned weights' : 'Rubric-based'}
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-psa-green-600" />
            Positive Themes
          </h3>
          {score.explanation.feedback.positive_themes.length > 0 ? (
            <ul className="space-y-2">
              {score.explanation.feedback.positive_themes.map((theme, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-psa-green-500 rounded-full" />
                  {theme}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No strong positive themes detected</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-red-500" />
            Areas for Improvement
          </h3>
          {score.explanation.feedback.negative_themes.length > 0 ? (
            <ul className="space-y-2">
              {score.explanation.feedback.negative_themes.map((theme, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  {theme}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No major issues detected</p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-xl p-6 mt-6 border border-gray-100"
      >
        <h3 className="font-display text-xl font-semibold mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categories.map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-4">
              <span className="w-24 text-sm text-gray-600 capitalize">{cat}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-psa-green-400 to-psa-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="w-12 text-sm font-medium text-gray-700 text-right">{val}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-6 mt-6 border border-gray-100"
      >
        <h3 className="font-display text-xl font-semibold mb-4">Revenue Analysis</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Per Attendee</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${score.explanation.revenue.revenue_per_attendee.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">Min Benchmark</p>
            <p className="text-2xl font-bold text-gray-900">
              ${score.explanation.revenue.min_benchmark.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">Max Benchmark</p>
            <p className="text-2xl font-bold text-gray-900">
              ${score.explanation.revenue.max_benchmark.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-4 text-center">
          Normalization: {score.explanation.revenue.normalization === 'rolling' ? 'Based on past events' : 'Using default benchmarks'}
        </p>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate('/admin')}
          className="px-6 py-3 border-2 border-psa-green-600 text-psa-green-600 rounded-xl font-medium hover:bg-psa-green-50 transition-all"
        >
          Calibrate This Score
        </button>
      </div>
    </div>
  )
}
