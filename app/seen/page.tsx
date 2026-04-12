'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:  { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:  { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:    { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:   { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:    { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:  { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
}

export default function SeenPage() {
  const [productions, setProductions] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) { setLoading(false); return }
      supabase
        .from('seen')
        .select('production_id, created_at, productions(id, city, venue, season_start, season_end, shows(title, type, company))')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setProductions(data || [])
          setLoading(false)
        })
    })
  }, [])

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 8px 0' }}>Shows I have seen</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>{productions.length} production{productions.length !== 1 ? 's' : ''}</p>
        </div>

        {!user && !loading && (
          <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: '#9ca3af', margin: '0 0 16px 0' }}>Sign in to track the shows you have seen.</p>
            <a href="/auth" style={{ fontSize: '14px', fontWeight: '600', color: 'white', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Sign in</a>
          </div>
        )}

        {user && loading && (
          <p style={{ color: '#4b5563', fontSize: '14px' }}>Loading...</p>
        )}

        {user && !loading && productions.length === 0 && (
          <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: '#9ca3af', margin: '0 0 16px 0' }}>You have not marked any shows as seen yet.</p>
            <a href="/browse" style={{ fontSize: '14px', fontWeight: '600', color: 'white', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Browse shows</a>
          </div>
        )}

        {user && !loading && productions.length > 0 && (
          <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '4px', overflow: 'hidden' }}>
            {productions.map((item: any, i: number) => {
              const p = item.productions
              const show = p?.shows
              const cfg = typeConfig[show?.type] || typeConfig.theatre
              return (
                <a key={item.production_id} href={'/show/' + item.production_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', textDecoration: 'none', color: 'inherit', borderBottom: i < productions.length - 1 ? '1px solid #14141f' : 'none' }}>
                  <div style={{ width: '48px', height: '64px', borderRadius: '4px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {cfg.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>{show?.title}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{show?.company}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{show?.type}</span>
                      <span style={{ fontSize: '11px', color: '#4b5563' }}>·</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{p?.city}</span>
                      {p?.season_start && (
                        <>
                          <span style={{ fontSize: '11px', color: '#4b5563' }}>·</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fmt(p.season_start)}{p.season_end ? ` – ${fmt(p.season_end)}` : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#4b5563', flexShrink: 0 }}>
                    Seen {fmt(item.created_at)}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
