import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Users, DollarSign, ChevronRight, Sparkles } from 'lucide-react'

interface Event {
  id: number
  name: string
  attendance: number
  revenue: number
  feedback_count: number
  has_score: boolean
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState('')
  const [revenue, setRevenue] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const res = await fetch('/api/events')
    const data = await res.json()
    setEvents(data)
  }

  async function seedDemo() {
    await fetch('/api/seed-demo', { method: 'POST' })
    fetchEvents()
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        attendance: parseInt(attendance),
        revenue: parseFloat(revenue)
      })
    })
    if (res.ok) {
      setName('')
      setAttendance('')
      setRevenue('')
      setShowForm(false)
      fetchEvents()
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold gradient-text">Event Dashboard</h2>
          <p className="text-gray-600 mt-1">Create and manage PSA events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={seedDemo}
            className="flex items-center gap-2 px-4 py-2 border-2 border-psa-gold-500 text-psa-gold-600 rounded-lg hover:bg-psa-gold-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Load Demo
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-psa-green-600 to-psa-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-psa-green-100"
        >
          <h3 className="font-display text-xl font-semibold mb-4">Create New Event</h3>
          <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., PSA Cultural Night 2024"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-psa-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={attendance}
                  onChange={e => setAttendance(e.target.value)}
                  placeholder="Number of attendees"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-psa-green-500"
                  min="1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  placeholder="Total revenue"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-psa-green-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-psa-green-600 text-white rounded-lg hover:bg-psa-green-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-psa-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-psa-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">Create your first event or load the demo</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 card-hover border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold text-gray-900">{event.name}</h3>
                  <div className="flex gap-6 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.attendance} attendees
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${event.revenue.toLocaleString()}
                    </span>
                    <span>
                      {event.feedback_count}/30 feedbacks
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {event.has_score ? (
                    <button
                      onClick={() => navigate(`/event/${event.id}/results`)}
                      className="flex items-center gap-2 px-4 py-2 bg-psa-gold-500 text-white rounded-lg hover:bg-psa-gold-600 transition-all"
                    >
                      View Results
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : event.feedback_count >= 30 ? (
                    <button
                      onClick={() => navigate(`/event/${event.id}/results`)}
                      className="flex items-center gap-2 px-4 py-2 bg-psa-green-600 text-white rounded-lg hover:bg-psa-green-700 transition-all"
                    >
                      Compute Score
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/event/${event.id}/feedback`)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-psa-green-600 text-psa-green-600 rounded-lg hover:bg-psa-green-50 transition-all"
                    >
                      Collect Feedback
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-psa-green-500 to-psa-green-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(event.feedback_count / 30) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
