'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getRun, Interval } from '@/lib/program'
import { calculateDistance, estimateSteps, estimateCalories } from '@/lib/stats'
import dynamic from 'next/dynamic'

const RunMap = dynamic(() => import('@/components/RunMap'), { ssr: false })

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function speak(text: string) {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export default function ActiveRunPage() {
  const params = useParams()
  const week = parseInt(params.week as string)
  const day = parseInt(params.day as string)
  const router = useRouter()
  const supabase = createClient()

  const runDay = getRun(week, day)
  const intervals = runDay?.intervals ?? []

  // Run state
  const [intervalIndex, setIntervalIndex] = useState(0)
  const [intervalElapsed, setIntervalElapsed] = useState(0)
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)

  // Stats
  const [coords, setCoords] = useState<[number, number][]>([])
  const [distance, setDistance] = useState(0)
  const [runTime, setRunTime] = useState(0)
  const [walkTime, setWalkTime] = useState(0)

  const pausedRef = useRef(false)
  const finishedRef = useRef(false)
  const intervalIndexRef = useRef(0)
  const intervalElapsedRef = useRef(0)
  const totalElapsedRef = useRef(0)
  const runTimeRef = useRef(0)
  const walkTimeRef = useRef(0)
  const coordsRef = useRef<[number, number][]>([])

  const currentInterval: Interval = intervals[intervalIndex] ?? { type: 'walk', duration: 0 }
  const remaining = currentInterval.duration - intervalElapsed

  // Announce interval
  const announceInterval = useCallback((interval: Interval, index: number) => {
    const isFirst = index === 0
    const isLast = index === intervals.length - 1
    if (isFirst) {
      speak('Starting warmup walk. Get ready.')
    } else if (isLast) {
      speak('Cooldown walk. Great job, you are almost done.')
    } else if (interval.type === 'run') {
      speak('Start running!')
    } else {
      speak('Walk now. Take a breather.')
    }
  }, [intervals])

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (pausedRef.current || finishedRef.current) return
        const newCoord: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        coordsRef.current = [...coordsRef.current, newCoord]
        setCoords([...coordsRef.current])
        const dist = calculateDistance(coordsRef.current)
        setDistance(dist)
      },
      (err) => console.warn('GPS error', err),
      { enableHighAccuracy: true, distanceFilter: 5 } as PositionOptions
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Main timer
  useEffect(() => {
    announceInterval(intervals[0], 0)

    const timer = setInterval(() => {
      if (pausedRef.current || finishedRef.current) return

      // Increment totals
      totalElapsedRef.current += 1
      setTotalElapsed(totalElapsedRef.current)

      const currentType = intervals[intervalIndexRef.current]?.type
      if (currentType === 'run') {
        runTimeRef.current += 1
        setRunTime(runTimeRef.current)
      } else {
        walkTimeRef.current += 1
        setWalkTime(walkTimeRef.current)
      }

      // Interval countdown
      intervalElapsedRef.current += 1
      setIntervalElapsed(intervalElapsedRef.current)

      const current = intervals[intervalIndexRef.current]
      if (!current) return

      // 30 second warning
      const timeLeft = current.duration - intervalElapsedRef.current
      if (timeLeft === 30) {
        speak('30 seconds left')
      }

      // Advance to next interval
      if (intervalElapsedRef.current >= current.duration) {
        const nextIndex = intervalIndexRef.current + 1
        if (nextIndex >= intervals.length) {
          // Run complete
          finishedRef.current = true
          setFinished(true)
          speak('Run complete! Amazing work.')
          clearInterval(timer)
        } else {
          intervalIndexRef.current = nextIndex
          intervalElapsedRef.current = 0
          setIntervalIndex(nextIndex)
          setIntervalElapsed(0)
          announceInterval(intervals[nextIndex], nextIndex)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Save run and redirect to summary
  useEffect(() => {
    if (!finished) return

    async function saveRun() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const dist = calculateDistance(coordsRef.current)
      const steps = estimateSteps(dist, runTimeRef.current, walkTimeRef.current)
      const calories = estimateCalories(dist, totalElapsedRef.current)

      const route = {
        type: 'LineString',
        coordinates: coordsRef.current.map(([lat, lng]) => [lng, lat]),
      }

      await supabase
        .from('runs')
        .update({
          status: 'completed',
          duration: totalElapsedRef.current,
          distance: dist,
          steps,
          calories,
          walk_time: walkTimeRef.current,
          run_time: runTimeRef.current,
          route,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('week', week)
        .eq('day', day)

      router.push(`/run/${week}/${day}/summary`)
    }

    saveRun()
  }, [finished])

  function togglePause() {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
    if (pausedRef.current) {
      speak('Run paused.')
    } else {
      speak('Resuming.')
    }
  }

  async function endEarly() {
    pausedRef.current = true
    finishedRef.current = true
    speak('Run ended.')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dist = calculateDistance(coordsRef.current)
    const steps = estimateSteps(dist, runTimeRef.current, walkTimeRef.current)
    const calories = estimateCalories(dist, totalElapsedRef.current)

    const route = {
      type: 'LineString',
      coordinates: coordsRef.current.map(([lat, lng]) => [lng, lat]),
    }

    await supabase
      .from('runs')
      .update({
        status: 'completed',
        duration: totalElapsedRef.current,
        distance: dist,
        steps,
        calories,
        walk_time: walkTimeRef.current,
        run_time: runTimeRef.current,
        route,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('week', week)
      .eq('day', day)

    router.push(`/run/${week}/${day}/summary`)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Map */}
      <div className="flex-1 relative min-h-[50vh]">
        <RunMap coords={coords} />

        {/* Overlay stats */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <div className="bg-black/70 backdrop-blur rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-zinc-400">Distance</p>
            <p className="text-lg font-black">{distance.toFixed(2)} km</p>
          </div>
          <div className="bg-black/70 backdrop-blur rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-zinc-400">Time</p>
            <p className="text-lg font-black">{formatTime(totalElapsed)}</p>
          </div>
          <div className="bg-black/70 backdrop-blur rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-zinc-400">Pace</p>
            <p className="text-lg font-black">
              {distance > 0
                ? formatTime(Math.round(totalElapsed / distance)) + '/km'
                : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-zinc-950 px-6 py-8 rounded-t-3xl">
        {/* Current interval */}
        <div className="text-center mb-6">
          <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">
            {currentInterval.type === 'run' ? '🏃 Running' : '🚶 Walking'}
          </p>
          <p className="text-6xl font-black tabular-nums">{formatTime(remaining)}</p>
          {intervals[intervalIndex + 1] && (
            <p className="text-zinc-600 text-sm mt-2">
              Next: {intervals[intervalIndex + 1].type} for{' '}
              {formatTime(intervals[intervalIndex + 1].duration)}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-8">
          <div
            className="bg-white h-1.5 rounded-full transition-all"
            style={{
              width: `${(totalElapsed / (runDay?.totalDuration ?? 1)) * 100}%`,
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={togglePause}
            className="flex-1 bg-white text-black font-bold py-4 rounded-2xl text-lg hover:bg-zinc-100 transition-all"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={endEarly}
            className="bg-zinc-800 text-zinc-400 font-medium px-6 py-4 rounded-2xl hover:bg-zinc-700 hover:text-white transition-all"
          >
            End
          </button>
        </div>
      </div>
    </main>
  )
}