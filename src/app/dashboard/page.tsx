import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const statusIcon = {
  locked: '🔒',
  available: '▶️',
  in_progress: '⏸️',
  completed: '✅',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: runs } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', user.id)
    .order('week', { ascending: true })
    .order('day', { ascending: true })

  const grouped = Array.from({ length: 9 }, (_, i) => ({
    week: i + 1,
    days: runs?.filter((r) => r.week === i + 1) ?? [],
  }))

  const currentRun = runs?.find((r) => r.status === 'available' || r.status === 'in_progress')

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black tracking-tight">odu</h1>
        <form action="/auth/signout" method="post">
          <button className="text-zinc-500 text-sm hover:text-white transition-colors">
            Sign out
          </button>
        </form>
      </div>

      {/* Current run banner */}
      {currentRun && (
        <Link href={`/run/${currentRun.week}/${currentRun.day}`}>
          <div className="bg-white text-black rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Up next</p>
              <p className="text-xl font-black mt-1">
                Week {currentRun.week}, Day {currentRun.day}
              </p>
            </div>
            <div className="bg-black text-white rounded-xl px-4 py-2 text-sm font-semibold">
              Start →
            </div>
          </div>
        </Link>
      )}

      {/* Weekly breakdown */}
      <div className="space-y-6">
        {grouped.map(({ week, days }) => {
          const allCompleted = days.every((d) => d.status === 'completed')
          const anyActive = days.some((d) => d.status === 'available' || d.status === 'in_progress')

          return (
            <div key={week}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Week {week}
                </h2>
                {allCompleted && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                    done
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {days.map((run) => {
                  const isClickable = run.status === 'available' || run.status === 'in_progress'
                  const card = (
                    <div
                      className={`rounded-xl p-4 flex flex-col gap-2 transition-all ${
                        run.status === 'completed'
                          ? 'bg-zinc-800 opacity-60'
                          : run.status === 'available' || run.status === 'in_progress'
                          ? 'bg-zinc-900 ring-1 ring-white/20'
                          : 'bg-zinc-900 opacity-30'
                      }`}
                    >
                      <span className="text-lg">{statusIcon[run.status as keyof typeof statusIcon]}</span>
                      <p className="text-sm font-semibold">Day {run.day}</p>
                      {run.status === 'completed' && run.distance && (
                        <p className="text-xs text-zinc-500">{run.distance.toFixed(2)} km</p>
                      )}
                    </div>
                  )

                  return isClickable ? (
                    <Link key={run.day} href={`/run/${run.week}/${run.day}`}>
                      {card}
                    </Link>
                  ) : (
                    <div key={run.day}>{card}</div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}