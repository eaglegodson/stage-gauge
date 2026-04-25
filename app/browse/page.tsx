'use client'

import { useState, useEffect, useRef } from 'react'
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
      <a href={'/show/' + p.production_id} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#1e1e2e', border: '1px solid #2a2a3e' }}>

          <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', lineHeight: '1' }}>{cfg.emoji}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.accent }}>{p.type}</span>
                <span style={{ color: '#4b5563', fontSize: '10px' }}>·</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{p.city}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#1D9E75', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '6px' }}>★ TOP RATED</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px 0', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h2>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.company}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.venue}</p>
            </div>
            <div style={{ marginTop: '10px' }}>
              {stars ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#1D9E75', fontSize: '15px', letterSpacing: '1px', flexShrink: 0 }}>{stars.join('')}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280', flexShrink: 0 }}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#4b5563' }}>No reviews yet</span>
              )}
            </div>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={'/show/' + p.production_id} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#1e1e2e', border: '1px solid #2a2a3e', transition: 'transform 0.15s, border-color 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = cfg.accent + '66' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3e' }}
      >

        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
              <span style={{ fontSize: '16px', lineHeight: '1' }}>{cfg.emoji}</span>
              <p style={{ fontSize: '10px', color: cfg.accent, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{p.type}</p>
            </div>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 2px 0', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h3>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.city}</p>
          </div>
          {stars ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ color: '#1D9E75', fontSize: '11px', flexShrink: 0 }}>{stars.join('')}</span>
              <span style={{ fontSize: '10px', color: '#4b5563', flexShrink: 0 }}>{reviewCount}r</span>
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
  const displayLabel = active ? values.length === 1 ? values[0].charAt(0).toUpperCase() + values[0].slice(1) : label + ' (' + values.length + ')' : label
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: active ? '#0f2d1a' : '#0f0f1a', border: '1px solid ' + (active ? '#1D9E75' : '#2a2a3e'), borderRadius: '6px', padding: '7px 12px', fontSize: '12px', color: active ? '#1D9E75' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
        {displayLabel}<span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', overflow: 'hidden', zIndex: 100, minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {options.map(opt => {
            const selected = values.includes(opt)
            return (
              <button key={opt} onClick={() => toggle(opt)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', textAlign: 'left', fontSize: '12px', color: selected ? '#1D9E75' : '#9ca3af', background: selected ? '#0f2d1a' : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = '#1e1e2e' }}
                onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ width: '14px', height: '14px', border: '1px solid ' + (selected ? '#1D9E75' : '#4b5563'), borderRadius: '3px', background: selected ? '#1D9E75' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: '#14141f' }}>{selected ? '✓' : ''}</span>
                {opt === allKey ? 'All ' + label.toLowerCase() + 's' : opt.charAt(0).toUpperCase() + opt.slice(1)}
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

export default function Browse() {
  const [productions, setProductions] = useState<any[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([])
  const [cityFilter, setCityFilter] = useState<string[]>(['all'])
  const [typeFilter, setTypeFilter] = useState<string[]>(['all'])
  const [timingFilter, setTimingFilter] = useState<string[]>(['now'])
  const [companyFilter, setCompanyFilter] = useState<string[]>(['all'])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [geoLoaded, setGeoLoaded] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus() }, [searchOpen])
  useEffect(() => { if (cityFilter.includes('all') || cityFilter.length === 0) { setCompanyFilter(['all']); setAvailableCompanies([]) } }, [cityFilter])

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
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const city = timezoneToCity[timezone]
    if (city) setCityFilter([city])
    setGeoLoaded(true)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.from('production_listing').select('*').or('title.ilike.%' + searchQuery + '%,company.ilike.%' + searchQuery + '%,venue.ilike.%' + searchQuery + '%').order('combined_score', { ascending: false, nullsFirst: false }).limit(8)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!geoLoaded) return
    const today = new Date().toISOString().split('T')[0]
    async function fetchProductions() {
      let query = supabase.from('production_listing').select('*').or(timingFilter.includes('past') && timingFilter.length === 1 ? 'season_end.lt.' + today : 'season_end.is.null,season_end.gte.' + today).order('combined_score', { ascending: false, nullsFirst: false })
      const activeCities = cityFilter.filter(c => c !== 'all')
      if (activeCities.length > 0) query = query.in('city', activeCities)
      const activeTypes = typeFilter.filter(t => t !== 'all')
      if (activeTypes.length > 0) query = query.in('type', activeTypes)
      const activeCompanies = companyFilter.filter(c => c !== 'all')
      if (activeCompanies.length > 0) query = query.in('company', activeCompanies)
      const { data } = await query
      const activeTimings = timingFilter.filter(t => t !== 'all')
      const filtered = activeTimings.length === 0 ? (data || []) : (data || []).filter((p: any) => activeTimings.some(t => getTimingFilter(p.season_start, p.season_end, t)))
      setProductions(filtered)
    }
    async function fetchFilters() {
      const { data } = await supabase.from('production_listing').select('city, type').or('season_end.is.null,season_end.gte.' + today)
      if (data) {
        const cityOrder = ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Hobart','Canberra','Auckland','Wellington','Christchurch','London']
        const foundCities = Array.from(new Set(data.map((p: any) => p.city).filter(Boolean))) as string[]
        setAvailableCities(['all', ...cityOrder.filter(c => foundCities.includes(c))])
        setAvailableTypes(['all', ...Array.from(new Set(data.map((p: any) => p.type).filter(Boolean))).sort() as string[]])
      }
      const activeCitiesForCompany = cityFilter.filter(c => c !== 'all')
      if (activeCitiesForCompany.length > 0) {
        const { data: cd } = await supabase.from('production_listing').select('company').in('city', activeCitiesForCompany).or('season_end.is.null,season_end.gte.' + today)
        if (cd) setAvailableCompanies(Array.from(new Set(cd.map((p: any) => p.company).filter(Boolean))).sort() as string[])
      }
    }
    fetchProductions()
    fetchFilters()
  }, [typeFilter, cityFilter, timingFilter, companyFilter, geoLoaded])

  const featured = productions[0]
  const rest = productions.slice(1)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#14141f', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Header onSearch={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]) }} />
      <div style={{ position: 'sticky', top: '56px', zIndex: 90, backgroundColor: '#0f0f1a', borderBottom: '1px solid #1e1e2e', padding: '10px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterDropdown label="City" options={availableCities} values={cityFilter} onChange={v => { setCityFilter(v); setCompanyFilter(['all']); posthog.capture('browse_filter_applied', { filter: 'city', values: v }) }} />
          {availableCompanies.length > 0 && <FilterDropdown label="Company" options={['all', ...availableCompanies]} values={companyFilter} onChange={v => { setCompanyFilter(v); posthog.capture('browse_filter_applied', { filter: 'company', values: v }) }} />}
          <FilterDropdown label="Type" options={availableTypes} values={typeFilter} onChange={v => { setTypeFilter(v); posthog.capture('browse_filter_applied', { filter: 'type', values: v }) }} />
          <FilterDropdown label="Timing" options={['all', 'now', 'soon', 'later', 'past']} values={timingFilter} onChange={v => { setTimingFilter(v); posthog.capture('browse_filter_applied', { filter: 'timing', values: v }) }} />
        </div>
      </div>
      {searchOpen && (
        <div style={{ backgroundColor: '#1a1a2e', borderBottom: '1px solid #2a2a3e', padding: '16px 16px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search shows, companies, venues..." style={{ width: '100%', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '12px 16px', fontSize: '15px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
            {searchQuery && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searching && <p style={{ fontSize: '14px', color: '#6b7280', padding: '8px 0' }}>Searching...</p>}
                {!searching && searchResults.length === 0 && <p style={{ fontSize: '14px', color: '#6b7280', padding: '8px 0' }}>No results</p>}
                {searchResults.map(p => {
                  const cfg = typeConfig[p.type] || typeConfig.theatre
                  return (
                    <a key={p.production_id} href={'/show/' + p.production_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#0f0f1a', borderRadius: '8px', border: '1px solid #2a2a3e', textDecoration: 'none' }}>
                      <div style={{ width: '40px', height: '52px', borderRadius: '6px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{cfg.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#f1f5f9', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.venue || p.company} · {p.city}</div>
                      </div>
                      {p.combined_score && <span style={{ color: '#1D9E75', fontSize: '13px', flexShrink: 0 }}>{('★'.repeat(Math.round(p.combined_score)))}</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        {!geoLoaded && <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '14px', paddingTop: '60px' }}>Detecting your location...</p>}
        {geoLoaded && featured && <div style={{ marginBottom: '24px' }}><ShowCard p={featured} featured /></div>}
        {geoLoaded && rest.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4b5563' }}>All productions</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1e1e2e' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: '12px', alignItems: 'stretch' }}>
              {rest.map(p => <ShowCard key={p.production_id} p={p} />)}
            </div>
          </>
        )}
        {geoLoaded && productions.length === 0 && <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '14px', paddingTop: '60px' }}>No shows match this filter.</p>}
      </div>
      <Footer />
    </main>
  )
}