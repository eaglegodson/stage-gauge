'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'

const CITIES = ['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Canberra', 'Auckland', 'Wellington', 'London']

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:   { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:   { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:     { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:    { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:     { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:   { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
  community: { gradient: 'linear-gradient(160deg, #1a1a2e 0%, #2d2d4a 100%)', accent: '#a78bfa', emoji: '🏠' },
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AuditionCard({ a }: { a: any }) {
  return (
    <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 3px 0', lineHeight: '1.3' }}>{a.show_title}</h3>
          {a.company && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{a.company}</p>}
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', background: '#1a1530', border: '1px solid #a78bfa44', borderRadius: '4px', padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Audition
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {a.city && (
          <span style={{ fontSize: '11px', color: '#6b7280', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '4px', padding: '2px 7px' }}>
            📍 {a.city}
          </span>
        )}
        {a.venue && (
          <span style={{ fontSize: '11px', color: '#6b7280', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '4px', padding: '2px 7px' }}>
            🏛 {a.venue}
          </span>
        )}
        {a.audition_date && (
          <span style={{ fontSize: '11px', color: '#1D9E75', background: '#0f2d1a', border: '1px solid #1D9E7544', borderRadius: '4px', padding: '2px 7px' }}>
            🗓 Auditions: {formatDate(a.audition_date)}{a.audition_date_end && a.audition_date_end !== a.audition_date ? ' – ' + formatDate(a.audition_date_end) : ''}
          </span>
        )}
        {a.show_date_start && (
          <span style={{ fontSize: '11px', color: '#6b7280', background: '#14141f', border: '1px solid #2a2a3e', borderRadius: '4px', padding: '2px 7px' }}>
            🎭 Show: {formatDate(a.show_date_start)}{a.show_date_end ? ' – ' + formatDate(a.show_date_end) : ''}
          </span>
        )}
      </div>

      {a.roles && (
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
          <span style={{ color: '#6b7280' }}>Roles: </span>{a.roles}
        </p>
      )}

      {a.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{a.description}</p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {a.contact_url && (
          <a href={a.contact_url} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, background: '#a78bfa', color: '#0f0f1a', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' as const }}>
            Audition info →
          </a>
        )}
        {a.contact_email && (
          <a href={'mailto:' + a.contact_email}
            style={{ flex: 1, background: 'none', color: '#a78bfa', border: '1px solid #a78bfa44', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' as const }}>
            Email →
          </a>
        )}
      </div>
    </div>
  )
}

function ProductionCard({ p }: { p: any }) {
  const cfg = typeConfig[p.type] || typeConfig.community
  const score = p.combined_score
  const reviewCount = (p.critic_count || 0) + (p.audience_count || 0)
  const stars = score ? Array.from({ length: 5 }, (_, i) => {
    const full = Math.floor(score)
    const hasHalf = score - Math.floor(score) >= 0.25 && score - Math.floor(score) < 0.75
    if (i < full) return '★'
    if (i === full && hasHalf) return '½'
    return '☆'
  }) : null

  return (
    <a href={'/show/' + p.production_id} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#1e1e2e', border: '1px solid #2a2a3e', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a78bfa66' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3e' }}
      >
        <div style={{ background: cfg.gradient, width: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '22px' }}>{cfg.emoji}</span>
        </div>
        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <p style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 3px 0' }}>
              {p.type || 'community'}
            </p>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 2px 0', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h3>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.company}</p>
            <p style={{ fontSize: '11px', color: '#4b5563', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.city}</p>
          </div>
          {stars ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ color: '#1D9E75', fontSize: '11px' }}>{stars.join('')}</span>
              <span style={{ fontSize: '10px', color: '#4b5563' }}>{reviewCount}r</span>
            </div>
          ) : (
            <span style={{ fontSize: '10px', color: '#374151', marginTop: '6px', display: 'block' }}>No reviews yet</span>
          )}
        </div>
      </div>
    </a>
  )
}

export default function CommunityPage() {
  const [city, setCity] = useState<string>('all')
  const [geoLoaded, setGeoLoaded] = useState(false)
  const [auditions, setAuditions] = useState<any[]>([])
  const [productions, setProductions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timezoneToCity: Record<string, string> = {
      'Australia/Melbourne': 'Melbourne',
      'Australia/Sydney': 'Sydney',
      'Australia/Brisbane': 'Brisbane',
      'Australia/Perth': 'Perth',
      'Australia/Adelaide': 'Adelaide',
      'Australia/Hobart': 'Hobart',
      'Australia/ACT': 'Canberra',
      'Australia/Canberra': 'Canberra',
      'Pacific/Auckland': 'Auckland',
      'Pacific/Wellington': 'Wellington',
      'Europe/London': 'London',
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const detected = timezoneToCity[tz]
    if (detected) setCity(detected)
    setGeoLoaded(true)
  }, [])

  useEffect(() => {
    if (!geoLoaded) return
    async function fetchData() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      let audQ = supabase
        .from('auditions')
        .select('*')
        .eq('status', 'active')
        .or('audition_date.is.null,audition_date.gte.' + today)
        .order('audition_date', { ascending: true, nullsFirst: false })

      if (city !== 'all') audQ = audQ.eq('city', city)

      let prodQ = supabase
        .from('production_listing')
        .select('*')
        .eq('type', 'community')
        .or('season_end.is.null,season_end.gte.' + today)
        .order('combined_score', { ascending: false, nullsFirst: false })

      if (city !== 'all') prodQ = prodQ.eq('city', city)

      const [{ data: aud }, { data: prod }] = await Promise.all([audQ, prodQ])
      setAuditions(aud || [])
      setProductions(prod || [])
      setLoading(false)
    }
    fetchData()
  }, [city, geoLoaded])

  const cityBarStyle = (c: string) => ({
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: city === c ? '600' : '400',
    color: city === c ? '#f1f5f9' : '#6b7280',
    background: city === c ? '#1D9E75' : 'transparent',
    border: '1px solid ' + (city === c ? '#1D9E75' : '#2a2a3e'),
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  })

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ backgroundColor: '#0f0f1a', borderBottom: '1px solid #1e1e2e', padding: '24px 24px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '26px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px 0' }}>Community Theatre</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>Auditions and productions from community theatre companies across Australia and New Zealand</p>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '1px' }}>
            <button style={cityBarStyle('all')} onClick={() => setCity('all')}>All cities</button>
            {CITIES.map(c => (
              <button key={c} style={cityBarStyle(c)} onClick={() => setCity(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px', flex: 1, width: '100%', boxSizing: 'border-box' }}>

        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a78bfa' }}>Auditions</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }} />
            {auditions.length > 0 && (
              <span style={{ fontSize: '11px', color: '#4b5563' }}>{auditions.length} listing{auditions.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loading && <p style={{ color: '#4b5563', fontSize: '14px' }}>Loading...</p>}

          {!loading && auditions.length === 0 && (
            <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 8px 0' }}>No auditions listed{city !== 'all' ? ' in ' + city : ''} right now.</p>
              <p style={{ color: '#374151', fontSize: '13px', margin: 0 }}>
                Running auditions?{' '}
                <a href="mailto:hello@stage-gauge.com?subject=Audition listing" style={{ color: '#a78bfa', textDecoration: 'none' }}>Email us to list them free →</a>
              </p>
            </div>
          )}

          {!loading && auditions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '12px' }}>
              {auditions.map(a => <AuditionCard key={a.id} a={a} />)}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563' }}>Productions</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }} />
            {productions.length > 0 && (
              <span style={{ fontSize: '11px', color: '#4b5563' }}>{productions.length} show{productions.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {!loading && productions.length === 0 && (
            <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
              <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 8px 0' }}>No community productions listed{city !== 'all' ? ' in ' + city : ''} yet.</p>
              <p style={{ color: '#374151', fontSize: '13px', margin: 0 }}>
                Got a show coming up?{' '}
                <a href="mailto:hello@stage-gauge.com?subject=Community production listing" style={{ color: '#a78bfa', textDecoration: 'none' }}>Email us to add it →</a>
              </p>
            </div>
          )}

          {!loading && productions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              {productions.map(p => <ProductionCard key={p.production_id} p={p} />)}
            </div>
          )}
        </div>

      </div>

      <Footer />
    </main>
  )
}