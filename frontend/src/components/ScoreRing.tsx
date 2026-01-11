import { motion } from 'framer-motion'

interface ScoreRingProps {
  score: number
  label: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'gold' | 'blue'
}

const sizes = {
  sm: { ring: 80, stroke: 6, text: 'text-lg' },
  md: { ring: 120, stroke: 8, text: 'text-2xl' },
  lg: { ring: 180, stroke: 10, text: 'text-4xl' },
}

const colors = {
  green: { primary: '#006233', secondary: '#86efac' },
  gold: { primary: '#D4AF37', secondary: '#fde68a' },
  blue: { primary: '#3b82f6', secondary: '#bfdbfe' },
}

export default function ScoreRing({ score, label, size = 'md', color = 'green' }: ScoreRingProps) {
  const { ring, stroke, text } = sizes[size]
  const { primary, secondary } = colors[color]
  const radius = (ring - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg width={ring} height={ring} className="transform -rotate-90">
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={secondary}
            strokeWidth={stroke}
          />
          <motion.circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={`font-display font-bold ${text}`}
            style={{ color: primary }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  )
}
