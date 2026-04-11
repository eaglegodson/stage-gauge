'use client'

import { useState, useEffect } from 'react'
import Header from './components/Header'
import { supabase } from '../lib/supabase'

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:  { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:  { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:    { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:   { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:    { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:  { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
}

const tiles = [
  { icon: '🗺️', title: "Discover what's on near you", desc: 'Browse current and upcoming productions in your city and beyond.', href: '/browse', gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9' },
  { icon: '📰', title: 'Read critic and audience reviews', desc: 'Aggregated reviews from leading outlets alongside real audience voices.', href: '/browse', gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC' },
  { icon: '⭐', title: "Rate and review shows you've seen", desc: 'Share your take and contribute to the Stage Gauge score.', href: '/auth', gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399' },
  { icon: '🔖', title: 'Save shows to your watchlist', desc: 'Keep track of shows you want to see and never miss an opening.', href: '/auth', gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24' },
]

export default function Home() {
  const [shows, setShows] = useState<any[]>([])
  const [currentShow, setCurrentShow] = useState(0)
  const [visible, setVisible] = useState(true)
  const [userCity, setUserCity] = useState('')

  useEffect(() => {
    const cityMap: Record<string, string> = {
      'melbourne': 'Melbourne', 'sydney': 'Sydney', 'brisbane': 'Brisbane',
      'perth': 'Perth', 'adelaide': 'Adelaide', 'hobart': 'Hobart',
      'geelong': 'Melbourne', 'gold coast': 'Brisbane', 'newcastle': 'Sydney',
      'auckland': 'Auckland', 'wellington': 'Wellington', 'christchurch': 'Christchurch',
      'london': 'London',
    }
    const covered = ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Hobart','Auckland','Wellington','Christchurch','London']
    fetch('https://ipapi.co/json/').then(r => r.json()).then(async data => {
      const mapped = cityMap[(data.city || '').toLowerCase()]
      const city = (mapped && covered.includes(mapped)) ? mapped : 'Melbourne'
      setUserCity(city)
      const today = new Date().toISOString().split('T')[0]
      const { data: productions } = await supabase
        .from('production_listing')
        .select('*')
        .eq('city', city)
        .or('season_end.is.null,season_end.gte.' + today)
        .not('combined_score', 'is', null)
        .order('combined_score', { ascending: false })
        .limit(8)
      if (productions && productions.length > 0) setShows(productions)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (shows.length < 2) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentShow(prev => (prev + 1) % shows.length)
        setVisible(true)
      }, 600)
    }, 3500)
    return () => clearInterval(interval)
  }, [shows])

  const show = shows[currentShow]
  const cfg = show ? (typeConfig[show.type] || typeConfig.theatre) : null

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f' }}>
      <Header />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: '#1D9E75', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>
          Now in Beta
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '52px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.15', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
          The home for live<br />performance reviews
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', margin: '0 0 40px 0', lineHeight: '1.6', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          Stage Gauge aggregates critic and audience reviews for theatre, opera, ballet, musicals and dance across Australia, New Zealand and London.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <a href="/browse" style={{ fontSize: '15px', fontWeight: '600', color: 'white', padding: '12px 28px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Browse shows</a>
          <a href="/auth" style={{ fontSize: '15px', fontWeight: '500', color: '#9ca3af', padding: '12px 28px', borderRadius: '8px', border: '1px solid #2a2a3e', textDecoration: 'none', backgroundColor: '#1e1e2e' }}>Create account</a>
        </div>

        {show && cfg && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '11px', color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Now playing in {userCity}
            </div>
            <a href={'/show/' + show.production_id} style={{ textDecoration: 'none', display: 'block', maxWidth: '320px', margin: '0 auto' }}>
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #2a2a3e', opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}>
                <div style={{ background: cfg.gradient, height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '48px' }}>{cfg.emoji}</span>
                  <div style={{ width: '28px', height: '2px', borderRadius: '1px', background: cfg.accent }}></div>
                </div>
                <div style={{ background: '#1e1e2e', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#f1f5f9', marginBottom: '3px' }}>{show.title}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{show.type} · {show.venue || show.company}</div>
                  </div>
                  {show.combined_score && (
                    <span style={{ color: '#1D9E75', fontSize: '14px' }}>{'★'.repeat(Math.round(show.combined_score))}</span>
                  )}
                </div>
              </div>
            </a>
            {shows.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '14px' }}>
                {shows.map((_: any, i: number) => (
                  <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === currentShow ? '#1D9E75' : '#2a2a3e', transition: 'background 0.3s', cursor: 'pointer' }} onClick={() => setCurrentShow(i)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {tiles.map((tile, i) => (
            <a key={i} href={tile.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <div
                style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #2a2a3e', transition: 'transform 0.15s, border-color 0.15s', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = tile.accent + '66' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3e' }}
              >
                <div style={{ background: tile.gradient, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>{tile.icon}</div>
                <div style={{ background: '#1e1e2e', padding: '16px', flex: 1 }}>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 6px 0', lineHeight: '1.3' }}>{tile.title}</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{tile.desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e1e2e', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { number: '380+', label: 'Productions' },
            { number: '10+', label: 'Cities' },
            { number: '150+', label: 'Reviews' },
            { number: '16', label: 'Outlets' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#1D9E75' }}>{stat.number}</div>
              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
