'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import posthog from 'posthog-js'

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:  { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:  { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:    { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:   { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:    { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:  { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
}

const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

export default function YourShowsPage() {
  const [tab, setTab] = useState<'watchlist' | 'seen'>('watchlist')
  const [user, setUser] = useState<any>(null)
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [seen, setSeen] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) { setLoading(false); return }
      Promise.all([
        supabase.from('watchlist').select('*, productions(id, show_id, venue, city, shows(title, type, company))').eq('user_id', u.id).order('created_at', { ascending: false }),
        supabase.from('seen').select('production_id, created_at, productions(id, city, venue, season_start, season_end, shows(title, type, company))').eq('user_id', u.id).order('created_at', { ascending: false }),
      ]).then(([w, s]) => {
        setWatchlist(w.data || [])
        setSeen(s.data || [])
        setLoading(false)
      })
    })
  }, [])

  async function removeFromWatchlist(id: string) {
    const item = watchlist.find(w => w.id === id)
    const show = item?.productions?.shows
    await supabase.from('watchlist').delete().eq('id', id)
    setWatchlist(watchlist.filter(w => w.id !== id))
    posthog.capture('show_removed_from_watchlist', { production_id: item?.productions?.id, show_title: show?.title, show_type: show?.type, city: item?.productions?.city })
  }

  const tabStyle = (t: string) => ({
    fontSize: '13px',
    fontWeight: tab === t ? '600' : '400',
    padding: '12px 20px',
    border: 'none',
    borderBottom: tab === t ? '2px solid #1D9E75' : '2px solid transparent',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: tab === t ? '#f1f5f9' : '#6b7280',
    whiteSpace: 'nowrap' as const,
  })

  const SignInPrompt = ({ message }: { message: string }) => (
    <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
      <p style={{ fontSize: '15px', color: '#9ca3af', margin: '0 0 16px 0' }}>{message}</p>
      <a href="/auth" style={{ fontSize: '14px', fontWeight: '600', color: 'white', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Sign in</a>
    </div>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
      <p style={{ fontSize: '15px', color: '#9ca3af', margin: '0 0 16px 0' }}>{message}</p>
      <a href="/browse" style={{ fontSize: '14px', fontWeight: '600', color: 'white', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Browse shows</a>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 24px 0' }}>Your shows</h1>

        <div style={{ display: 'flex', borderBottom: '1px solid #1e1e2e', marginBottom: '24px' }}>
          <button style={tabStyle('watchlist')} onClick={() => setTab('watchlist')}>
            Watchlist {watchlist.length > 0 && <span style={{ marginLeft: '6px', background: '#1D9E75', color: 'white', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>{watchlist.length}</span>}
          </button>
          <button style={tabStyle('seen')} onClick={() => setTab('seen')}>
            Seen {seen.length > 0 && <span style={{ marginLeft: '6px', background: '#4b5563', color: 'white', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>{seen.length}</span>}
          </button>
        </div>

        {loading && <p style={{ color: '#4b5563', fontSize: '14px' }}>Loading...</p>}

        {!loading && tab === 'watchlist' && (
          <div>
            {!user && <SignInPrompt message="Sign in to save shows to your watchlist." />}
            {user && watchlist.length === 0 && <EmptyState message="Your watchlist is empty — add shows from their page to keep track of what you want to see." />}
            {user && watchlist.length > 0 && (
              <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', overflow: 'hidden' }}>
                {watchlist.map((item, i) => {
                  const prod = item.productions
                  const show = prod?.shows
                  const cfg = typeConfig[show?.type] || typeConfig.theatre
                  if (!show) return null
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: i < watchlist.length - 1 ? '1px solid #14141f' : 'none' }}>
                      <a href={'/show/' + prod.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, textDecoration: 'none', minWidth: 0 }}>
                        <div style={{ width: '48px', height: '56px', borderRadius: '6px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{cfg.emoji}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show.title}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{show.company} · {prod.city}</div>
                          <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px', textTransform: 'capitalize' }}>{show.type}</div>
                        </div>
                      </a>
                      <button onClick={() => removeFromWatchlist(item.id)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: '1px solid #2a2a3e', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Remove</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'seen' && (
          <div>
            {!user && <SignInPrompt message="Sign in to track the shows you have seen." />}
            {user && seen.length === 0 && <EmptyState message="You have not marked any shows as seen yet." />}
            {user && seen.length > 0 && (
              <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', overflow: 'hidden' }}>
                {seen.map((item, i) => {
                  const p = item.productions
                  const show = p?.shows
                  const cfg = typeConfig[show?.type] || typeConfig.theatre
                  return (
                    <a key={item.production_id} href={'/show/' + item.production_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', textDecoration: 'none', borderBottom: i < seen.length - 1 ? '1px solid #14141f' : 'none' }}>
                      <div style={{ width: '48px', height: '56px', borderRadius: '6px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{cfg.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show?.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{show?.company} · {p?.city}</div>
                        <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>{show?.type} {p?.season_start ? '· ' + fmt(p.season_start) : ''}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#4b5563', flexShrink: 0 }}>Seen {fmt(item.created_at)}</div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
