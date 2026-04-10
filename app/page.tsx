'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Header from './components/Header'

const typeColors: Record<string, { bg: string, accent: string, emoji: string }> = {
  theatre:  { bg: '#1C2B3A', accent: '#4A90D9', emoji: '🎭' },
  musical:  { bg: '#2D1B3D', accent: '#C084FC', emoji: '🎵' },
  opera:    { bg: '#2B1A1A', accent: '#F87171', emoji: '🎶' },
  ballet:   { bg: '#1A2440', accent: '#60A5FA', emoji: '🩰' },
  dance:    { bg: '#1A2D2A', accent: '#34D399', emoji: '💃' },
  concert:  { bg: '#2D2A1A', accent: '#FBBF24', emoji: '🎻' },
}

function TypeTile({ type, size = 'sm' }: { type: string, size?: 'sm' | 'lg' }) {
  const colors = typeColors[type] || typeColors.theatre
  const dim = size === 'lg' ? { width: '120px', height: '160px', fontSize: '36px' } : { width: '56px', height: '72px', fontSize: '20px' }
  return (
    <div style={{width: dim.width, height: dim.height, borderRadius: '4px', backgroundColor: colors.bg, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', border: `1px solid ${colors.accent}22`}}>
      <span style={{fontSize: dim.fontSize}}>{colors.emoji}</span>
      <div style={{width: '20px', height: '2px', backgroundColor: colors.accent, borderRadius: '1px'}}></div>
    </div>
  )
}

function StarDisplay({ score }: { score: number }) {
  const stars = []
  const fullStars = Math.floor(score)
  const hasHalf = score - fullStars >= 0.25 && score - fullStars < 0.75
  const roundedUp = score - fullStars >= 0.75
  const total = roundedUp ? fullStars + 1 : fullStars
  for (let i = 1; i <= 5; i++) {
    if (i <= total) stars.push(<span key={i} style={{color: '#1D9E75', fontSize: '16px'}}>★</span>)
    else if (i === fullStars + 1 && hasHalf) stars.push(<span key={i} style={{color: '#1D9E75', fontSize: '16px'}}>½</span>)
    else stars.push(<span key={i} style={{color: '#E2DDD6', fontSize: '16px'}}>★</span>)
  }
  return <span style={{display: 'flex', alignItems: 'center', gap: '1px', lineHeight: 1}}>{stars}</span>
}

function formatDates(start: string, end: string) {
  if (!start && !end) return null
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const now = new Date()
  const endDate = end ? new Date(end) : null
  const startDate = start ? new Date(start) : null
  if (endDate && endDate < now) return null
  if (startDate && startDate > now) return `${fmt(start)} – ${fmt(end)}`
  if (start && end) return `Until ${fmt(end)}`
  return null
}

function getTimingFilter(start: string, end: string, timing: string) {
  if (timing === 'all') return true
  const now = new Date()
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  if (timing === 'now') {
    return startDate && startDate <= now && (!endDate || endDate >= now)
  }
  if (timing === 'soon') {
    return startDate && startDate > now && startDate <= threeMonths
  }
  if (timing === 'later') {
    return startDate && startDate > threeMonths
  }
  return true
}

export default function Home() {
  const [productions, setProductions] = useState<any[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [timingFilter, setTimingFilter] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('production_listing')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%`)
        .order('combined_score', { ascending: false, nullsFirst: false })
        .limit(8)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    async function fetchProductions() {
      let query = supabase
        .from('production_listing')
        .select('*')
        .or(`season_end.is.null,season_end.gte.${today}`)
        .order('combined_score', { ascending: false, nullsFirst: false })

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)
      if (cityFilter !== 'all') query = query.eq('city', cityFilter)

      const { data, error } = await query
      if (!error) {
        const filtered = (data || []).filter(p =>
          getTimingFilter(p.season_start, p.season_end, timingFilter)
        )
        setProductions(filtered)
      }
    }

    async function fetchFilters() {
      const { data } = await supabase
        .from('production_listing')
        .select('city, type')
        .or(`season_end.is.null,season_end.gte.${today}`)

      if (data) {
        const cityOrder = ['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Auckland', 'Wellington', 'Christchurch', 'London']
        const foundCities = Array.from(new Set(data.map((p: any) => p.city).filter(Boolean)))
        const sortedCities = ['all', ...cityOrder.filter(c => foundCities.includes(c))]
        const types = ['all', ...Array.from(new Set(data.map((p: any) => p.type).filter(Boolean))).sort()]
        setAvailableCities(sortedCities)
        setAvailableTypes(types)
      }
    }

    fetchProductions()
    fetchFilters()
  }, [typeFilter, cityFilter, timingFilter])

  const featured = productions[0]
  const rest = productions.slice(1)
  const toggleSearch = () => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]) }

  const timingFilters = [
    { key: 'all', label: 'All shows' },
    { key: 'now', label: 'Playing now' },
    { key: 'soon', label: 'Coming soon' },
    { key: 'later', label: 'Later' },
  ]

  return (
    <main style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <Header onSearch={toggleSearch} />

      <div style={{position: 'sticky', top: '56px', zIndex: 90}}>
        {/* City filter bar */}
        <div style={{backgroundColor: '#0F1A14', padding: '0 24px'}}>
          <div style={{maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto'}}>
            {availableCities.map((c) => (
              <button key={c} onClick={() => setCityFilter(c)} style={{fontSize: '12px', fontWeight: cityFilter === c ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: cityFilter === c ? '2px solid #ffffff' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: cityFilter === c ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
                {c === 'all' ? 'All cities' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter bar */}
        <div style={{backgroundColor: '#1a2e1a', padding: '0 24px'}}>
          <div style={{maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto'}}>
            {availableTypes.map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)} style={{fontSize: '12px', fontWeight: typeFilter === f ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: typeFilter === f ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: typeFilter === f ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
                {f === 'all' ? 'All types' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Timing filter bar */}
        <div style={{backgroundColor: '#162316', borderBottom: '1px solid #1a2e1a', padding: '0 24px'}}>
          <div style={{maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto'}}>
            {timingFilters.map((f) => (
              <button key={f.key} onClick={() => setTimingFilter(f.key)} style={{fontSize: '12px', fontWeight: timingFilter === f.key ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: timingFilter === f.key ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: timingFilter === f.key ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div style={{borderBottom: '1px solid #E2DDD6', padding: '16px 24px', backgroundColor: '#FDFAF4'}}>
          <div style={{maxWidth: '1100px', margin: '0 auto'}}>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shows, companies, venues..."
              style={{width: '100%', border: '1px solid #D4CFC8', borderRadius: '8px', padding: '12px 16px', fontSize: '15px', color: '#111827', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box'}}
            />
            {searchQuery && (
              <div style={{marginTop: '8px'}}>
                {searching && <p style={{fontSize: '14px', color: '#9ca3af', padding: '8px 0'}}>Searching...</p>}
                {!searching && searchResults.length === 0 && <p style={{fontSize: '14px', color: '#9ca3af', padding: '8px 0'}}>No results for "{searchQuery}"</p>}
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px'}}>
                  {searchResults.map((p) => (
                    <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E8E3DC', textDecoration: 'none', color: 'inherit'}}>
                      <TypeTile type={p.type} />
                      <div style={{flex: 1}}>
                        <div style={{fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#111827'}}>{p.title}</div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>{p.venue || p.company} · {p.city}{p.season_end && new Date(p.season_end) >= new Date() && p.season_start && new Date(p.season_start) <= new Date() ? ' · Until ' + new Date(p.season_end).toLocaleDateString('en-AU', {day:'numeric',month:'short'}) : p.season_start && new Date(p.season_start) > new Date() ? ' · ' + new Date(p.season_start).toLocaleDateString('en-AU', {day:'numeric',month:'short'}) + ' – ' + (p.season_end ? new Date(p.season_end).toLocaleDateString('en-AU', {day:'numeric',month:'short'}) : '') : ''}</div>
                      </div>
                      {p.combined_score && <StarDisplay score={p.combined_score} />}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{maxWidth: '1100px', margin: '0 auto', padding: '40px 24px'}}>
        {featured && (() => {
          const dates = formatDates(featured.season_start, featured.season_end)
          return (
            <a href={"/show/" + featured.production_id} style={{display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '40px'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '32px', padding: '36px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #E2DDD6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', alignItems: 'center'}}>
                <TypeTile type={featured.type} size="lg" />
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                    {featured.combined_score && <span style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75'}}>★ Top rated</span>}
                    {featured.combined_score && <span style={{fontSize: '10px', color: '#D1CBC0'}}>·</span>}
                    <span style={{fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af'}}>{featured.type}</span>
                    <span style={{fontSize: '10px', color: '#D1CBC0'}}>·</span>
                    <span style={{fontSize: '10px', color: '#9ca3af'}}>{featured.city}</span>
                  </div>
                  <h2 style={{fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: '600', color: '#111827', lineHeight: '1.15', margin: '0 0 12px 0', letterSpacing: '-0.5px'}}>{featured.title}</h2>
                  <p style={{fontSize: '16px', color: '#4b5563', margin: '0 0 4px 0', fontWeight: '500'}}>{featured.company}</p>
                  <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>{featured.venue}</p>
                  {dates && <p style={{fontSize: '13px', color: '#1D9E75', margin: '8px 0 0 0', fontWeight: '500'}}>{dates}</p>}
                </div>
                {featured.combined_score ? (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #E2DDD6', paddingLeft: '32px', minWidth: '120px', gap: '8px'}}>
                    <StarDisplay score={featured.combined_score} />
                    <div style={{fontSize: '13px', fontWeight: '600', color: '#1D9E75'}}>{Number(featured.combined_score).toFixed(1)} / 5</div>
                    <div style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center'}}>Stage Gauge score</div>
                    <div style={{fontSize: '11px', color: '#9ca3af'}}>{(featured.critic_count || 0) + (featured.audience_count || 0)} reviews</div>
                  </div>
                ) : (
                  <div style={{borderLeft: '1px solid #E2DDD6', paddingLeft: '32px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{fontSize: '11px', color: '#D1CBC0', textAlign: 'center'}}>No reviews<br/>yet</span>
                  </div>
                )}
              </div>
            </a>
          )
        })()}

        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
          <span style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', whiteSpace: 'nowrap'}}>Playing now</span>
          <div style={{flex: 1, height: '1px', backgroundColor: '#E2DDD6'}}></div>
        </div>

        <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}>
          {rest.length === 0 && (
            <p style={{padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px'}}>No shows match this filter.</p>
          )}
          {rest.map((p, i) => {
            const dates = formatDates(p.season_start, p.season_end)
            return (
              <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', textDecoration: 'none', color: 'inherit', borderBottom: i < rest.length - 1 ? '1px solid #F5F0E8' : 'none'}}>
                <span style={{fontSize: '12px', fontWeight: '600', color: '#D1CBC0', width: '20px', textAlign: 'right', flexShrink: 0}}>{i + 2}</span>
                <TypeTile type={p.type} />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap'}}>
                    <span style={{fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#111827'}}>{p.title}</span>
                    <span style={{fontSize: '12px', color: '#9ca3af'}}>{p.venue || p.company}</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap'}}>
                    <span style={{fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize'}}>{p.type}</span>
                    <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                    <span style={{fontSize: '11px', color: '#9ca3af'}}>{p.city}</span>
                    {dates && <>
                      <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                      <span style={{fontSize: '11px', color: '#9ca3af'}}>{dates}</span>
                    </>}
                  </div>
                </div>
                {p.combined_score && <StarDisplay score={p.combined_score} />}
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}
