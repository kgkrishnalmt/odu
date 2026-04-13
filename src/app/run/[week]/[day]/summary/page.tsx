'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const SummaryMap = dynamic(() => import('@/components/SummaryMap'), { ssr: false })

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

type Run = {
  week: number
  day: number
  duration: number
  distance: number
  steps: number
  calories: number
  walk_time: number
  run_time: number
  route: { coordinates: [number, number][] } | null
}

function drawShareCard(run: Run, week: number, day: number): string {
  const W = 800
  const H = 560
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#09090b')
  grad.addColorStop(1, '#18181b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Left accent bar
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 6, H)

  // Route line art (decorative, from actual coords if available)
  const route = run.route?.coordinates ?? []
  if (route.length > 1) {
    const lngs = route.map(([lng]) => lng)
    const lats = route.map(([, lat]) => lat)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)

    const artW = 220, artH = 220
    const artX = W - artW - 48
    const artY = (H - artH) / 2
    const pad = 20

    const scaleX = (artW - pad * 2) / (maxLng - minLng || 1)
    const scaleY = (artH - pad * 2) / (maxLat - minLat || 1)
    const scale = Math.min(scaleX, scaleY)

    const offsetX = artX + pad + ((artW - pad * 2) - (maxLng - minLng) * scale) / 2
    const offsetY = artY + pad + ((artH - pad * 2) - (maxLat - minLat) * scale) / 2

    // Glow effect
    ctx.shadowColor = 'rgba(255,255,255,0.3)'
    ctx.shadowBlur = 12

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 8
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    route.forEach(([lng, lat], i) => {
      const x = offsetX + (lng - minLng) * scale
      const y = offsetY + (maxLat - lat) * scale
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    route.forEach(([lng, lat], i) => {
      const x = offsetX + (lng - minLng) * scale
      const y = offsetY + (maxLat - lat) * scale
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ctx.shadowBlur = 0

    // Start dot
    const [sLng, sLat] = route[0]
    ctx.fillStyle = '#22c55e'
    ctx.beginPath()
    ctx.arc(offsetX + (sLng - minLng) * scale, offsetY + (maxLat - sLat) * scale, 6, 0, Math.PI * 2)
    ctx.fill()

    // End dot
    const [eLng, eLat] = route[route.length - 1]
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(offsetX + (eLng - minLng) * scale, offsetY + (maxLat - eLat) * scale, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  // App name
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 52px system-ui, sans-serif'
  ctx.fillText('odu', 48, 80)

  // Week / Day label
  ctx.fillStyle = '#52525b'
  ctx.font = '16px system-ui, sans-serif'
  ctx.fillText(`WEEK ${week}  ·  DAY ${day}  ·  COUCH TO 5K`, 48, 112)

  // Horizontal rule
  ctx.strokeStyle = '#27272a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(48, 136)
  ctx.lineTo(520, 136)
  ctx.stroke()

  // Stats
  const stats = [
    { label: 'DISTANCE', value: run.distance.toFixed(2), unit: 'km' },
    { label: 'DURATION', value: formatTime(run.duration), unit: 'min:sec' },
    { label: 'STEPS', value: run.steps?.toLocaleString() ?? '--', unit: 'est.' },
    { label: 'CALORIES', value: String(run.calories ?? '--'), unit: 'kcal' },
  ]

  stats.forEach((stat, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 48 + col * 240
    const y = 176 + row * 130

    ctx.fillStyle = '#52525b'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText(stat.label, x, y)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 52px system-ui, sans-serif'
    ctx.fillText(stat.value, x, y + 56)

    ctx.fillStyle = '#3f3f46'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillText(stat.unit, x, y + 76)
  })

  // Time split section
  const splitY = 460
  ctx.fillStyle = '#52525b'
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('TIME SPLIT', 48, splitY)

  const barY = splitY + 12
  const barW = 472
  const barH = 6
  const walkPct = run.duration > 0 ? run.walk_time / run.duration : 0.5
  const runPct = 1 - walkPct

  ctx.fillStyle = '#3f3f46'
  ctx.beginPath()
  ctx.roundRect(48, barY, barW * walkPct - 2, barH, 3)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(48 + barW * walkPct + 2, barY, barW * runPct, barH, 3)
  ctx.fill()

  ctx.fillStyle = '#71717a'
  ctx.font = '13px system-ui, sans-serif'
  ctx.fillText(`🚶 ${formatDuration(run.walk_time)}  (${Math.round(walkPct * 100)}%)`, 48, barY + 26)

  ctx.fillStyle = '#ffffff'
  ctx.font = '13px system-ui, sans-serif'
  const runLabel = `🏃 ${formatDuration(run.run_time)}  (${Math.round(runPct * 100)}%)`
  const runLabelW = ctx.measureText(runLabel).width
  ctx.fillText(runLabel, 48 + barW - runLabelW, barY + 26)

  // Bottom tagline
  ctx.fillStyle = '#27272a'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('odu · your couch to 5K companion', 48, H - 24)

  return canvas.toDataURL('image/png')
}

export default function SummaryPage() {
  const params = useParams()
  const week = parseInt(params.week as string)
  const day = parseInt(params.day as string)
  const router = useRouter()
  const supabase = createClient()

  const [run, setRun] = useState<Run | null>(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    async function fetchRun() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', user.id)
        .eq('week', week)
        .eq('day', day)
        .single()

      if (data) setRun(data)
      setLoading(false)
    }
    fetchRun()
  }, [])

  function handleShare() {
    if (!run) return
    setSharing(true)
    try {
      const dataUrl = drawShareCard(run, week, day)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `odu-week${week}-day${day}.png`
      link.click()
    } catch (e) {
      console.error(e)
    }
    setSharing(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Loading summary...</p>
      </main>
    )
  }

  if (!run) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Run not found.</p>
      </main>
    )
  }

  const routeCoords: [number, number][] = run.route?.coordinates
    ? run.route.coordinates.map(([lng, lat]) => [lat, lng])
    : []

  const walkPercent = Math.round((run.walk_time / run.duration) * 100)
  const runPercent = 100 - walkPercent

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Run complete</p>
        <h1 className="text-4xl font-black">Week {week}, Day {day}</h1>
      </div>

      {/* Visible card */}
      <div className="bg-zinc-950 rounded-3xl overflow-hidden mb-6 border border-zinc-800">
        {routeCoords.length > 1 ? (
          <div className="h-56 w-full">
            <SummaryMap route={routeCoords} />
          </div>
        ) : (
          <div className="h-56 w-full bg-zinc-900 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">No route recorded</p>
          </div>
        )}

        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Distance</p>
              <p className="text-3xl font-black">{run.distance.toFixed(2)}</p>
              <p className="text-zinc-500 text-xs">km</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Duration</p>
              <p className="text-3xl font-black">{formatTime(run.duration)}</p>
              <p className="text-zinc-500 text-xs">min:sec</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Steps</p>
              <p className="text-3xl font-black">{run.steps?.toLocaleString() ?? '--'}</p>
              <p className="text-zinc-500 text-xs">estimated</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Calories</p>
              <p className="text-3xl font-black">{run.calories ?? '--'}</p>
              <p className="text-zinc-500 text-xs">kcal estimated</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Time split</p>
            <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5 mb-2">
              <div className="bg-zinc-500 rounded-full" style={{ width: `${walkPercent}%` }} />
              <div className="bg-white rounded-full" style={{ width: `${runPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">
                🚶 Walk — {formatDuration(run.walk_time)} ({walkPercent}%)
              </span>
              <span className="text-white">
                🏃 Run — {formatDuration(run.run_time)} ({runPercent}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <p className="text-white font-black text-lg tracking-tight">odu</p>
            <p className="text-zinc-600 text-xs">couch to 5K</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-all disabled:opacity-50"
        >
          {sharing ? 'Generating...' : '↓ Download card'}
        </button>
      </div>

      <Link href="/dashboard">
        <button className="w-full bg-zinc-900 text-zinc-400 font-medium py-4 rounded-2xl hover:bg-zinc-800 hover:text-white transition-all">
          Back to dashboard
        </button>
      </Link>
    </main>
  )
}