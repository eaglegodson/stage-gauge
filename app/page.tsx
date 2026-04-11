'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Header from './components/Header'

const typeConfig: Record<string, { gradient: string, accent: string, emoji: string }> = {
  theatre:  { gradient: 'linear-gradient(160deg, #0f2744 0%, #1a6bb5 100%)', accent: '#4A90D9', emoji: '🎭' },
  musical:  { gradient: 'linear-gradient(160deg, #2d0f4a 0%, #8b2fc9 100%)', accent: '#C084FC', emoji: '🎵' },
  opera:    { gradient: 'linear-gradient(160deg, #4a0f0f 0%, #c93030 100%)', accent: '#F87171', emoji: '🎼' },
  ballet:   { gradient: 'linear-gradient(160deg, #0f1a44 0%, #2050b5 100%)', accent: '#60A5FA', emoji: '🩰' },
  dance:    { gradient: 'linear-gradient(160deg, #0f2d1a 0%, #0f8f5a 100%)', accent: '#34D399', emoji: '💃' },
  concert:  { gradient: 'linear-gradient(160deg, #2d230f 0%, #b57d10 100%)', accent: '#FBBF24', emoji: '🎻' },
}

function ShowCard({ p, featured = false }: { p: any, featured?: boolean }) {
  const cfg = typeConfig[p.type] || typeConfig.theatre
  const score = p.combined_score
  const reviewCount = (p.critic_count || 0) + (p.audience_count || 0)

  const stars = score ? Array.from({ length: 5 }, (_, i) => {
    const full = Math.floor(score)
    const hasHalf = score - Math.floor(score) >= 0.25 && score - Math.floor(score) < 0.75
    if (i < full) return '★'
    if (i === full && hasHalf) return '½'
    return '☆'
  }) : null

  if (featured) {
    return (
      <a href={`/show/${p.production_id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#1e1e2e', border: '1px solid #2a2a3e', display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '200px' }}>
          <div style={{ background: cfg.gradient, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '48px' }}>{cfg.emoji}</span>
            <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: cfg.accent }}></div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.accent }}>{p.type}</span>
                <span style={{ color: '#4b5563', fontSize: '10px' }}>·</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{p.city}</span>
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 8px 0', lineHeight: '1.2' }}>{p.title}</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0' }}>{p.company}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{p.venue}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              {stars ? (
                <div>
                  <span style={{ color: '#1D9E75', fontSize: '16px', letterSpacing: '1px' }}>{stars.join('')}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#4b5563' }}>No reviews yet</span>
              )}
              <span style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', letterSpacing: '0.05em' }}>★ TOP RATED</span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={`/show/${p.production_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#1e1e2e', border: '1px solid #2a2a3e', transition: 'transform 0.15s, border-color 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = cfg.accent + '66' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3e' }}
      >
        <div style={{ background: cfg.gradient, height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '32px' }}>{cfg.emoji}</span>
          <div style={{ width: '24px', height: '2px', borderRadius: '1px', background: cfg.accent }}></div>
        </div>
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{ fontSize: '11px', color: cfg.accent, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{p.type}</p>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 3px 0', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</h3>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.city}</p>
          {stars ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#1D9E75', fontSize: '11px' }}>{stars.join('')}</span>
              <span style={{ fontSize: '10px', color: '#4b5563' }}>{reviewCount}r</span>
            </div>
          ) : (
            <span style={{ fontSize: '10px', color: '#374151' }}>No reviews</span>
          )}
        </div>
      </div>
    </a>
  )
}

function FilterDropdown({ label, options, values, onChange, allKey = 'all' }: { label: string, options: string[], values: string[], onChange: (v: string[]) => void, allKey?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isAll = values.length === 0 || (values.length === 1 && values[0] === allKey)
  const active = !isAll

  function toggle(opt: string) {
    if (opt === allKey) { onChange([allKey]); return }
    const without = values.filter(v => v !== allKey)
    if (without.includes(opt)) {
      const next = without.filter(v => v !== opt)
      onChange(next.length === 0 ? [allKey] : next)
    } else {
      onChange([...without, opt])
    }
  }

  const displayLabel = active
    ? values.length === 1
      ? values[0].charAt(0).toUpperCase() + values[0].slice(1)
      : `${label} (${values.length})`
    : label

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: active ? '#0f2d1a' : '#0f0f1a',
          border: `1px solid ${active ? '#1D9E75' : '#2a2a3e'}`,
          borderRadius: '6px',
          padding: '7px 12px',
          fontSize: '12px',
          color: active ? '#1D9E75' : '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
        <span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          background: '#1a1a2e',
          border: '1px solid #2a2a3e',
          borderRadius: '8px',
          overflow: 'hidden',
          zIndex: 100,
          minWidth: '160px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {options.map(opt => {
            const selected = values.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '9px 14px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: selected ? '#1D9E75' : '#9ca3af',
                  background: selected ? '#0f2d1a' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = '#1e1e2e' }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ width: '14px', height: '14px', border: `1px solid ${selected ? '#1D9E75' : '#4b5563'}`, borderRadius: '3px', background: selected ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: '#14141f' }}>{selected ? '✓' : ''}</span>
                {opt === allKey ? `All ${label.toLowerCase()}s` : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getTimingFilter(start: string, end: string, timing: string) {
  if (!timing || timing === 'all') return true
  const now = new Date()
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null
  const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  if (timing === 'now') return !!(startDate && startDate <= now && (!endDate || endDate >= now))
  if (timing === 'soon') return !!(startDate && startDate > now && startDate <= threeMonths)
  if (timing === 'later') return !!(startDate && startDate > threeMonths)
  if (timing === 'past') return !!(endDate && endDate < now)
  return true
}

export default function Home() {
  const [productions, setProductions] = useState<any[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([])
  const [cityFilter, setCityFilter] = useState<string[]>(['all'])
  const [typeFilter, setTypeFilter] = useState<string[]>(['all'])
  const [timingFilter, setTimingFilter] = useState<string[]>(['all'])
  const [companyFilter, setCompanyFilter] = useState<string[]>(['all'])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [nearestCity, setNearestCity] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    if (cityFilter.includes('all') || cityFilter.length === 0) { setCompanyFilter(['all']); setAvailableCompanies([]) }
  }, [cityFilter])

  useEffect(() => {
    const cityMap: Record<string, string> = {
      'melbourne': 'Melbourne', 'sydney': 'Sydney', 'brisbane': 'Brisbane',
      'perth': 'Perth', 'adelaide': 'Adelaide', 'hobart': 'Hobart',
      'geelong': 'Melbourne', 'gold coast': 'Brisbane', 'newcastle': 'Sydney',
      'auckland': 'Auckland', 'wellington': 'Wellington', 'christchurch': 'Christchurch',
      'london': 'London',
    }
    const covered = ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Hobart','Auckland','Wellington','Christchurch','London']
    fetch('https://ipapi.co/json/').then(r => r.json()).then(data => {
      const mapped = cityMap[(data.city || '').toLowerCase()]
      if (mapped && covered.includes(mapped)) setCityFilter([mapped])
      else if (mapped) setNearestCity(mapped)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.from('production_listing').select('*')
        .or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,venue.ilike.%${searchQuery}%`)
        .order('combined_score', { ascending: false, nullsFirst: false }).limit(8)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    async function fetchProductions() {
      let query = supabase.from('production_listing').select('*')
        .or(timingFilter.includes('past') && timingFilter.length === 1 ? `season_end.lt.${today}` : `season_end.is.null,season_end.gte.${today}`)
        .order('combined_score', { ascending: false, nullsFirst: false })
      const activeTypes = typeFilter.filter(t => t !== 'all')
      if (activeTypes.length > 0) query = query.in('type', activeTypes)
      const activeCities = cityFilter.filter(c => c !== 'all')
      if (activeCities.length > 0) query = query.in('city', activeCities)
      const activeCompanies = companyFilter.filter(c => c !== 'all')
      if (activeCompanies.length > 0) query = query.in('company', activeCompanies)
      const { data } = await query
      const activeTimings = timingFilter.filter(t => t !== 'all')
      const filtered = activeTimings.length === 0 ? (data || []) : (data || []).filter(p => activeTimings.some(t => getTimingFilter(p.season_start, p.season_end, t)))
      setProductions(filtered)
    }
    async function fetchFilters() {
      const { data } = await supabase.from('production_listing').select('city, type')
        .or(`season_end.is.null,season_end.gte.${today}`)
      if (data) {
        const cityOrder = ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Hobart','Auckland','Wellington','Christchurch','London']
        const foundCities = Array.from(new Set(data.map((p: any) => p.city).filter(Boolean))) as string[]
        setAvailableCities(['all', ...cityOrder.filter(c => foundCities.includes(c))])
        setAvailableTypes(['all', ...Array.from(new Set(data.map((p: any) => p.type).filter(Boolean))).sort() as string[]])
      }
      const activeCitiesForCompany = cityFilter.filter(c => c !== 'all')
      if (activeCitiesForCompany.length > 0) {
        const { data: cd } = await supabase.from('production_listing').select('company')
          .in('city', activeCitiesForCompany).or(`season_end.is.null,season_end.gte.${today}`)
        if (cd) setAvailableCompanies(Array.from(new Set(cd.map((p: any) => p.company).filter(Boolean))).sort() as string[])
      }
    }
    fetchProductions()
    fetchFilters()
  }, [typeFilter, cityFilter, timingFilter, companyFilter])

  const featured = productions[0]
  const rest = productions.slice(1)

  const timingOptions = [
    { key: 'all', label: 'All shows' },
    { key: 'now', label: 'Playing now' },
    { key: 'soon', label: 'Coming soon' },
    { key: 'later', label: 'Later' },
    { key: 'past', label: 'Past shows' },
  ]

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f' }}>
      <Header onSearch={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]) }} />

      {/* Filter bar */}
      <div style={{ position: 'sticky', top: '56px', zIndex: 90, backgroundColor: '#0f0f1a', borderBottom: '1px solid #1e1e2e', padding: '10px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterDropdown
            label="City"
            options={availableCities}
            values={cityFilter}
            onChange={v => { setCityFilter(v); setCompanyFilter(['all']) }}
          />
          {availableCompanies.length > 0 && (
            <FilterDropdown label="Company" options={['all', ...availableCompanies]} values={companyFilter} onChange={setCompanyFilter} />
          )}
          <FilterDropdown label="Type" options={availableTypes} values={typeFilter} onChange={setTypeFilter} />
          <FilterDropdown
            label="Timing"
            options={timingOptions.map(t => t.key)}
            values={timingFilter}
            onChange={setTimingFilter}
          />
        </div>
      </div>

      {/* Search */}
      {searchOpen && (
        <div style={{ backgroundColor: '#1a1a2e', borderBottom: '1px solid #2a2a3e', padding: '16px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search shows, companies, venues..."
              style={{ width: '100%', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '12px 16px', fontSize: '15px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searching && <p style={{ fontSize: '14px', color: '#6b7280', padding: '8px 0' }}>Searching...</p>}
                {!searching && searchResults.length === 0 && <p style={{ fontSize: '14px', color: '#6b7280', padding: '8px 0' }}>No results for "{searchQuery}"</p>}
                {searchResults.map(p => {
                  const cfg = typeConfig[p.type] || typeConfig.theatre
                  return (
                    <a key={p.production_id} href={`/show/${p.production_id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#0f0f1a', borderRadius: '8px', border: '1px solid #2a2a3e', textDecoration: 'none' }}>
                      <div style={{ width: '40px', height: '52px', borderRadius: '6px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{cfg.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#f1f5f9', fontWeight: '600' }}>{p.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.venue || p.company} · {p.city}</div>
                      </div>
                      {p.combined_score && <span style={{ color: '#1D9E75', fontSize: '13px' }}>{'★'.repeat(Math.round(p.combined_score))}</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Featured */}
        {featured && (
          <div style={{ marginBottom: '32px' }}>
            <ShowCard p={featured} featured />
          </div>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563' }}>All productions</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {rest.map(p => <ShowCard key={p.production_id} p={p} />)}
            </div>
          </>
        )}

        {productions.length === 0 && (
          <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '14px', paddingTop: '60px' }}>No shows match this filter.</p>
        )}
      </div>
    </main>
  )
}
