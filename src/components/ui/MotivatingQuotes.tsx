'use client'

import { useState, useEffect } from 'react'

const QUOTES = [
  "The future depends on what you do today.",
  "Don't watch the clock; do what it does. Keep going.",
  "Opportunities don't happen. You create them.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Your time is limited, don't waste it living someone else's life.",
  "Believe you can and you're halfway there.",
  "I find that the harder I work, the more luck I seem to have.",
  "It always seems impossible until it's done.",
  "Dreams don't work unless you do."
]

export default function MotivatingQuotes() {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % QUOTES.length)
        setFade(true)
      }, 400) // Wait for fade out
    }, 15000) // Change every 15 seconds to be more dynamic

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ 
      marginTop: 8, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 10,
      opacity: fade ? 1 : 0, 
      transition: 'opacity 600ms ease-in-out',
      background: 'linear-gradient(90deg, rgba(193,126,74,0.08) 0%, transparent 100%)',
      padding: '6px 14px 6px 8px',
      borderRadius: 999,
      borderLeft: '2px solid var(--accent)'
    }}>
      <span style={{ fontSize: 14 }}>✨</span>
      <p style={{ 
        fontSize: 13, 
        color: 'var(--ink-2)', 
        fontStyle: 'italic', 
        fontFamily: 'Instrument Serif, serif',
        letterSpacing: '0.02em',
        fontSize: 17
      }}>
        "{QUOTES[index]}"
      </p>
    </div>
  )
}
