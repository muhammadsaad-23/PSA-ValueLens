import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Brain, CheckCircle, AlertCircle } from 'lucide-react'

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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold gradient-text">Score Calibration</h2>
        <p className="text-gray-600 mt-1">Help the system learn from your expertise</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-psa-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-psa-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Learning Status</h3>
            {modelStatus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {modelStatus.status === 'learned' ? (
                    <CheckCircle className="w-4 h-4 text-psa-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-psa-gold-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {modelStatus.status === 'learned' 
                      ? `Model trained on ${modelStatus.trained_on} events (v${modelStatus.version})`
                      : 'Using rubric-based scoring'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {modelStatus.needs_more > 0 
                    ? `Need ${modelStatus.needs_more} more labeled events to enable learning`
                    : 'Learning is active! Labels improve accuracy'}
                </p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-psa-green-400 to-psa-green-600"
                    style={{ width: `${Math.min(100, (modelStatus.total_labels / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{modelStatus.total_labels} / 5 minimum labels</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-psa-gold-100 rounded-lg flex items-center justify-center">
            <Sliders className="w-5 h-5 text-psa-gold-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Submit Calibration Label</h3>
            <p className="text-sm text-gray-500">Provide your overall satisfaction rating</p>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No scored events available for calibration</p>
        ) : (
          <form onSubmit={submitLabel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
              <select
                value={selectedEvent || ''}
                onChange={e => setSelectedEvent(parseInt(e.target.value) || null)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-psa-green-500"
              >
                <option value="">Choose an event...</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} (Computed: {e.value_score})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Overall Satisfaction (0-100)
              </label>
              <p className="text-xs text-gray-500 mb-2">
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-psa-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedEvent || !label || submitting}
              className="w-full py-3 bg-gradient-to-r from-psa-green-600 to-psa-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Calibration'}
            </button>
          </form>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-psa-green-50 border border-psa-green-200 rounded-lg text-psa-green-700 text-sm"
          >
            {message}
          </motion.div>
        )}
      </motion.div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">How Calibration Works</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• After viewing computed scores, submit what YOU think the true satisfaction should be</li>
          <li>• Once 5+ events are labeled, the system trains a regression model</li>
          <li>• The model learns which feedback features correlate with your ratings</li>
          <li>• Future events use learned weights instead of fixed rubrics</li>
          <li>• This is simple linear regression, not "AI magic"</li>
        </ul>
      </div>
    </div>
  )
}
