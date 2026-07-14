import React, { useEffect, useState } from 'react'
import { useSplashStore } from '../../store/splashStore'
import SplashScreen from './SplashScreen'
import apiClient from '../../api/client'

export default function SplashProvider({ children }) {
  const { ready, setReady, setStatus, setProgress, setError, setLicense } = useSplashStore()
  const [showSplash, setShowSplash] = useState(true)
  const [fadeApp, setFadeApp] = useState(false)

  useEffect(() => {
    let isMounted = true

    const runStartupSequence = async () => {
      const startTime = Date.now()

      try {
        // Step 1
        setProgress(10)
        setStatus('Initializing Application...')
        await new Promise(r => setTimeout(r, 50))

        // Step 2
        setProgress(25)
        setStatus('Loading Configuration...')
        await new Promise(r => setTimeout(r, 50))

        // Step 3
        setProgress(40)
        setStatus('Loading Workspace...')
        await new Promise(r => setTimeout(r, 50))

        // Step 4
        setProgress(55)
        setStatus('Starting Services...')
        try {
          // Ping with a strict 1-second timeout so it never gets stuck
          await Promise.race([
            apiClient.get('/'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
          ])
        } catch (e) {
          console.warn("Backend ping timeout or error, proceeding anyway", e)
        }

        // Step 5
        setProgress(75)
        setStatus('Checking License...')
        try {
          const res = await Promise.race([
            apiClient.get('/license/status'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
          ])
          setLicense(res?.valid === true, res)
        } catch (e) {
          console.warn("License check timeout or error", e)
          setLicense(false, { valid: false, status: 'Error connecting to license service' })
        }

        // Step 6
        setProgress(90)
        setStatus('Preparing Interface...')
        await new Promise(r => setTimeout(r, 50))

        // Ensure minimum display time for premium feel, but keep it fast
        const elapsed = Date.now() - startTime
        const minTime = 800 // Reduced from 1200ms to 800ms
        if (elapsed < minTime) {
          await new Promise(r => setTimeout(r, minTime - elapsed))
        }

        setProgress(100)
        setStatus('Ready')
        
        // Wait a tiny bit at 100% before triggering fade out
        await new Promise(r => setTimeout(r, 100))

        if (isMounted) {
          setReady(true)
          
          // Trigger fade animations
          setTimeout(() => {
            if (isMounted) {
              setFadeApp(true)
              setTimeout(() => {
                if (isMounted) setShowSplash(false)
              }, 300) // wait for splash fade out animation to finish
            }
          }, 50)
        }

      } catch (err) {
        console.error("Startup Failed:", err)
        if (isMounted) {
          setError(err.message || 'Unable to start Raynz PitStop')
        }
      }
    }

    runStartupSequence()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="relative w-screen h-screen bg-[#05080E] overflow-hidden">
      {/* The main App */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${fadeApp ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {ready && children}
      </div>

      {/* The Splash Screen overlay */}
      {showSplash && (
        <div 
          className={`absolute inset-0 z-50 transition-opacity duration-300 ${ready ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
          <SplashScreen />
        </div>
      )}
    </div>
  )
}
