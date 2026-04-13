import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRun } from '@/lib/program'
import Link from 'next/link'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

export default async function PreRunPage({
  params,
}: {
  params: Promise<{ week: string; day: string }>
}) {
  const { week, day } = await params
  const weekNum = parseInt(week)
  const dayNum = parseInt(day)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Check run is available or in_progress
  const { data: run } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', user.id)
    .eq('week', weekNum)
    .eq('day', dayNum)
    .single()

  if (!run || run.status === 'locked') redirect('/dashboard')

  const runDay = getRun(weekNum, dayNum)
  if (!runDay) redirect('/dashboard')

  const totalWalk = runDay.intervals
    .filter((i) => i.type === 'walk')
    .reduce((sum, i) => sum + i.duration, 0)

  const totalRun = runDay.intervals
    .filter((i) => i.type === 'run')
    .reduce((sum, i) => sum + i.duration, 0)

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors">
          ← Back
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Week {weekNum}</p>
        <h1 className="text-4xl font-black">Day {dayNum}</h1>
        <p className="text-zinc-400 mt-2 text-sm">
          {formatTime(runDay.totalDuration)} total · {formatTime(totalRun)} running · {formatTime(totalWalk)} walking
        </p>
      </div>

      {/* Interval breakdown */}
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Interval breakdown</h2>
        <div className="space-y-2">
          {runDay.intervals.map((interval, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                interval.type === 'run'
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{interval.type === 'run' ? '🏃' : '🚶'}</span>
                <span className="font-medium capitalize">{interval.type}</span>
              </div>
              <span className="text-sm font-semibold">{formatTime(interval.duration)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual timeline */}
      <div className="mb-10">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Timeline</h2>
        <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
          {runDay.intervals.map((interval, i) => (
            <div
              key={i}
              className={interval.type === 'run' ? 'bg-white' : 'bg-zinc-700'}
              style={{ flex: interval.duration }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-600">
          <span>0:00</span>
          <span>{formatTime(runDay.totalDuration)}</span>
        </div>
      </div>

      {/* Start button */}
      <Link href={`/run/${weekNum}/${dayNum}/active`}>
        <button className="w-full bg-white text-black font-black text-lg py-4 rounded-2xl hover:bg-zinc-100 transition-all">
          Start Run →
        </button>
      </Link>
    </main>
  )
}