'use client'

import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function StreakTracker({ streak }: { streak: number }) {
  const [mounted, setMounted] = useState(false)
  const isActive = streak > 0

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div 
      className="card fade-up"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px',
        background: isActive ? 'linear-gradient(135deg, rgba(193,126,74,0.1), rgba(193,126,74,0.02))' : 'var(--surface-2)',
        border: isActive ? '1px solid rgba(193,126,74,0.3)' : '1px solid var(--border)',
        borderRadius: 99,
        boxShadow: isActive ? '0 4px 20px rgba(193,126,74,0.15)' : 'none',
        animationDelay: '100ms'
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isActive ? 'rgba(193,126,74,0.15)' : 'var(--surface)',
          color: isActive ? 'var(--accent)' : 'var(--ink-4)',
          position: 'relative'
        }}
      >
        {isActive && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'var(--accent)',
              opacity: 0.2,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} 
          />
        )}
        <Flame size={16} style={{ 
          animation: isActive ? 'wiggle 2s ease-in-out infinite' : 'none',
          fill: isActive ? 'var(--accent)' : 'none'
        }} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--ink-3)', lineHeight: 1 }}>
          {streak} Day{streak !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>
          {isActive ? 'Current Streak' : 'No Active Streak'}
        </span>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}} />
    </div>
  )
}
