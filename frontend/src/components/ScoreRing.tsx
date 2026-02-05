import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number
  label: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'gold' | 'blue'
}

const sizes = {
  sm: { ring: 90, stroke: 8, text: 'text-xl', label: 'text-xs' },
  md: { ring: 140, stroke: 10, text: 'text-3xl', label: 'text-sm' },
  lg: { ring: 200, stroke: 14, text: 'text-5xl', label: 'text-base' },
}

const colors = {
  green: { 
    primary: '#22c55e', 
    secondary: 'rgba(34, 197, 94, 0.1)',
    glow: 'rgba(34, 197, 94, 0.4)',
    gradient: ['#22c55e', '#006233'],
  },
  gold: { 
    primary: '#D4AF37', 
    secondary: 'rgba(212, 175, 55, 0.1)',
    glow: 'rgba(212, 175, 55, 0.4)',
    gradient: ['#fbbf24', '#D4AF37'],
  },
  blue: { 
    primary: '#3b82f6', 
    secondary: 'rgba(59, 130, 246, 0.1)',
    glow: 'rgba(59, 130, 246, 0.4)',
    gradient: ['#60a5fa', '#3b82f6'],
  },
}

// Animated number counter
function AnimatedNumber({ value, className }: { value: number; className: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    })
    return controls.stop
  }, [value])

  return <span className={className}>{displayValue}</span>
}

export default function ScoreRing({ score, label, size = 'md', color = 'green' }: ScoreRingProps) {
  const { ring, stroke, text, label: labelSize } = sizes[size]
  const { primary, secondary, glow, gradient } = colors[color]
  const radius = (ring - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <motion.div 
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div 
        className="relative" 
        style={{ width: ring, height: ring }}
      >
        {/* Glow effect behind ring */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-50"
          style={{ 
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* SVG Ring */}
        <svg 
          width={ring} 
          height={ring} 
          className="transform -rotate-90 relative z-10"
          style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
        >
          {/* Background circle */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={secondary}
            strokeWidth={stroke}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>

          {/* Progress circle */}
          <motion.circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />

          {/* Animated dot at the end of progress */}
          <motion.circle
            cx={ring / 2 + radius * Math.cos((Math.PI * 2 * score / 100) - Math.PI / 2)}
            cy={ring / 2 + radius * Math.sin((Math.PI * 2 * score / 100) - Math.PI / 2)}
            r={stroke / 2 + 2}
            fill={primary}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
          >
            <AnimatedNumber 
              value={score} 
              className={`font-display font-bold ${text}`}
              style={{ color: primary }}
            />
            <motion.span 
              className={`${text} text-white/30`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              %
            </motion.span>
          </motion.div>
        </div>

        {/* Particle effects for high scores */}
        {score >= 80 && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ background: primary, left: '50%', top: '50%' }}
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      <motion.span 
        className={`font-medium text-white/60 ${labelSize}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {label}
      </motion.span>
    </motion.div>
  )
}
