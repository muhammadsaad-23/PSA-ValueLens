import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Star, ChevronRight, Check } from 'lucide-react'

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
      setText('')
      setRating(null)
      
      if (newSubmitted >= 30) {
        navigate(`/event/${eventId}/results`)
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }
    setSubmitting(false)
  }

  const progress = (submitted / 30) * 100

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold gradient-text">{eventName}</h2>
        <p className="text-gray-600 mt-1">Collecting participant feedback</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className="text-sm font-bold text-psa-green-600">{submitted} / 30</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-psa-green-500 to-psa-green-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Start</span>
          <span>Complete</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submitted < 30 && respondents[currentIndex] && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-psa-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-psa-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Anonymous Respondent</p>
                <p className="font-mono text-sm font-medium text-gray-900">{respondents[currentIndex].id}</p>
              </div>
            </div>

            <form onSubmit={submitFeedback}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share your experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="What did you think about the event? Share what you liked, what could be improved, and your overall experience..."
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-psa-green-500 focus:border-transparent resize-none"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Overall rating <span className="text-gray-400">(optional)</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? null : n)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        rating === n
                          ? 'bg-psa-gold-500 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${rating && n <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || text.length < 10}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  'Submitting...'
                ) : submitted === 29 ? (
                  <>
                    Submit & View Results
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Submit & Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {submitted >= 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center border border-psa-green-200"
        >
          <div className="w-16 h-16 bg-psa-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-psa-green-600" />
          </div>
          <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">All Feedback Collected!</h3>
          <p className="text-gray-600 mb-6">Ready to compute the Value Score</p>
          <button
            onClick={() => navigate(`/event/${eventId}/results`)}
            className="px-8 py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            View Results
          </button>
        </motion.div>
      )}
    </div>
  )
}
