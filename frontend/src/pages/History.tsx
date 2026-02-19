import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ArrowUpDown, Eye, Clock, TrendingUp, Award, BarChart3 } from 'lucide-react'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-4 rounded-xl border border-white/10">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ background: entry.fill }} />
            <span className="text-white/60">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-psa-green-400'
    if (score >= 60) return 'text-psa-gold-500'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-10" variants={itemVariants}>
        <h2 className="font-display text-4xl font-bold gradient-text">Event History</h2>
        <p className="text-white/50 mt-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-psa-gold-500" />
          Compare past event performance
        </p>
      </motion.div>

      {history.length === 0 ? (
        <motion.div 
          className="text-center py-20 glass-card rounded-3xl"
          variants={itemVariants}
        >
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <BarChart3 className="w-10 h-10 text-psa-green-500" />
          </motion.div>
          <p className="text-white/40 text-lg">No scored events yet</p>
          <p className="text-white/30 mt-2">Complete feedback collection and compute scores to see history</p>
        </motion.div>
      ) : (
        <>
          {/* Table */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-3xl overflow-hidden mb-8"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-5 text-left">
                      <input
                        type="checkbox"
                        onChange={e => {
                          if (e.target.checked) setSelected(new Set(history.map(h => h.id)))
                          else setSelected(new Set())
                        }}
                        checked={selected.size === history.length && history.length > 0}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-psa-green-500 focus:ring-psa-green-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-5 text-left">
                      <motion.button 
                        onClick={() => toggleSort('name')} 
                        className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                        whileHover={{ x: 3 }}
                      >
                        Event <ArrowUpDown className="w-4 h-4" />
                      </motion.button>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <motion.button 
                        onClick={() => toggleSort('value_score')} 
                        className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors mx-auto"
                        whileHover={{ scale: 1.05 }}
                      >
                        Value <ArrowUpDown className="w-4 h-4" />
                      </motion.button>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <motion.button 
                        onClick={() => toggleSort('feedback_score')} 
                        className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors mx-auto"
                        whileHover={{ scale: 1.05 }}
                      >
                        Feedback <ArrowUpDown className="w-4 h-4" />
                      </motion.button>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <motion.button 
                        onClick={() => toggleSort('revenue_score')} 
                        className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors mx-auto"
                        whileHover={{ scale: 1.05 }}
                      >
                        Revenue <ArrowUpDown className="w-4 h-4" />
                      </motion.button>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <span className="text-sm font-medium text-white/60">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {sorted.map((item) => (
                      <motion.tr
                        key={item.id}
                        variants={itemVariants}
                        onMouseEnter={() => setHoveredRow(item.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`border-b border-white/5 transition-all duration-300 ${
                          hoveredRow === item.id ? 'bg-white/5' : ''
                        } ${selected.has(item.id) ? 'bg-psa-green-500/10' : ''}`}
                      >
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="w-5 h-5 rounded border-white/20 bg-white/5 text-psa-green-500 focus:ring-psa-green-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              className="w-12 h-12 rounded-xl bg-gradient-to-br from-psa-green-500/20 to-psa-green-700/20 flex items-center justify-center"
                              animate={hoveredRow === item.id ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                            >
                              <TrendingUp className="w-6 h-6 text-psa-green-500" />
                            </motion.div>
                            <div>
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-xs text-white/40">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <motion.div 
                            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl glass-card ${getScoreColor(item.value_score)}`}
                            whileHover={{ scale: 1.1 }}
                          >
                            <span className="text-xl font-bold">{item.value_score}</span>
                          </motion.div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-xl font-semibold text-psa-gold-500">{item.feedback_score}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-xl font-semibold text-blue-400">{item.revenue_score}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <motion.button
                            onClick={() => navigate(`/event/${item.id}/results`)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-3 text-white/40 hover:text-psa-green-400 glass-card rounded-xl hover:bg-psa-green-500/10 transition-all"
                          >
                            <Eye className="w-5 h-5" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Comparison Chart */}
          <AnimatePresence>
            {comparison.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="glass-card rounded-3xl p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-psa-green-500/20 to-psa-gold-500/20 flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <BarChart3 className="w-6 h-6 text-psa-green-500" />
                  </motion.div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">Comparison Chart</h3>
                    <p className="text-white/40 text-sm">Comparing {comparison.length} events</p>
                  </div>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparison} barCategoryGap="20%">
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: 20 }}
                        formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
                      />
                      <Bar 
                        dataKey="value_score" 
                        name="Value" 
                        fill="#22c55e" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="feedback_score" 
                        name="Feedback" 
                        fill="#D4AF37" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="revenue_score" 
                        name="Revenue" 
                        fill="#3b82f6" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {comparison.length === 1 && (
            <motion.div 
              className="glass-card rounded-2xl p-6 text-center text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Award className="w-8 h-8 mx-auto mb-3 text-psa-gold-500" />
              <p>Select one more event to compare</p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
