import React, { useMemo } from 'react'

export default function BackgroundParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const size = Math.random() * 3 + 1 // 1px to 4px
      const left = Math.random() * 100 // 0% to 100%
      const top = Math.random() * 100
      const duration = Math.random() * 20 + 20 // 20s to 40s
      const delay = Math.random() * -20 // random start point
      
      return { id: i, size, left, top, duration, delay }
    })
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
          100% { transform: translateY(0) translateX(0); opacity: 0.1; }
        }
      `}</style>
      
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-300"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: 0.1,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`
          }}
        />
      ))}
    </div>
  )
}
