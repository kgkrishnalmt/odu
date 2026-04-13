'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleSignup() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a confirmation link.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tight">odu</h1>
          <p className="text-zinc-400 mt-2 text-sm">your couch to 5K companion</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-zinc-900 p-1 mb-6">
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setMessage('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleSignup())}
            className="w-full bg-zinc-900 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20"
          />

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
          {message && <p className="text-green-400 text-xs px-1">{message}</p>}

          <button
            onClick={tab === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>
      </div>
    </main>
  )
}