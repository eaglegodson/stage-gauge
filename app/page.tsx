'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Header from './components/Header'

export default function Home() {
  const [productions, setProductions] = useState<any[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
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
    async function fetchProductions() {
      let query = supabase
        .from('production_listing')
        .select('*')
        .not('combined_score', 'is', null)
        .order('combined_score', { ascending: false })

      if (typeFilter !== 'all') query = query.eq('type', typeFilter)
      if (cityFilter !== 'all') query = query.eq('city', cityFilter)

      const { data, error } = await query
      if (!error) setProductions(data)
    }
    fetchProductions()
  }, [typeFilter, cityFilter])

  const typeFilters = ['all', 'theatre', 'musical', 'opera', 'ballet', 'dance']
  const cityFilters = ['all', 'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Auckland', 'Wellington', 'Christchurch', 'London']

  const featured = productions[0]
  const rest = productions.slice(1)

  return (
    <main style={{minHeight: '100vh', backgroundColor: '#F5F0E8'}}>
      <Header />

      {/* Filter bar */}
      <div style={{backgroundColor: '#1a2e1a', borderBottom: '1px solid #162316', padding: '0 24px', position: 'sticky', top: '56px', zIndex: 90}}>
        <div style={{maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', overflowX: 'auto'}}>
          <button
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); setSearchResults([]) }}
            style={{fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', borderRight: '1px solid #243824', padding: '10px 16px 10px 0', marginRight: '16px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0}}
          >
            {searchOpen ? '✕' : '🔍 Search'}
          </button>
          {typeFilters.map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{fontSize: '12px', fontWeight: typeFilter === f ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: typeFilter === f ? '2px solid #1D9E75' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: typeFilter === f ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div style={{width: '1px', height: '16px', backgroundColor: '#243824', margin: '0 8px', flexShrink: 0}}></div>
          {cityFilters.map((c) => (
            <button key={c} onClick={() => setCityFilter(c)} style={{fontSize: '12px', fontWeight: cityFilter === c ? '600' : '400', padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', borderBottom: cityFilter === c ? '2px solid #ffffff' : '2px solid transparent', cursor: 'pointer', backgroundColor: 'transparent', color: cityFilter === c ? '#ffffff' : '#6b7280', marginBottom: '-1px', flexShrink: 0}}>
              {c === 'all' ? 'All cities' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
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
                    <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E8E3DC', textDecoration: 'none', color: 'inherit'}}>
                      <div>
                        <div style={{fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: '600', color: '#111827'}}>{p.title}</div>
                        <div style={{fontSize: '13px', color: '#6b7280'}}>{p.company} · {p.city}</div>
                      </div>
                      {p.combined_score && <div style={{fontSize: '18px', fontWeight: 'bold', color: '#1D9E75'}}>{Math.round(p.combined_score)}</div>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{maxWidth: '1100px', margin: '0 auto', padding: '40px 24px'}}>

        {/* Featured */}
        {featured && (() => {
          const score = featured.combined_score ? Math.round(featured.combined_score) : null
          return (
            <a href={"/show/" + featured.production_id} style={{display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '40px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', padding: '40px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #E2DDD6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'}}>
                    <span style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75'}}>★ Top rated</span>
                    <span style={{fontSize: '10px', color: '#D1CBC0'}}>·</span>
                    <span style={{fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af'}}>{featured.type}</span>
                    <span style={{fontSize: '10px', color: '#D1CBC0'}}>·</span>
                    <span style={{fontSize: '10px', color: '#9ca3af'}}>{featured.city}</span>
                  </div>
                  <h2 style={{fontFamily: 'Georgia, serif', fontSize: '40px', fontWeight: '600', color: '#111827', lineHeight: '1.1', margin: '0 0 16px 0', letterSpacing: '-0.5px'}}>{featured.title}</h2>
                  <p style={{fontSize: '16px', color: '#4b5563', margin: '0 0 4px 0', fontWeight: '500'}}>{featured.company}</p>
                  <p style={{fontSize: '14px', color: '#9ca3af', margin: 0}}>{featured.venue}</p>
                </div>
                {score && (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #E2DDD6', paddingLeft: '40px', minWidth: '120px'}}>
                    <div style={{fontSize: '58px', fontWeight: '700', color: '#1D9E75', lineHeight: 1}}>{score}</div>
                    <div style={{display: 'flex', gap: '3px', margin: '12px 0'}}>
                      {[1,2,3,4,5].map((bar) => (
                        <div key={bar} style={{width: '7px', height: '22px', borderRadius: '2px', backgroundColor: score >= bar * 20 ? '#1D9E75' : '#E8E3DC'}}></div>
                      ))}
                    </div>
                    <div style={{fontSize: '11px', color: '#9ca3af', textAlign: 'center', lineHeight: '1.5'}}>Stage Gauge<br/>score</div>
                    <div style={{fontSize: '11px', color: '#9ca3af', marginTop: '8px'}}>{(featured.critic_count || 0) + (featured.audience_count || 0)} reviews</div>
                  </div>
                )}
              </div>
            </a>
          )
        })()}

        {/* Section label */}
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
          <span style={{fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', whiteSpace: 'nowrap'}}>All productions</span>
          <div style={{flex: 1, height: '1px', backgroundColor: '#E2DDD6'}}></div>
        </div>

        {/* Listings */}
        <div style={{backgroundColor: 'white', border: '1px solid #E2DDD6', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}>
          {rest.map((p, i) => {
            const score = p.combined_score ? Math.round(p.combined_score) : null
            return (
              <a key={p.production_id} href={"/show/" + p.production_id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '14px 24px', textDecoration: 'none', color: 'inherit', borderBottom: i < rest.length - 1 ? '1px solid #F5F0E8' : 'none', transition: 'background 0.1s'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0}}>
                  <span style={{fontSize: '12px', fontWeight: '600', color: '#D1CBC0', width: '24px', textAlign: 'right', flexShrink: 0}}>{i + 2}</span>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap'}}>
                      <span style={{fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '600', color: '#111827'}}>{p.title}</span>
                      <span style={{fontSize: '12px', color: '#9ca3af'}}>{p.company}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px'}}>
                      <span style={{fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize'}}>{p.type}</span>
                      <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                      <span style={{fontSize: '11px', color: '#9ca3af'}}>{p.city}</span>
                      <span style={{fontSize: '11px', color: '#D1CBC0'}}>·</span>
                      <span style={{fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{p.venue}</span>
                    </div>
                  </div>
                </div>
                {score && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0}}>
                    <div style={{display: 'flex', gap: '2px'}}>
                      {[1,2,3,4,5].map((bar) => (
                        <div key={bar} style={{width: '4px', height: '14px', borderRadius: '1px', backgroundColor: score >= bar * 20 ? '#1D9E75' : '#E8E3DC'}}></div>
                      ))}
                    </div>
                    <span style={{fontSize: '17px', fontWeight: '700', color: '#1D9E75', width: '32px', textAlign: 'right'}}>{score}</span>
                  </div>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}
