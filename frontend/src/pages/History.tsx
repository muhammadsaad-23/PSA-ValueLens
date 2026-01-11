import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowUpDown, Eye } from 'lucide-react'

interface HistoryItem {
  id: number
  name: string
  attendance: number
  revenue: number
  revenue_score: number
  feedback_score: number
  value_score: number
  created_at: string
}

type SortKey = 'name' | 'value_score' | 'feedback_score' | 'revenue_score' | 'created_at'

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(setHistory)
  }, [])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function toggleSelect(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const sorted = [...history].sort((a, b) => {
    const mul = sortAsc ? 1 : -1
    if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
    if (sortKey === 'created_at') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return mul * ((a[sortKey] as number) - (b[sortKey] as number))
  })

  const comparison = history.filter(h => selected.has(h.id))

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold gradient-text">Event History</h2>
        <p className="text-gray-600 mt-1">Compare past event performance</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-500">No scored events yet</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100"
          >
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={e => {
                        if (e.target.checked) setSelected(new Set(history.map(h => h.id)))
                        else setSelected(new Set())
                      }}
                      checked={selected.size === history.length && history.length > 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                      Event <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => toggleSort('value_score')} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 mx-auto">
                      Value <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => toggleSort('feedback_score')} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 mx-auto">
                      Feedback <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button onClick={() => toggleSort('revenue_score')} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 mx-auto">
                      Revenue <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-psa-green-100 text-psa-green-700 font-bold">
                        {item.value_score}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-semibold text-psa-gold-600">{item.feedback_score}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-semibold text-blue-600">{item.revenue_score}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => navigate(`/event/${item.id}/results`)}
                        className="p-2 text-gray-400 hover:text-psa-green-600 hover:bg-psa-green-50 rounded-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {comparison.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
            >
              <h3 className="font-display text-xl font-semibold mb-6">Comparison Chart</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison} barCategoryGap="20%">
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value_score" name="Value" fill="#006233" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="feedback_score" name="Feedback" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue_score" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
