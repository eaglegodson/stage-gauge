'use client'

import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
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
  { title: "Discover what's on near you", desc: 'Browse professional productions — theatre, opera, ballet, musicals and dance — in your city and beyond.', href: '/browse', accent: '#4A90D9' },
  { title: 'Read critic and audience reviews', desc: 'Aggregated reviews from leading outlets alongside real audience voices.', href: '/reviews', accent: '#C084FC' },
  { title: 'Community theatre & auditions', desc: 'Find out what community theatre companies are staging near you — and which shows are currently auditioning.', href: '/community', accent: '#a78bfa' },
  { title: 'Rate and review shows you've seen', desc: 'Write your own reviews and help build the most comprehensive guide to live performance in Australia and New Zealand.', href: '/seen', accent: '#34D399' },
  { title: 'Save shows to your watchlist', desc: 'Keep track of shows you want to see and never miss an opening.', href: '/watchlist', accent: '#FBBF24' },
]

export default function Home() {
  const [shows, setShows] = useState<any[]>([])
  const [currentShow, setCurrentShow] = useState(0)
  const [visible, setVisible] = useState(true)
  const [userCity, setUserCity] = useState('')
  const [stats, setStats] = useState({ productions: 0, reviews: 0, cities: 0 })
  const [user, setUser] = useState<any>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    async function fetchStats() {
      const [prodResult, reviewResult, cityResult] = await Promise.all([
        supabase.from('productions').select('id', { count: 'exact', head: true }),
        supabase.from('critic_reviews').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('productions').select('city', { count: 'exact' }),
      ])
      const cities = new Set((cityResult.data || []).map((p: any) => p.city).filter(Boolean))
      setStats({
        productions: prodResult.count || 0,
        reviews: reviewResult.count || 0,
        cities: cities.size,
      })
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const timezoneToCity: Record<string, string> = {
      'Australia/Melbourne': 'Melbourne',
      'Australia/Sydney': 'Sydney',
      'Australia/Brisbane': 'Brisbane',
      'Australia/Perth': 'Perth',
      'Australia/Adelaide': 'Adelaide',
      'Australia/Hobart': 'Hobart',
      'Australia/Darwin': 'Melbourne',
      'Australia/ACT': 'Canberra',
      'Australia/Canberra': 'Canberra',
      'Pacific/Auckland': 'Auckland',
      'Pacific/Wellington': 'Wellington',
      'Europe/London': 'London',
    }

    async function detectAndFetch() {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const city = timezoneToCity[timezone] || 'Melbourne'
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
    }
    detectAndFetch()
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

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('production_listing')
        .select('*')
        .ilike('title', '%' + searchQuery + '%')
        .limit(6)
      setSearchResults(data || [])
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  function handleSearchToggle() {
    setSearchOpen(prev => !prev)
    setSearchQuery('')
    setSearchResults([])
  }

  const show = shows[currentShow]
  const cfg = show ? (typeConfig[show.type] || typeConfig.theatre) : null

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header onSearch={handleSearchToggle} />

      {searchOpen && (
        <div style={{ backgroundColor: '#0f0f1a', borderBottom: '1px solid #1e1e2e', padding: '12px 24px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shows, companies, venues..."
              style={{ width: '100%', backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
            />
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', marginTop: '4px', zIndex: 200, overflow: 'hidden' }}>
                {searchResults.map((result: any) => (
                  <a key={result.production_id} href={'/show/' + result.production_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', textDecoration: 'none', borderBottom: '1px solid #2a2a3e' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a3e'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontSize: '16px' }}>{(typeConfig[result.type] || typeConfig.theatre).emoji}</span>
                    <div>
                      <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500' }}>{result.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{result.company} · {result.city}</div>
                    </div>
                    {result.combined_score && <span style={{ marginLeft: 'auto', color: '#1D9E75', fontSize: '12px' }}>{'★'.repeat(Math.round(result.combined_score))}</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {shows.map((s: any, i: number) => {
          const c = typeConfig[s.type] || typeConfig.theatre
          return (
            <div key={i} style={{
              position: 'absolute', inset: 0,
              background: c.gradient,
              opacity: i === currentShow ? (visible ? 0.35 : 0) : 0,
              transition: 'opacity 0.8s ease-in-out',
            }} />
          )
        })}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #14141f 0%, rgba(20,20,31,0.6) 40%, rgba(20,20,31,0.85) 80%, #14141f 100%)' }} />

        <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '52px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.15', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
            You care about what you see.<br />So do we.
          </h1>
          <p style={{ fontSize: '18px', color: '#9ca3af', margin: '0 0 40px 0', lineHeight: '1.6', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            StageGauge aggregates critic and audience reviews for theatre, opera, ballet, musicals and dance across Australia, New Zealand and London.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <a href="/browse" style={{ fontSize: '15px', fontWeight: '600', color: 'white', padding: '12px 28px', borderRadius: '8px', backgroundColor: '#1D9E75', textDecoration: 'none' }}>Browse shows</a>
            {!user && (
              <a href="/auth" style={{ fontSize: '15px', fontWeight: '500', color: '#9ca3af', padding: '12px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.05)' }}>Sign in</a>
            )}
          </div>

          {show && cfg && (
            <a href={'/show/' + show.production_id} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 16px', opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}>
              <span style={{ fontSize: '20px' }}>{cfg.emoji}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Now playing in {userCity}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#f1f5f9', fontWeight: '600' }}>{show.title}</div>
              </div>
              {show.combined_score && <span style={{ color: '#1D9E75', fontSize: '12px', marginLeft: '8px' }}>{'★'.repeat(Math.round(show.combined_score))}</span>}
            </a>
          )}
          {shows.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
              {shows.map((_: any, i: number) => (
                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === currentShow ? '#1D9E75' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s', cursor: 'pointer' }} onClick={() => setCurrentShow(i)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {tiles.map((tile, i) => (
            <a key={i} href={tile.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <div
                style={{ borderRadius: '10px', border: '1px solid #2a2a3e', background: '#1e1e2e', transition: 'transform 0.15s, border-color 0.15s', cursor: 'pointer', height: '100%', padding: '20px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = tile.accent + '66' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3e' }}
              >
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 6px 0', lineHeight: '1.3' }}>{tile.title}</h3>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>{tile.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e1e2e', padding: '32px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { number: stats.productions > 0 ? stats.productions + '+' : '—', label: 'Productions' },
            { number: stats.reviews > 0 ? stats.reviews + '+' : '—', label: 'Reviews' },
            { number: '10+', label: 'Cities' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '600', color: '#1D9E75' }}>{stat.number}</div>
              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  )
}